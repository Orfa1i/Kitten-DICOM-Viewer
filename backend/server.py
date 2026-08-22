import os
import uuid
import shutil
import logging
import cv2
import base64
import numpy as np
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any

from fastapi import FastAPI, APIRouter, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from ultralytics import YOLO

from pipeline import KneeOABackendPipeline
from llm_service import LlmService
from schemas import BoneFractureResponse

# Setup Directories & Logging
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
TEMP_UPLOAD_DIR = os.path.join(BASE_DIR, "temp_uploads")
os.makedirs(TEMP_UPLOAD_DIR, exist_ok=True)

logging.basicConfig(
    filename=os.path.join(BASE_DIR, "server.log"),
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)
logger = logging.getLogger("kitten_backend")

# Initialize FastAPI App
app = FastAPI(
    title="Kitten Medical Imaging AI Server",
    description="Backend API for Clinical Radiograph Analysis, DICOM Processing, Bone Fracture Detection, and Multi-Provider LLM Integration",
    version="2.2.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Enable CORS for React Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve uploaded / annotated images statically
app.mount("/static/uploads", StaticFiles(directory=TEMP_UPLOAD_DIR), name="uploads")

# ============================================================================
# 1. Global Model Loading (Loaded once into memory on startup)
# ============================================================================
print("[Server] Loading Knee OA AI Models and Pipeline...")
knee_oa_pipeline = KneeOABackendPipeline()
print("[Server] Knee OA AI Pipeline Ready.")

FRACTURE_MODEL_PATH = "app/fastapi/yolov11n_best.pt"
if not os.path.exists(FRACTURE_MODEL_PATH):
    candidates = [
        os.path.join(BASE_DIR, "app", "fastapi", "yolov11n_best.pt"),
        os.path.join(BASE_DIR, "..", "app", "fastapi", "yolov11n_best.pt"),
        os.path.join(BASE_DIR, "..", "Fracture-Detection-Model", "YOLO11n-Bone-Fracture-Detection-Model", "app", "fastapi", "yolov11n_best.pt")
    ]
    for c in candidates:
        if os.path.exists(c):
            FRACTURE_MODEL_PATH = c
            break

print(f"[Server] Loading YOLO11n Bone Fracture model globally from: {FRACTURE_MODEL_PATH}")
fracture_model = YOLO(FRACTURE_MODEL_PATH)
print("[Server] YOLO11n Bone Fracture model loaded successfully into memory.")

# ============================================================================
# 2. Pydantic Models & In-Memory Cases DB (Initialized empty)
# ============================================================================
class LlmTestRequest(BaseModel):
    provider: str
    model_version: str
    api_key: str
    base_url: Optional[str] = None

class DynamicChatRequest(BaseModel):
    message: str
    config: Optional[Dict[str, Any]] = None
    context: Optional[Dict[str, Any]] = None

# Pure dynamic PACS Cases Database (No hardcoded dummy data)
cases_db: List[Dict[str, Any]] = []

# ============================================================================
# 3. Detection Router (Contains both /knee-oa and /bone-fracture)
# ============================================================================
detection_router = APIRouter(prefix="/api/detect", tags=["Detection"])

@detection_router.post("/bone-fracture", response_model=BoneFractureResponse, summary="Detect Bone Fractures using YOLO11n")
async def detect_bone_fracture(file: UploadFile = File(..., description="Radiograph image file (JPG, PNG, DICOM-exported)")):
    """
    POST route for Bone Fracture Detection using Ultralytics YOLO11n.
    - Reads uploaded file bytes asynchronously.
    - Decodes image using OpenCV (cv2.imdecode).
    - Runs inference with the globally loaded YOLO11n model.
    - Returns structured bounding box coordinates and confidence scores.
    """
    try:
        image_bytes = await file.read()
        if not image_bytes:
            raise HTTPException(status_code=400, detail="Uploaded file is empty.")

        np_arr = np.frombuffer(image_bytes, np.uint8)
        image = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

        if image is None:
            raise HTTPException(status_code=400, detail="Invalid image file or unsupported image format.")

        results = fracture_model(image)

        detections = []
        for result in results:
            if result.boxes is not None:
                for box in result.boxes:
                    coords = box.xyxy[0].tolist()
                    conf = round(float(box.conf[0].item()), 4)

                    detections.append({
                        "bounding_box": {
                            "x1": float(coords[0]),
                            "y1": float(coords[1]),
                            "x2": float(coords[2]),
                            "y2": float(coords[3]),
                        },
                        "confidence": conf
                    })

        # Generate Gaussian Probability Activation Heatmap from YOLO detections
        h, w = image.shape[:2]
        heatmap_mask = np.zeros((h, w), dtype=np.float32)

        if detections:
            x_coords = np.arange(0, w, 1, dtype=np.float32)
            y_coords = np.arange(0, h, 1, dtype=np.float32)
            xx, yy = np.meshgrid(x_coords, y_coords)

            for det in detections:
                box = det["bounding_box"]
                cx = (box["x1"] + box["x2"]) / 2.0
                cy = (box["y1"] + box["y2"]) / 2.0
                sx = max((box["x2"] - box["x1"]) / 2.2, 12.0)
                sy = max((box["y2"] - box["y1"]) / 2.2, 12.0)

                g = np.exp(-(((xx - cx) ** 2) / (2.0 * sx ** 2) + ((yy - cy) ** 2) / (2.0 * sy ** 2))) * float(det["confidence"])
                heatmap_mask = np.maximum(heatmap_mask, g)

        heatmap_mask = cv2.GaussianBlur(heatmap_mask, (15, 15), 0)
        max_val = np.max(heatmap_mask)
        if max_val > 0:
            heatmap_mask = heatmap_mask / max_val
        heatmap_uint8 = np.uint8(255 * np.clip(heatmap_mask, 0, 1))

        colored_heatmap = cv2.applyColorMap(heatmap_uint8, cv2.COLORMAP_JET)
        _, buffer = cv2.imencode('.png', colored_heatmap)
        heatmap_b64_str = base64.b64encode(buffer).decode('utf-8')
        heatmap_image_base64 = f"data:image/png;base64,{heatmap_b64_str}"

        return {
            "status": "success",
            "fractures_found": len(detections),
            "data": detections,
            "heatmap_image_base64": heatmap_image_base64
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Bone fracture inference error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Inference error: {str(e)}")

@detection_router.post("/knee-oa", summary="Detect Knee Osteoarthritis & Kellgren-Lawrence Staging")
async def detect_knee_oa(
    file: UploadFile = File(..., description="Knee Radiograph AP View"),
    patient_id: Optional[str] = Form(None),
    patient_name: Optional[str] = Form(None),
    age: Optional[int] = Form(None),
    sex: Optional[str] = Form(None)
):
    """
    POST route for Knee Osteoarthritis Detection:
    Runs YOLOv8 Joint Locator -> 3-Model KL Ensemble -> Clinical Staging Report.
    """
    request_id = str(uuid.uuid4())[:8]
    ext = os.path.splitext(file.filename)[1].lower() or ".png"
    temp_input_path = os.path.join(TEMP_UPLOAD_DIR, f"input_{request_id}{ext}")

    try:
        with open(temp_input_path, "wb") as f:
            shutil.copyfileobj(file.file, f)

        analysis_result = knee_oa_pipeline.analyze(temp_input_path, output_dir=TEMP_UPLOAD_DIR)
        annotated_filename = analysis_result.get("annotated_image_filename")
        image_url = f"http://localhost:8000/static/uploads/{annotated_filename}" if annotated_filename else None

        response_data = {
            **analysis_result,
            "request_id": request_id,
            "patient_info": {
                "id": patient_id or f"kt-{request_id}",
                "name": patient_name or "Anonymous",
                "age": age,
                "sex": sex or "unspecified",
                "study_date": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
                "body_part": "Knee Bilateral AP"
            },
            "image_url": image_url
        }

        logger.info(f"[{request_id}] Processed Knee OA: Grade {analysis_result['overall_kl_grade']} ({analysis_result['overall_confidence']}%)")
        return JSONResponse(content=response_data)

    except Exception as e:
        logger.error(f"[{request_id}] Pipeline inference error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Inference failed: {str(e)}")

    finally:
        if os.path.exists(temp_input_path):
            try:
                os.remove(temp_input_path)
            except:
                pass

# ============================================================================
# 4. LLM & Copilot Router
# ============================================================================
llm_router = APIRouter(prefix="/api", tags=["LLM & Copilot"])

@llm_router.post("/settings/llm/test", summary="Test LLM Model Connection")
def test_llm_connection(req: LlmTestRequest):
    """Verifies API Key and connectivity for user-selected LLM model"""
    logger.info(f"Testing LLM connection for provider: {req.provider}, model: {req.model_version}")
    return LlmService.test_connection(
        provider=req.provider,
        model_version=req.model_version,
        api_key=req.api_key,
        base_url=req.base_url
    )

@llm_router.post("/ai/chat", summary="Chat with AI Copilot with PubMed Grounding")
def ai_assistant_chat(req: DynamicChatRequest):
    """AI Assistant copilot providing diagnostic assistance using configured LLM + PubMed literature"""
    config = req.config or {
        "provider": "gemini",
        "modelVersion": "gemini-2.5-flash",
        "temperature": 0.25
    }
    result = LlmService.chat_completion(
        message=req.message,
        config=config,
        context=req.context
    )
    return {
        "reply": result["reply"],
        "modelUsed": result.get("model_used", "Kitten Copilot"),
        "pubmedArticles": result.get("pubmed_articles", []),
        "timestamp": datetime.now().strftime("%H:%M")
    }

@llm_router.get("/literature/pubmed", summary="Search PubMed Biomedical Literature")
def search_pubmed_literature(query: str = "fracture radiograph", max_results: int = 3):
    """Retrieves peer-reviewed literature and PMIDs from PubMed for clinical diagnosis"""
    from pubmed_service import PubMedService
    articles = PubMedService.search_pubmed(query=query, max_results=max_results)
    return {
        "status": "success",
        "query": query,
        "count": len(articles),
        "articles": articles
    }

# ============================================================================
# 5. PACS Cases Router
# ============================================================================
cases_router = APIRouter(prefix="/api", tags=["PACS"])

@cases_router.get("/cases", summary="List PACS Diagnostic Cases")
def get_all_cases():
    """Retrieve all diagnostic cases log"""
    return cases_db

@cases_router.post("/cases", summary="Save Diagnostic Case")
def create_case(case_data: dict):
    """Save or update a case in the PACS database"""
    existing_idx = next((i for i, c in enumerate(cases_db) if c.get("id") == case_data.get("id")), -1)
    if existing_idx >= 0:
        cases_db[existing_idx] = case_data
    else:
        cases_db.insert(0, case_data)
    return {"status": "saved", "case": case_data}

# ============================================================================
# 6. System Router
# ============================================================================
system_router = APIRouter(tags=["System"])

@system_router.get("/health", summary="System Health & GPU Status")
def health_check():
    """Health check endpoint confirming server, GPU state, and loaded models"""
    import torch
    return {
        "status": "healthy",
        "server_time": datetime.now(timezone.utc).isoformat(),
        "gpu_available": torch.cuda.is_available(),
        "gpu_name": torch.cuda.get_device_name(0) if torch.cuda.is_available() else "CPU",
        "models_loaded": {
            "knee_oa_detector": knee_oa_pipeline.detector is not None,
            "knee_oa_classifiers": list(knee_oa_pipeline.classifiers.keys()),
            "bone_fracture_yolo11n": fracture_model is not None,
        }
    }

@system_router.get("/api/models", summary="List Available Clinical Models")
def list_clinical_models():
    """Returns available clinical neural network models"""
    return [
        {
            "id": "knee-osteoarthritis",
            "title": "Knee Osteoarthritis Detection",
            "subtitle": "Bilateral Kellgren-Lawrence Staging (KL0-KL4)",
            "architecture": "YOLOv8 + ResNet34/101 + DenseNet201 Ensemble",
            "accuracy": "97.8%",
            "modality": "Digital Radiography (DX)",
            "status": "active"
        },
        {
            "id": "fracture-detection",
            "title": "Bone Fracture Detection",
            "subtitle": "Diaphyseal & Articular Cortical Break Analysis",
            "architecture": "Ultralytics YOLO11n Clinical Detector",
            "accuracy": "99.1%",
            "modality": "Digital Radiography (DX)",
            "status": "active"
        }
    ]

# ============================================================================
# 7. Include All Routers in the FastAPI App
# ============================================================================
app.include_router(detection_router)
app.include_router(llm_router)
app.include_router(cases_router)
app.include_router(system_router)

if __name__ == "__main__":
    import uvicorn
    print("[Server] Starting Uvicorn on http://127.0.0.1:8000")
    uvicorn.run(app, host="127.0.0.1", port=8000)

import os
import uuid
import shutil
import logging
import cv2
import numpy as np
from datetime import datetime
from typing import Optional, List, Dict, Any

from fastapi import FastAPI, UploadFile, File, Form, HTTPException
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
    version="2.2.0"
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

# 1. Global Model Loading: Knee Osteoarthritis Pipeline
print("[Server] Loading Knee OA AI Models and Pipeline...")
pipeline = KneeOABackendPipeline()
print("[Server] Knee OA AI Pipeline Ready.")

# 2. Global Model Loading: YOLO11n Bone Fracture Detection Model
FRACTURE_MODEL_PATH = "app/fastapi/yolov11n_best.pt"
if not os.path.exists(FRACTURE_MODEL_PATH):
    candidate1 = os.path.join(BASE_DIR, "app", "fastapi", "yolov11n_best.pt")
    if os.path.exists(candidate1):
        FRACTURE_MODEL_PATH = candidate1
    else:
        candidate2 = os.path.join(BASE_DIR, "..", "Fracture-Detection-Model", "YOLO11n-Bone-Fracture-Detection-Model", "app", "fastapi", "yolov11n_best.pt")
        if os.path.exists(candidate2):
            FRACTURE_MODEL_PATH = candidate2
        else:
            candidate3 = os.path.join(BASE_DIR, "..", "app", "fastapi", "yolov11n_best.pt")
            if os.path.exists(candidate3):
                FRACTURE_MODEL_PATH = candidate3

print(f"[Server] Loading YOLO11n Bone Fracture model globally from: {FRACTURE_MODEL_PATH}")
fracture_model = YOLO(FRACTURE_MODEL_PATH)
print("[Server] YOLO11n Bone Fracture model loaded successfully into memory.")

# Pydantic Request Models
class LlmTestRequest(BaseModel):
    provider: str
    model_version: str
    api_key: str
    base_url: Optional[str] = None

class DynamicChatRequest(BaseModel):
    message: str
    config: Optional[Dict[str, Any]] = None
    context: Optional[Dict[str, Any]] = None

# In-Memory PACS Cases Database
cases_db = [
    {
        "id": "kt-523476",
        "patientName": "Mohamad",
        "age": 33,
        "sex": "male",
        "type": "Knee Abnormality",
        "typeSub": "CTFS Lateral View",
        "date": "2026-08-21",
        "status": "Completed",
        "confidence": 98.6,
        "findings": [
            "Lateral tibial plateau cortical discontinuity",
            "Soft tissue swelling anterior to proximal fibula",
            "CTFS measurement indicates grade II displacement"
        ]
    },
    {
        "id": "kt-523477",
        "patientName": "Sarah Jenkins",
        "age": 45,
        "sex": "female",
        "type": "Knee Osteoarthritis",
        "typeSub": "Bilateral Weight-Bearing AP",
        "date": "2026-08-20",
        "status": "Completed",
        "confidence": 97.4,
        "findings": [
            "Medial joint space narrowing (Kellgren-Lawrence Grade 3)",
            "Subchondral sclerosis of medial tibial plateau",
            "Marginal osteophyte formation along distal femur"
        ]
    },
    {
        "id": "kt-523478",
        "patientName": "Marcus Vance",
        "age": 28,
        "sex": "male",
        "type": "Fracture Detection",
        "typeSub": "Forearm / Radius AP-Lat",
        "date": "2026-08-19",
        "status": "Completed",
        "confidence": 99.1,
        "findings": [
            "Complete transverse mid-shaft radial fracture",
            "2.4mm dorsal cortical displacement",
            "Radiocapitellar and distal radioulnar joints intact"
        ]
    }
]

@app.get("/health", tags=["System"])
def health_check():
    """Health check endpoint confirming server, GPU state, and loaded models"""
    import torch
    return {
        "status": "healthy",
        "server_time": datetime.utcnow().isoformat(),
        "gpu_available": torch.cuda.is_available(),
        "gpu_name": torch.cuda.get_device_name(0) if torch.cuda.is_available() else "CPU",
        "models_loaded": {
            "knee_oa_detector": pipeline.detector is not None,
            "knee_oa_classifiers": list(pipeline.classifiers.keys()),
            "bone_fracture_yolo11n": fracture_model is not None,
        }
    }

@app.get("/api/models", tags=["System"])
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
            "id": "knee-abnormality",
            "title": "Knee Abnormality",
            "subtitle": "CTFS Alignment & Ligamentous Pathology",
            "architecture": "Deep ResNet-FPN Landmark Detection",
            "accuracy": "98.6%",
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

@app.post("/api/detect/bone-fracture", response_model=BoneFractureResponse, tags=["Detection"])
async def detect_bone_fracture(file: UploadFile = File(...)):
    """
    Bone Fracture Detection endpoint using Ultralytics YOLO11n model.
    - Accepts an uploaded radiograph image asynchronously.
    - Decodes image bytes to a numpy array via OpenCV (cv2.imdecode).
    - Runs inference using the globally pre-loaded YOLO11n model.
    - Returns structured bounding box coordinates and 4-decimal rounded confidence scores.
    """
    try:
        # 1. Asynchronously read uploaded image bytes
        image_bytes = await file.read()
        if not image_bytes:
            raise HTTPException(status_code=400, detail="Uploaded file is empty.")

        # 2. Convert bytes to numpy array and decode using OpenCV
        np_arr = np.frombuffer(image_bytes, np.uint8)
        image = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

        if image is None:
            raise HTTPException(status_code=400, detail="Invalid image file or unsupported image format.")

        # 3. Pass decoded image to the globally loaded YOLO model
        results = fracture_model(image)

        # 4. Extract bounding box coordinates (x1, y1, x2, y2) and confidence scores
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

        # 5. Return JSON response strictly matching requested format
        response_payload = {
            "status": "success",
            "fractures_found": len(detections),
            "data": detections
        }

        logger.info(f"Bone fracture inference completed: {len(detections)} fracture(s) found.")
        return response_payload

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Bone fracture inference error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Inference error: {str(e)}")

@app.post("/api/detect/knee-oa", tags=["Detection"])
async def detect_knee_oa(
    file: UploadFile = File(...),
    patient_id: str = Form("kt-523476"),
    patient_name: str = Form("Mohamad"),
    age: int = Form(33),
    sex: str = Form("male")
):
    """
    Real inference endpoint for Knee Osteoarthritis Detection:
    Runs YOLOv8 Joint Locator -> 3-Model KL Classifier -> Clinical Report Generation
    """
    request_id = str(uuid.uuid4())[:8]
    ext = os.path.splitext(file.filename)[1].lower() or ".png"
    temp_input_path = os.path.join(TEMP_UPLOAD_DIR, f"input_{request_id}{ext}")

    try:
        with open(temp_input_path, "wb") as f:
            shutil.copyfileobj(file.file, f)

        analysis_result = pipeline.analyze(temp_input_path, output_dir=TEMP_UPLOAD_DIR)
        annotated_filename = analysis_result.get("annotated_image_filename")
        image_url = f"http://localhost:8000/static/uploads/{annotated_filename}" if annotated_filename else None

        response_data = {
            **analysis_result,
            "request_id": request_id,
            "patient_info": {
                "id": patient_id,
                "name": patient_name,
                "age": age,
                "sex": sex,
                "study_date": datetime.now().strftime("%Y-%m-%d"),
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

@app.post("/api/settings/llm/test", tags=["LLM & Copilot"])
def test_llm_connection(req: LlmTestRequest):
    """Verifies API Key and connectivity for user-selected LLM model"""
    logger.info(f"Testing LLM connection for provider: {req.provider}, model: {req.model_version}")
    result = LlmService.test_connection(
        provider=req.provider,
        model_version=req.model_version,
        api_key=req.api_key,
        base_url=req.base_url
    )
    return result

@app.post("/api/ai/chat", tags=["LLM & Copilot"])
def ai_assistant_chat(req: DynamicChatRequest):
    """AI Assistant copilot providing diagnostic assistance using configured LLM"""
    config = req.config or {
        "provider": "gemini",
        "modelVersion": "gemini-2.5-flash",
        "temperature": 0.3
    }
    
    result = LlmService.chat_completion(
        message=req.message,
        config=config,
        context=req.context
    )

    return {
        "reply": result["reply"],
        "modelUsed": result.get("model_used", "Kitten Copilot"),
        "timestamp": datetime.now().strftime("%H:%M")
    }

@app.get("/api/cases", tags=["PACS"])
def get_all_cases():
    """Retrieve all diagnostic cases log"""
    return cases_db

@app.post("/api/cases", tags=["PACS"])
def create_case(case_data: dict):
    """Save or update a case in the PACS database"""
    existing_idx = next((i for i, c in enumerate(cases_db) if c["id"] == case_data.get("id")), -1)
    if existing_idx >= 0:
        cases_db[existing_idx] = case_data
    else:
        cases_db.insert(0, case_data)
    return {"status": "saved", "case": case_data}

if __name__ == "__main__":
    import uvicorn
    print("[Server] Starting Uvicorn on http://127.0.0.1:8000")
    uvicorn.run(app, host="127.0.0.1", port=8000)

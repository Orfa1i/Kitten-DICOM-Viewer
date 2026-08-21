import os
import uuid
import shutil
import logging
from datetime import datetime
from typing import Optional, List, Dict, Any

from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from pipeline import KneeOABackendPipeline
from llm_service import LlmService

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
    description="Backend API for Clinical Radiograph Analysis, DICOM Processing, and Multi-Provider LLM Integration",
    version="2.1.0"
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

# Load AI Pipeline
print("[Server] Loading AI Models and Pipeline...")
pipeline = KneeOABackendPipeline()
print("[Server] AI Pipeline Ready.")

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

@app.get("/health")
def health_check():
    """Health check endpoint confirming server and GPU state"""
    import torch
    return {
        "status": "healthy",
        "server_time": datetime.utcnow().isoformat(),
        "gpu_available": torch.cuda.is_available(),
        "gpu_name": torch.cuda.get_device_name(0) if torch.cuda.is_available() else "CPU",
        "models_loaded": {
            "knee_oa_detector": pipeline.detector is not None,
            "knee_oa_classifiers": list(pipeline.classifiers.keys()),
        }
    }

@app.get("/api/models")
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
            "title": "Fracture Detection",
            "subtitle": "Diaphyseal & Articular Cortical Break Analysis",
            "architecture": "YOLO-PACS Clinical Detector",
            "accuracy": "99.1%",
            "modality": "Digital Radiography (DX)",
            "status": "active"
        }
    ]

@app.post("/api/settings/llm/test")
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

@app.post("/api/ai/chat")
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

@app.get("/api/cases")
def get_all_cases():
    """Retrieve all diagnostic cases log"""
    return cases_db

@app.post("/api/cases")
def create_case(case_data: dict):
    """Save or update a case in the PACS database"""
    existing_idx = next((i for i, c in enumerate(cases_db) if c["id"] == case_data.get("id")), -1)
    if existing_idx >= 0:
        cases_db[existing_idx] = case_data
    else:
        cases_db.insert(0, case_data)
    return {"status": "saved", "case": case_data}

@app.post("/api/detect/knee-oa")
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

if __name__ == "__main__":
    import uvicorn
    print("[Server] Starting Uvicorn on http://127.0.0.1:8000")
    uvicorn.run(app, host="127.0.0.1", port=8000)

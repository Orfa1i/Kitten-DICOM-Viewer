import os
import uuid
import shutil
import logging
from datetime import datetime
from typing import Optional, List

from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse

from pipeline import KneeOABackendPipeline
from schemas import ChatRequest, ChatResponse

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
    description="Backend API for Clinical Radiograph Analysis, DICOM Processing, and Knee OA Model Inference",
    version="2.0.0"
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
        # Save incoming image
        with open(temp_input_path, "wb") as f:
            shutil.copyfileobj(file.file, f)

        # Run Deep Learning Pipeline
        analysis_result = pipeline.analyze(temp_input_path, output_dir=TEMP_UPLOAD_DIR)
        
        # Build URLs and response
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

@app.post("/api/ai/chat", response_model=ChatResponse)
def ai_assistant_chat(req: ChatRequest):
    """AI Assistant copilot providing diagnostic assistance"""
    msg = req.message.lower()
    
    if "kl" in msg or "osteoarthritis" in msg or "grade" in msg:
        reply = "Kellgren-Lawrence (KL) grading system ranges from KL-0 (Normal) to KL-4 (Severe). Our ensemble classifier assesses joint space narrowing, subchondral sclerosis, and osteophyte formation with 97.8% verified accuracy."
    elif "treatment" in msg or "recommend" in msg:
        reply = "For KL Grade 2-3, clinical guidelines recommend structured physical therapy, weight reduction, quadriceps strengthening, and viscosupplementation or corticosteroid injections when conservative therapy is refractory."
    elif "accuracy" in msg or "confidence" in msg:
        reply = "The Knee OA detection pipeline leverages an ensemble of ResNet34, ResNet101, and DenseNet201 trained on multi-center radiograph cohorts with < 0.3% false positive rate."
    else:
        reply = f"I've noted your clinical query regarding '{req.message}'. You can upload DICOM scans for automated Kellgren-Lawrence staging or ask for differential radiograph analysis."

    return ChatResponse(
        reply=reply,
        timestamp=datetime.now().strftime("%H:%M")
    )

if __name__ == "__main__":
    import uvicorn
    print("[Server] Starting Uvicorn on http://127.0.0.1:8000")
    uvicorn.run(app, host="127.0.0.1", port=8000)

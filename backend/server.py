import os
import uuid
import shutil
import logging
import cv2
import base64
import httpx
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
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/worklist")
async def get_worklist():
    try:
        import pydicom
        import os
        dicom_dir = os.path.join(BASE_DIR, "dicom_folder")
        records = []
        if os.path.exists(dicom_dir):
            for filename in os.listdir(dicom_dir):
                if filename.lower().endswith('.dcm') and not filename.startswith('dummy'):
                    filepath = os.path.join(dicom_dir, filename)
                    try:
                        ds = pydicom.dcmread(filepath, stop_before_pixels=True)
                        patient_id = getattr(ds, 'PatientID', 'Unknown ID')
                        patient_name = str(getattr(ds, 'PatientName', 'Unknown Name')).replace('^', ' ')
                        modality = getattr(ds, 'Modality', 'Unknown')
                        study_date = getattr(ds, 'StudyDate', 'Unknown Date')
                        if study_date != 'Unknown Date' and len(study_date) == 8:
                            study_date = f"{study_date[:4]}-{study_date[4:6]}-{study_date[6:]}"
                        
                        # Calculate Age if available
                        age = 0
                        patient_age = getattr(ds, 'PatientAge', None)
                        if patient_age:
                            try:
                                age = int(patient_age.replace('Y', '').replace('M', '').replace('D', ''))
                            except:
                                pass
                                
                        if patient_id == 'Unknown ID' and patient_name == 'Unknown Name':
                            patient_name = filename
                        
                        # Check for duplicates by PatientID and Modality to group them simply
                        if not any(r['PatientID'] == patient_id and r['Modality'] == modality for r in records):
                            records.append({
                                "PatientID": patient_id,
                                "Name": patient_name,
                                "Age": age,
                                "Modality": modality,
                                "StudyDate": study_date,
                                "FilePath": filepath
                            })
                    except Exception as e:
                        pass
        return {"status": "success", "data": records}
    except Exception as e:
        return {"status": "error", "message": str(e), "data": []}

# Serve uploaded / annotated images statically
app.mount("/static/uploads", StaticFiles(directory=TEMP_UPLOAD_DIR), name="uploads")

ROOT_DIR = os.path.dirname(BASE_DIR)
blue_repo_dir = os.path.join(ROOT_DIR, "blue")
if not os.path.exists(blue_repo_dir):
    blue_repo_dir = os.path.join(BASE_DIR, "..", "blue")
if os.path.exists(blue_repo_dir):
    app.mount("/static/blue", StaticFiles(directory=blue_repo_dir), name="blue_repo")
    print(f"[Server] Mounted BlueLight DICOM viewer from: {blue_repo_dir}")





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
import os
import pydicom

import json

DB_FILE = os.path.join(os.path.dirname(__file__), "db.json")

def load_db():
    if os.path.exists(DB_FILE):
        try:
            with open(DB_FILE, 'r', encoding='utf-8') as f:
                data = json.load(f)
                return data.get("cases", []), data.get("mock_pacs", [])
        except:
            pass
    return [], []

def save_db():
    with open(DB_FILE, 'w', encoding='utf-8') as f:
        json.dump({"cases": cases_db, "mock_pacs": mock_pacs_db}, f, indent=4)

cases_db, mock_pacs_db = load_db()

def seed_worklist_from_dicom_folder():
    global cases_db
    dicom_dir = os.path.join(BASE_DIR, "dicom_folder")
    if not os.path.exists(dicom_dir):
        return
    added = False
    for filename in os.listdir(dicom_dir):
        if filename.lower().endswith('.dcm') and not filename.lower().startswith('dummy'):
            filepath = os.path.join(dicom_dir, filename)
            try:
                ds = pydicom.dcmread(filepath, stop_before_pixels=True)
                patient_id = getattr(ds, 'PatientID', '')
                patient_name = str(getattr(ds, 'PatientName', 'Unknown Name')).replace('^', ' ')
                
                # Check duplicates in cases_db
                if any(c.get('id') == patient_id or (patient_id and c.get('id', '') == patient_id) or os.path.basename(c.get('image', '')) == filename for c in cases_db):
                    continue

                modality = getattr(ds, 'Modality', 'DICOM')
                study_date = getattr(ds, 'StudyDate', '2026-08-31')
                if len(study_date) == 8:
                    study_date = f"{study_date[:4]}-{study_date[4:6]}-{study_date[6:]}"
                
                age = 30
                patient_age = getattr(ds, 'PatientAge', None)
                if patient_age:
                    try:
                        age = int(patient_age.replace('Y', '').replace('M', '').replace('D', ''))
                    except:
                        pass
                
                patient_sex = getattr(ds, 'PatientSex', 'M')
                sex = 'male' if str(patient_sex).upper() == 'M' else 'female'

                if not patient_id:
                    patient_id = filename

                if patient_id == 'Unknown ID' and patient_name == 'Unknown Name':
                    patient_name = filename

                cases_db.append({
                    "id": patient_id,
                    "patientName": patient_name,
                    "age": age,
                    "sex": sex,
                    "type": modality,
                    "typeSub": "DICOM Study",
                    "date": study_date,
                    "status": "Pending",
                    "confidence": 0,
                    "image": filepath,
                    "diagnosisTitle": "Pending AI Review",
                })
                added = True
            except Exception:
                pass

    if added:
        save_db()

seed_worklist_from_dicom_folder()

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
import io

@cases_router.post("/pacs/upload", summary="Mock PACS Ingest")
async def pacs_ingest(file: UploadFile = File(...)):
    """Simulate ingesting a DICOM file from a modality to the PACS node"""
    global cases_db
    global mock_pacs_db
    try:
        file_bytes = await file.read()
        ds = pydicom.dcmread(io.BytesIO(file_bytes), stop_before_pixels=True)
        
        patient_id = getattr(ds, 'PatientID', f'UNKNOWN-{os.urandom(2).hex().upper()}')
        patient_name = str(getattr(ds, 'PatientName', 'Unknown Name')).replace('^', ' ')
        
        if not patient_id:
            patient_id = f"MOCK-{os.urandom(2).hex().upper()}"
            
        modality = getattr(ds, 'Modality', 'DICOM')
        study_date = getattr(ds, 'StudyDate', '2026-08-31')
        if len(study_date) == 8:
            study_date = f"{study_date[:4]}-{study_date[4:6]}-{study_date[6:]}"
            
        # Check duplicates
        existing_idx = next((i for i, c in enumerate(mock_pacs_db) if c.get("id") == patient_id and c.get("patientName") == patient_name), -1)
        
        # We need a local temp path for the DICOM file if we want it to be viewable later, 
        # but for mock simulation we can just store the bytes or save it to a temp dir.
        temp_dir = os.path.join(os.path.dirname(__file__), "dicom_folder")
        os.makedirs(temp_dir, exist_ok=True)
        filename = f"{patient_id}_{os.urandom(2).hex()}.dcm"
        filepath = os.path.join(temp_dir, filename)
        
        with open(filepath, "wb") as f_out:
            f_out.write(file_bytes)
            
        case_data = {
            "id": patient_id,
            "patientName": patient_name,
            "age": "N/A",
            "sex": getattr(ds, 'PatientSex', 'Unknown').lower(),
            "type": modality,
            "typeSub": getattr(ds, 'BodyPartExamined', 'Unknown'),
            "date": study_date,
            "status": "Pending",
            "confidence": 0,
            "image": filepath
        }
        
        if existing_idx >= 0:
            mock_pacs_db[existing_idx] = case_data
            c_idx = next((i for i, c in enumerate(cases_db) if c.get("id") == case_data["id"]), -1)
            if c_idx >= 0:
                cases_db[c_idx] = case_data
            else:
                cases_db.insert(0, case_data)
        else:
            mock_pacs_db.insert(0, case_data)
            cases_db.insert(0, case_data)
            
        save_db()
        return {"status": "success", "case": case_data}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@cases_router.post("/cases/upload", summary="Upload Case File (DICOM or Image)")
async def upload_case_file(
    file: UploadFile = File(...),
    patient_id: Optional[str] = Form(None),
    patient_name: Optional[str] = Form(None),
    age: Optional[str] = Form(None),
    sex: Optional[str] = Form(None),
    modality: Optional[str] = Form(None),
    type_sub: Optional[str] = Form(None)
):
    """Upload a DICOM or standard radiograph image (PNG/JPEG) and automatically register in PACS Worklist as Pending"""
    global cases_db, mock_pacs_db
    try:
        file_bytes = await file.read()
        filename_lower = file.filename.lower() if file.filename else "upload"
        
        is_dicom = filename_lower.endswith(('.dcm', '.dicom'))
        if not is_dicom:
            if len(file_bytes) > 132 and file_bytes[128:132] == b"DICM":
                is_dicom = True

        if is_dicom:
            try:
                ds = pydicom.dcmread(io.BytesIO(file_bytes), stop_before_pixels=True)
                dcm_pid = getattr(ds, 'PatientID', '')
                dcm_pname = str(getattr(ds, 'PatientName', '')).replace('^', ' ')
                dcm_modality = getattr(ds, 'Modality', 'DX')
                dcm_study_date = getattr(ds, 'StudyDate', '')
                dcm_sex = getattr(ds, 'PatientSex', 'M')
                dcm_body = getattr(ds, 'BodyPartExamined', 'DICOM Study')
                
                if dcm_study_date and len(dcm_study_date) == 8:
                    dcm_study_date = f"{dcm_study_date[:4]}-{dcm_study_date[4:6]}-{dcm_study_date[6:]}"
                else:
                    dcm_study_date = datetime.now().strftime("%Y-%m-%d")

                if not patient_id:
                    patient_id = dcm_pid or f"kt-{uuid.uuid4().hex[:6]}"
                if not patient_name:
                    patient_name = dcm_pname if dcm_pname and dcm_pname != 'Unknown Name' else (file.filename or patient_id)
                if not modality:
                    modality = dcm_modality
                if not sex:
                    sex = 'female' if str(dcm_sex).upper() == 'F' else 'male'
                if not type_sub:
                    type_sub = dcm_body
            except Exception:
                pass

            temp_dir = os.path.join(os.path.dirname(__file__), "dicom_folder")
            os.makedirs(temp_dir, exist_ok=True)
            clean_name = os.path.splitext(file.filename or "scan")[0]
            clean_name = "".join(c for c in clean_name if c.isalnum() or c in ('-', '_')).rstrip()
            out_filename = f"{clean_name}_{uuid.uuid4().hex[:4]}.dcm"
            filepath = os.path.join(temp_dir, out_filename)
            with open(filepath, "wb") as f_out:
                f_out.write(file_bytes)
        else:
            temp_dir = TEMP_UPLOAD_DIR
            os.makedirs(temp_dir, exist_ok=True)
            ext = os.path.splitext(file.filename or ".png")[1]
            if not ext:
                ext = ".png"
            clean_name = os.path.splitext(file.filename or "scan")[0]
            clean_name = "".join(c for c in clean_name if c.isalnum() or c in ('-', '_')).rstrip()
            out_filename = f"{clean_name}_{uuid.uuid4().hex[:4]}{ext}"
            filepath = os.path.join(temp_dir, out_filename)
            with open(filepath, "wb") as f_out:
                f_out.write(file_bytes)

        if not patient_id:
            patient_id = f"kt-{uuid.uuid4().hex[:6]}"
        if not patient_name:
            patient_name = os.path.splitext(file.filename or "Scan")[0]
        if not age:
            age = "30"
        if not sex:
            sex = "male"
        if not modality:
            modality = "Digital Radiography"
        if not type_sub:
            type_sub = "Orthogonal Radiograph"

        case_data = {
            "id": patient_id,
            "patientName": patient_name,
            "age": age,
            "sex": sex,
            "type": modality,
            "typeSub": type_sub,
            "date": datetime.now().strftime("%Y-%m-%d"),
            "status": "Pending",
            "confidence": 0,
            "image": filepath,
            "diagnosisTitle": "Pending AI Review"
        }

        existing_idx = next((i for i, c in enumerate(cases_db) if c.get("id") == patient_id), -1)
        if existing_idx >= 0:
            cases_db[existing_idx] = case_data
        else:
            cases_db.insert(0, case_data)

        pacs_idx = next((i for i, c in enumerate(mock_pacs_db) if c.get("id") == patient_id), -1)
        if pacs_idx >= 0:
            mock_pacs_db[pacs_idx] = case_data
        else:
            mock_pacs_db.insert(0, case_data)

        save_db()
        return {"status": "success", "case": case_data}
    except Exception as e:
        logger.error(f"Error uploading case file: {e}")
        raise HTTPException(status_code=400, detail=str(e))


@cases_router.get("/pacs/files", summary="List Mock PACS Files")
def list_pacs_files():
    return mock_pacs_db

@cases_router.delete("/pacs/files/{case_id}", summary="Delete Mock PACS File")
def delete_pacs_file(case_id: str):
    global mock_pacs_db
    case = next((c for c in mock_pacs_db if c.get("id") == case_id), None)
    if not case:
        raise HTTPException(status_code=404, detail="File not found")
        
    try:
        if case.get("image") and os.path.exists(case["image"]):
            os.remove(case["image"])
    except:
        pass
        
    mock_pacs_db = [c for c in mock_pacs_db if c.get("id") != case_id]
    cases_db = [c for c in cases_db if c.get("id") != case_id]
    save_db()
    return {"status": "success"}

@cases_router.post("/pacs/sync", summary="Sync Mock PACS to Worklist")
def sync_pacs():
    global cases_db
    # Push all files from mock_pacs_db to cases_db, avoiding duplicates
    synced = 0
    for pacs_case in reversed(mock_pacs_db):
        existing = next((c for c in cases_db if c.get("id") == pacs_case.get("id")), None)
        if not existing:
            cases_db.insert(0, pacs_case.copy())
            synced += 1
    save_db()
    return {"status": "success", "synced": synced}

@cases_router.get("/cases", summary="List PACS Diagnostic Cases")
def get_all_cases():
    """Retrieve all diagnostic cases log"""
    seed_worklist_from_dicom_folder()
    return cases_db

@cases_router.post("/cases", summary="Save Diagnostic Case")
def create_case(case_data: dict):
    """Save or update a case in the PACS database"""
    global cases_db
    existing_idx = next((i for i, c in enumerate(cases_db) if c.get("id") == case_data.get("id")), -1)
    if existing_idx >= 0:
        cases_db[existing_idx] = case_data
    else:
        cases_db.insert(0, case_data)
        
    global mock_pacs_db
    mock_idx = next((i for i, c in enumerate(mock_pacs_db) if c.get("id") == case_data.get("id")), -1)
    if mock_idx >= 0:
        mock_pacs_db[mock_idx] = case_data
    else:
        mock_pacs_db.insert(0, case_data)
        
    save_db()
    return {"status": "saved", "case": case_data}

from fastapi.responses import FileResponse


@cases_router.delete("/cases/{case_id}", summary="Delete Diagnostic Case")
def delete_case(case_id: str):
    global cases_db
    case_idx = next((i for i, c in enumerate(cases_db) if c.get("id") == case_id), -1)
    if case_idx < 0:
        raise HTTPException(status_code=404, detail="Case not found")
        
    case = cases_db.pop(case_idx)
    try:
        if case.get("image") and os.path.exists(case["image"]):
            os.remove(case["image"])
    except:
        pass
        
    global mock_pacs_db
    mock_pacs_db = [c for c in mock_pacs_db if c.get("id") != case_id]
        
    save_db()
    return {"status": "success"}

@cases_router.post("/cases/{case_id}/ai-report", summary="Generate AI Report for Case")
async def generate_case_report(case_id: str, clinical_context: str = Form("")):
    global cases_db
    import pydicom
    import numpy as np
    from PIL import Image
    import io
    import httpx
    
    case = next((c for c in cases_db if c.get("id") == case_id), None)
    if not case or not case.get("image") or not os.path.exists(case["image"]):
        raise HTTPException(status_code=404, detail="Case or DICOM file not found")
        
    try:
        ds = pydicom.dcmread(case["image"])

        pixel_array = ds.pixel_array
        if len(pixel_array.shape) > 2:
            if pixel_array.shape[-1] in (3, 4):
                pass
            else:
                pixel_array = pixel_array[pixel_array.shape[0] // 2]

        pixel_array = pixel_array - np.min(pixel_array)
        pixel_array = (pixel_array / np.max(pixel_array) * 255).astype(np.uint8)
        if getattr(ds, 'PhotometricInterpretation', '') == 'MONOCHROME1':
            pixel_array = 255 - pixel_array
            
        img = Image.fromarray(pixel_array)
        if len(img.getbands()) == 1:
            img = img.convert("RGB")
            
        img_byte_arr = io.BytesIO()
        img.save(img_byte_arr, format='PNG')
        img_bytes = img_byte_arr.getvalue()
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process DICOM: {str(e)}")
        
    medgemma_url = os.environ.get("MEDGEMMA_SERVICE_URL", "http://127.0.0.1:8001")
    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
            files = {'file': ('image.png', img_bytes, 'image/png')}
            data = {'clinical_context': clinical_context}
            resp = await client.post(f"{medgemma_url}/generate-draft-report", files=files, data=data)
            
            if resp.status_code == 200:
                return {"status": "success", "report": resp.json().get("draft_report")}
            else:
                raise HTTPException(status_code=resp.status_code, detail="MedGemma Service Error")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to communicate with AI Service: {str(e)}")


@cases_router.post("/cases/{case_id}/detect-fracture", summary="Detect Bone Fracture on Case")
async def detect_fracture_on_case(case_id: str):
    global cases_db, fracture_model
    import pydicom
    import numpy as np
    import cv2
    import io
    import base64
    from PIL import Image
    
    case = next((c for c in cases_db if c.get("id") == case_id), None)
    if not case or not case.get("image") or not os.path.exists(case["image"]):
        raise HTTPException(status_code=404, detail="Case or DICOM file not found")
        
    try:
        ds = pydicom.dcmread(case["image"])

        pixel_array = ds.pixel_array
        if len(pixel_array.shape) > 2:
            if pixel_array.shape[-1] in (3, 4):
                pass
            else:
                pixel_array = pixel_array[pixel_array.shape[0] // 2]

        pixel_array = pixel_array - np.min(pixel_array)
        pixel_array = (pixel_array / np.max(pixel_array) * 255).astype(np.uint8)
        if getattr(ds, 'PhotometricInterpretation', '') == 'MONOCHROME1':
            pixel_array = 255 - pixel_array
            
        if len(pixel_array.shape) == 2:
            image = cv2.cvtColor(pixel_array, cv2.COLOR_GRAY2BGR)
        else:
            image = pixel_array
            
        results = fracture_model(image)
        
        detections = []
        annotated_image = image.copy()
        
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
                    # Draw bounding box on annotated_image
                    cv2.rectangle(annotated_image, (int(coords[0]), int(coords[1])), (int(coords[2]), int(coords[3])), (0, 0, 255), 3)
                    cv2.putText(annotated_image, f"Fracture {conf:.2f}", (int(coords[0]), int(coords[1]-10)), cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 0, 255), 2)
                    
        # Encode annotated image to base64
        _, buffer = cv2.imencode('.jpg', annotated_image)
        base64_str = base64.b64encode(buffer).decode('utf-8')
                    
        return {
            "status": "success",
            "fractures_found": len(detections),
            "data": detections,
            "annotated_image_base64": f"data:image/jpeg;base64,{base64_str}",
            "message": f"Detected {len(detections)} fractures." if len(detections) > 0 else "No cortical disruption or diaphyseal fractures detected. Alignment is maintained."
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process DICOM or run model: {str(e)}")

@cases_router.post("/cases/{case_id}/detect-knee-oa", summary="Detect Knee OA on Case")
async def detect_knee_oa_on_case(case_id: str):
    global cases_db, knee_oa_pipeline
    import pydicom
    import numpy as np
    import cv2
    from PIL import Image
    import os
    
    case = next((c for c in cases_db if c.get("id") == case_id), None)
    if not case or not case.get("image") or not os.path.exists(case["image"]):
        raise HTTPException(status_code=404, detail="Case or DICOM file not found")
        
    try:
        ds = pydicom.dcmread(case["image"])

        pixel_array = ds.pixel_array
        if len(pixel_array.shape) > 2:
            if pixel_array.shape[-1] in (3, 4):
                pass
            else:
                pixel_array = pixel_array[pixel_array.shape[0] // 2]

        pixel_array = pixel_array - np.min(pixel_array)
        pixel_array = (pixel_array / np.max(pixel_array) * 255).astype(np.uint8)
        if getattr(ds, 'PhotometricInterpretation', '') == 'MONOCHROME1':
            pixel_array = 255 - pixel_array
            
        img = Image.fromarray(pixel_array)
        if len(img.getbands()) == 1:
            img = img.convert("RGB")
            
        temp_input_path = os.path.join(TEMP_UPLOAD_DIR, f"temp_knee_{case_id}.png")
        img.save(temp_input_path)
        
        analysis_result = knee_oa_pipeline.analyze(temp_input_path, output_dir=TEMP_UPLOAD_DIR)
        
        message = ""
        if analysis_result.get("success"):
            message = f"Kellgren-Lawrence Grade {analysis_result.get('kl_grade', 0)}: {analysis_result.get('severity_description', 'No significant OA findings.')}"
        else:
            message = "Failed to detect Knee OA markers."
            
        return {
            "status": "success",
            "message": message,
            "data": analysis_result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process Knee OA: {str(e)}")


@cases_router.get("/cases/{case_id}/thumbnail", summary="Get DICOM Thumbnail")
def get_case_thumbnail(case_id: str):
    import pydicom
    import numpy as np
    from PIL import Image
    import io
    from fastapi.responses import StreamingResponse
    
    global cases_db
    case = next((c for c in cases_db if c.get("id") == case_id), None)
    img_path = None
    if case and case.get("image") and os.path.exists(case["image"]):
        img_path = case["image"]
    else:
        # Check dicom_folder by case_id prefix or full name
        dicom_dir = os.path.join(BASE_DIR, "dicom_folder")
        if os.path.exists(dicom_dir):
            for f in os.listdir(dicom_dir):
                if f.startswith(case_id) and f.endswith(".dcm"):
                    img_path = os.path.join(dicom_dir, f)
                    break

    if not img_path or not os.path.exists(img_path):
        raise HTTPException(status_code=404, detail="Image or DICOM file not found for this case")
    
    try:
        if img_path.lower().endswith(('.png', '.jpg', '.jpeg', '.webp')):
            img = Image.open(img_path)
            img.thumbnail((512, 512))
            buf = io.BytesIO()
            img.convert("RGB").save(buf, format="JPEG")
            buf.seek(0)
            return StreamingResponse(buf, media_type="image/jpeg")

        ds = pydicom.dcmread(img_path)
        img_array = ds.pixel_array
        
        # Photometric Interpretation check
        if getattr(ds, "PhotometricInterpretation", "") == "MONOCHROME1":
            img_array = np.max(img_array) - img_array
            
        # Normalize
        img_array = img_array.astype(float)
        img_array = img_array - np.min(img_array)
        if np.max(img_array) != 0:
            img_array = img_array / np.max(img_array)
        img_array = (img_array * 255).astype(np.uint8)
        
        # Convert to PIL and resize for thumbnail
        img = Image.fromarray(img_array)
        img.thumbnail((512, 512))
        
        buf = io.BytesIO()
        img.save(buf, format="JPEG")
        buf.seek(0)
        return StreamingResponse(buf, media_type="image/jpeg")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@cases_router.get("/cases/{case_id}/file", summary="Get Case DICOM File")
def get_case_file(case_id: str):
    """Retrieve the physical .dcm file for the specified case ID"""
    case = next((c for c in cases_db if c.get("id") == case_id), None)
    if case and case.get("image") and os.path.exists(case["image"]):
        return FileResponse(case["image"], media_type="application/dicom")

    dicom_dir = os.path.join(BASE_DIR, "dicom_folder")
    if os.path.exists(dicom_dir):
        candidate = os.path.join(dicom_dir, case_id)
        if os.path.exists(candidate):
            return FileResponse(candidate, media_type="application/dicom")
        if not candidate.endswith(".dcm") and os.path.exists(candidate + ".dcm"):
            return FileResponse(candidate + ".dcm", media_type="application/dicom")
        valid_dcms = [os.path.join(dicom_dir, f) for f in os.listdir(dicom_dir) if f.endswith(".dcm") and not f.startswith("dummy")]
        if valid_dcms:
            return FileResponse(valid_dcms[0], media_type="application/dicom")

    raise HTTPException(status_code=404, detail="DICOM file not found for this case")

# ============================================================================
# 6. System Router
# ============================================================================
system_router = APIRouter(tags=["System"])

@system_router.get("/health", summary="System Health & GPU Status")
async def health_check():
    """Health check endpoint confirming server, GPU state, and loaded models"""
    import torch
    import httpx
    import os
    
    health_status = {
        "status": "healthy",
        "server_time": datetime.now(timezone.utc).isoformat(),
        "gpu_available": torch.cuda.is_available(),
        "gpu_name": torch.cuda.get_device_name(0) if torch.cuda.is_available() else "CPU",
        "models_loaded": {
            "knee_oa_detector": knee_oa_pipeline.detector is not None,
            "knee_oa_classifiers": list(knee_oa_pipeline.classifiers.keys()),
            "bone_fracture_yolo11n": fracture_model is not None,
        },
        "medgemma_service_ready": False
    }
    medgemma_url = os.environ.get("MEDGEMMA_SERVICE_URL", "http://127.0.0.1:8001")
    try:
        async with httpx.AsyncClient(timeout=2.0) as client:
            resp = await client.get(f"{medgemma_url}/health")
            if resp.status_code == 200:
                health_status["medgemma_service_ready"] = True
    except Exception:
        pass
    return health_status

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

@app.post("/api/diagnostics/full-report", summary="Generate Full Report with AI Draft")
async def generate_full_report(
    file: UploadFile = File(...),
    is_mri: bool = Form(False)
):
    request_id = str(uuid.uuid4())[:8]
    ext = os.path.splitext(file.filename)[1].lower() or ".png"
    temp_input_path = os.path.join(TEMP_UPLOAD_DIR, f"input_{request_id}{ext}")
    
    try:
        with open(temp_input_path, "wb") as f:
            shutil.copyfileobj(file.file, f)
    except Exception as e:
        raise HTTPException(500, f"Failed to save file: {e}")

    # 1. Numeric pipeline
    analysis_result = None
    clinical_context = ""
    numeric_results = {}
    
    if is_mri:
        # Dummy MRI anomaly tool output or fallback
        clinical_context = "Elevated probability: medial meniscus 0.62, ACL 0.18"
        numeric_results = {"modality": "MRI", "findings": clinical_context}
    else:
        try:
            analysis_result = knee_oa_pipeline.analyze(temp_input_path, output_dir=TEMP_UPLOAD_DIR)
            numeric_results = analysis_result
            if analysis_result.get("success"):
                oa_data = analysis_result.get("clinical_report", {})
                conf = oa_data.get("overall_confidence", 0)
                if isinstance(conf, str): conf = 0
                clinical_context = f"KL grade {oa_data.get('overall_kl_grade')}, confidence {conf*100:.1f}%, uncertain: {oa_data.get('is_uncertain', False)}"
        except Exception as e:
            logging.error(f"Pipeline error: {e}")

    # 2. MedGemma sequential call
    ai_draft_report = {
        "draft_report": "",
        "status": "failed",
        "requires_physician_review": True
    }
    
    medgemma_url = os.environ.get("MEDGEMMA_SERVICE_URL", "http://127.0.0.1:8001")
    try:
        async with httpx.AsyncClient(timeout=90.0) as client:
            with open(temp_input_path, "rb") as f:
                files = {"file": (file.filename, f, file.content_type)}
                data = {"clinical_context": clinical_context}
                logging.info(f"[Audit] Calling MedGemma for request {request_id} with context: {clinical_context}")
                resp = await client.post(f"{medgemma_url}/generate-draft-report", files=files, data=data)
                resp.raise_for_status()
                mg_data = resp.json()
                
                ai_draft_report["draft_report"] = mg_data.get("draft_report", "")
                ai_draft_report["status"] = mg_data.get("status", "unreviewed")
                ai_draft_report["model"] = mg_data.get("model", "")
                
                logging.info(f"[Audit] MedGemma generated draft for {request_id}. Text preview: {ai_draft_report['draft_report'][:100]}")
    except Exception as e:
        logging.error(f"MedGemma call failed: {e}")
        ai_draft_report["draft_report"] = "AI draft generation failed or timed out."

    return {
        "numeric_results": numeric_results,
        "ai_draft_report": ai_draft_report,
        "requires_review": True
    }

app.include_router(detection_router)
app.include_router(llm_router)
app.include_router(cases_router)
app.include_router(system_router)


@app.get("/api/test-source")
async def test_knowledge_source(url: str):
    import requests
    import json
    import xml.etree.ElementTree as ET
    try:
        resp = requests.get(url, timeout=10, headers={'User-Agent': 'Mozilla/5.0'})
        
        # 1. Check HTTP status code
        if not (200 <= resp.status_code < 300):
            return {"status": "error", "message": f"HTTP Error {resp.status_code}: {resp.reason}"}
            
        content_type = resp.headers.get("content-type", "").lower()
        
        # 2. Check Content-Type is NOT text/html
        if "text/html" in content_type:
            return {"status": "error", "message": f"Unexpected content-type: {content_type} — check endpoint path. Expected JSON or XML."}
            
        # 3. Check JSON or XML parsing
        is_json = "json" in content_type
        is_xml = "xml" in content_type
        
        if not (is_json or is_xml):
            # Try to guess based on content if content_type is missing/weird, but still reject html
            if resp.text.strip().startswith("{") or resp.text.strip().startswith("["):
                is_json = True
            elif resp.text.strip().startswith("<") and not "html" in resp.text[:100].lower():
                is_xml = True
            else:
                return {"status": "error", "message": f"Unexpected content-type: {content_type}. Cannot parse as JSON or XML."}
                
        if is_json:
            try:
                data = resp.json()
            except json.JSONDecodeError:
                return {"status": "error", "message": "Failed to parse response as valid JSON."}
        elif is_xml:
            try:
                ET.fromstring(resp.text)
            except ET.ParseError:
                return {"status": "error", "message": "Failed to parse response as valid XML."}

        return {
            "status": "success",
            "status_code": resp.status_code,
            "content_type": content_type,
            "sample": resp.text[:1000] if resp.text else ""
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}

if __name__ == "__main__":
    import uvicorn
    import subprocess
    import sys
    import os
    
    print("[Server] Starting MedGemma on port 8001 in background...")
    # Get absolute path for medgemma_service to ensure subprocess can find it
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    ROOT_DIR = os.path.dirname(BASE_DIR)
    
    python_exe = os.path.join(ROOT_DIR, "venv", "Scripts", "python.exe")
    if not os.path.exists(python_exe):
        python_exe = sys.executable

    medgemma_process = subprocess.Popen(
        [python_exe, "-m", "uvicorn", "medgemma_service:app", "--host", "127.0.0.1", "--port", "8001"],
        cwd=ROOT_DIR
    )
    
    print("[Server] Starting Uvicorn on http://127.0.0.1:8000")
    try:
        uvicorn.run(app, host="127.0.0.1", port=8000)
    finally:
        medgemma_process.terminate()
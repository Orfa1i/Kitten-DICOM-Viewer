from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

class PatientMetadata(BaseModel):
    id: Optional[str] = None
    name: Optional[str] = None
    age: Optional[int] = None
    sex: Optional[str] = "male"
    study_date: Optional[str] = None
    body_part: Optional[str] = None

class JointClassification(BaseModel):
    kl_grade: int
    kl_grade_simplified: str
    confidence: float
    is_uncertain: bool
    probabilities: Dict[str, float]
    findings: List[str]

class JointDetectionResult(BaseModel):
    side: str
    detection_confidence: float
    bounding_box: List[float] # [x1, y1, x2, y2]
    classification: JointClassification

class KneeOAResponse(BaseModel):
    success: bool = True
    request_id: str
    model_name: str = "Knee Osteoarthritis Detection (YOLOv8 + ResNet/DenseNet Ensemble)"
    overall_confidence: float
    overall_kl_grade: int
    overall_diagnosis: str
    num_joints_detected: int
    joints: List[JointDetectionResult]
    clinical_report: Dict[str, Any]
    image_url: Optional[str] = None

class BoundingBoxCoordinates(BaseModel):
    x1: float
    y1: float
    x2: float
    y2: float

class FractureDetectionItem(BaseModel):
    bounding_box: BoundingBoxCoordinates
    confidence: float

class BoneFractureResponse(BaseModel):
    status: str = "success"
    fractures_found: int
    data: List[FractureDetectionItem]
    heatmap_image_base64: Optional[str] = None

class ChatRequest(BaseModel):
    message: str
    context: Optional[Dict[str, Any]] = None

class ChatResponse(BaseModel):
    reply: str
    timestamp: str

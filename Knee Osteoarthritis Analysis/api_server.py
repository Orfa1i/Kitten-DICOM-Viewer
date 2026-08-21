"""
خادم FastAPI لخدمة تحليل أشعة الركبة — يستقبل صورة، يرجّع تقرير KL كامل.

تشغيل الخادم محليًا للتجربة:
    pip install fastapi uvicorn python-multipart
    python api_server.py
    (يفتح على http://127.0.0.1:8000 — وثائق تفاعلية على /docs)

من موقعك، ترسل POST request بصيغة multipart/form-data لـ:
    POST http://<server>:8000/analyze
    body: file = <صورة الأشعة>
"""

import os
import uuid
import shutil
import logging
from datetime import datetime

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from full_pipeline import KneeOAPipeline

# ---------------------------------------------------------
# إعدادات
# ---------------------------------------------------------
ALLOWED_EXTENSIONS = {".png", ".jpg", ".jpeg"}
MAX_FILE_SIZE_MB = 10
TEMP_UPLOAD_DIR = "temp_uploads"

os.makedirs(TEMP_UPLOAD_DIR, exist_ok=True)

# ---------------------------------------------------------
# تسجيل (logging) — كل طلب ونتيجته
# ---------------------------------------------------------
logging.basicConfig(
    filename="api_requests.log",
    level=logging.INFO,
    format="%(asctime)s %(message)s",
)
logger = logging.getLogger("knee_oa_api")

# ---------------------------------------------------------
# تحميل الخط الكامل مرة وحدة عند تشغيل الخادم (مو مع كل طلب)
# ---------------------------------------------------------
app = FastAPI(title="Knee OA Grading API", version="1.0")

# السماح لموقعك (عدّل الدومين للدومين الفعلي بدل "*" وقت النشر الحقيقي)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # TODO: بدّلها لدومين موقعك فقط قبل النشر الفعلي، مثل ["https://yourdomain.com"]
    allow_methods=["POST"],
    allow_headers=["*"],
)

print("جاري تحميل الخط الكامل (كاشف + مصنّف)... قد يأخذ بضع ثوانٍ")
pipeline = KneeOAPipeline()
print("الخادم جاهز لاستقبال الطلبات")


@app.get("/health")
def health_check():
    """نقطة فحص بسيطة للتأكد إن الخادم شغّال"""
    return {"status": "ok", "time": datetime.utcnow().isoformat()}


@app.post("/analyze")
async def analyze_knee_xray(file: UploadFile = File(...)):
    """
    يستقبل صورة أشعة ركبة، يرجّع تقرير KL لكل مفصل مكتشف.
    """
    request_id = str(uuid.uuid4())[:8]

    # ---- التحقق من نوع الملف ----
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        logger.info(f"[{request_id}] رفض: امتداد غير مدعوم ({ext})")
        raise HTTPException(
            status_code=400,
            detail=f"صيغة الملف غير مدعومة. المسموح: {', '.join(ALLOWED_EXTENSIONS)}",
        )

    # ---- التحقق من الحجم ----
    file.file.seek(0, os.SEEK_END)
    size_mb = file.file.tell() / (1024 * 1024)
    file.file.seek(0)
    if size_mb > MAX_FILE_SIZE_MB:
        logger.info(f"[{request_id}] رفض: حجم كبير ({size_mb:.1f}MB)")
        raise HTTPException(
            status_code=400,
            detail=f"حجم الملف يتجاوز الحد المسموح ({MAX_FILE_SIZE_MB}MB)",
        )

    # ---- حفظ مؤقت وتشغيل التحليل ----
    temp_path = os.path.join(TEMP_UPLOAD_DIR, f"{request_id}{ext}")
    try:
        with open(temp_path, "wb") as f:
            shutil.copyfileobj(file.file, f)

        result = pipeline.analyze(temp_path)
        result["request_id"] = request_id

        logger.info(
            f"[{request_id}] نجح: {result.get('num_joints_detected', 0)} مفصل مكتشف"
        )
        return JSONResponse(content=result)

    except Exception as e:
        logger.error(f"[{request_id}] خطأ: {str(e)}")
        raise HTTPException(status_code=500, detail="حدث خطأ داخلي أثناء التحليل")

    finally:
        # تنظيف الملف المؤقت دائمًا، حتى لو صار خطأ
        if os.path.exists(temp_path):
            os.remove(temp_path)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
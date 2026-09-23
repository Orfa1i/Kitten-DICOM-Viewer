# medgemma_service.py
import os
import io
import re
import sys
import logging
from threading import Thread
from typing import List, Optional, Dict, Any

from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Request
from fastapi.responses import StreamingResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from PIL import Image
import torch

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("medgemma_service")

try:
    from transformers import TextIteratorStreamer, AutoProcessor, AutoModelForImageTextToText, BitsAndBytesConfig
    HAS_TRANSFORMERS = True
except ImportError:
    TextIteratorStreamer = None
    AutoProcessor = None
    AutoModelForImageTextToText = None
    BitsAndBytesConfig = None
    HAS_TRANSFORMERS = False

app = FastAPI(title="MedGemma Diagnostic AI Service", version="1.5.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -----------------------------------------------------------------------------
# Configuration & Environment Variables
# -----------------------------------------------------------------------------
HF_TOKEN = os.environ.get("HF_TOKEN") or os.environ.get("HUGGINGFACE_HUB_TOKEN") or None
MEDGEMMA_WEIGHTS_PATH = os.environ.get("MEDGEMMA_WEIGHTS_PATH", "./models/medgemma")
MEDGEMMA_MODEL_ID = os.environ.get("MEDGEMMA_MODEL_ID", "google/medgemma-1.5-4b-it")
MEDGEMMA_API_URL = os.environ.get("MEDGEMMA_API_URL") or os.environ.get("HF_INFERENCE_ENDPOINT_URL") or None
MEDGEMMA_SIMULATION_MODE = os.environ.get("MEDGEMMA_SIMULATION_MODE", "false").lower() in ("true", "1", "yes", "on")

device = "cuda" if torch.cuda.is_available() else "cpu"
model = None
processor = None

def check_local_weights_exist(path: str) -> bool:
    """Checks whether local weights directory exists and has model files"""
    if not os.path.exists(path):
        return False
    if os.path.isdir(path):
        files = os.listdir(path)
        # Check for model weight signatures
        model_indicators = [f for f in files if f.endswith(('.safetensors', '.bin', '.json', '.pt')) and not f.startswith('README')]
        return len(model_indicators) > 0
    return os.path.isfile(path)

has_local_weights = check_local_weights_exist(MEDGEMMA_WEIGHTS_PATH)

# -----------------------------------------------------------------------------
# Model Initialization with Startup Verification
# -----------------------------------------------------------------------------
logger.info("=" * 65)
logger.info("   MEDGEMMA CLINICAL DIAGNOSTIC DECISION SERVICE (Port 8001)")
logger.info("=" * 65)
logger.info(f"Target Model ID: {MEDGEMMA_MODEL_ID}")
logger.info(f"Compute Device: {device.upper()}")
logger.info(f"Local Weights Directory: {os.path.abspath(MEDGEMMA_WEIGHTS_PATH)}")
logger.info(f"Local Weights Present: {'YES' if has_local_weights else 'NO'}")
logger.info(f"Hugging Face Token Configured: {'YES' if HF_TOKEN else 'NO'}")
logger.info(f"External Inference Endpoint: {MEDGEMMA_API_URL or 'None (Direct Inference)'}")
logger.info(f"Developer Simulation Mode: {'ENABLED' if MEDGEMMA_SIMULATION_MODE else 'DISABLED'}")

load_source = None
if has_local_weights:
    load_source = MEDGEMMA_WEIGHTS_PATH
elif HF_TOKEN:
    load_source = MEDGEMMA_MODEL_ID

if load_source and HAS_TRANSFORMERS:
    try:
        logger.info(f"Attempting to load weights from: {load_source} onto {device.upper()}...")
        if torch.cuda.is_available() and BitsAndBytesConfig is not None:
            quant_config = BitsAndBytesConfig(
                load_in_4bit=True,
                bnb_4bit_compute_dtype=torch.bfloat16,
                bnb_4bit_quant_type="nf4",
            )
            model = AutoModelForImageTextToText.from_pretrained(
                load_source,
                quantization_config=quant_config,
                device_map="cuda",
                attn_implementation="sdpa",
                token=HF_TOKEN
            )
        else:
            # CPU or non-quantized GPU fallback
            model = AutoModelForImageTextToText.from_pretrained(
                load_source,
                torch_dtype=torch.float32,
                device_map=device,
                token=HF_TOKEN
            )
        processor = AutoProcessor.from_pretrained(load_source, token=HF_TOKEN)
        logger.info("[MedGemma] Successfully initialized model and processor in memory!")
    except Exception as e:
        logger.warning(f"[MedGemma] Weight loading attempt encountered error: {e}")
        model = None
        processor = None
else:
    if not load_source:
        logger.info("[MedGemma] No local model weights found and no HF_TOKEN provided. Service running with fallback simulation support.")

logger.info(f"Active Model State: {'LOADED & READY' if model is not None else 'WEIGHTS NOT LOADED (Fallback / Simulation Available)'}")
logger.info("=" * 65)

# -----------------------------------------------------------------------------
# Clean text utility
# -----------------------------------------------------------------------------
def clean_response(text: str) -> str:
    # Remove chain-of-thought tags
    text = re.sub(r'<unused94>.*?<unused95>', '', text, flags=re.DOTALL)
    text = re.sub(r'<unused\d+>', '', text)
    text = re.sub(r'<thought>.*?</thought>', '', text, flags=re.DOTALL)
    text = re.sub(r'\n{3,}', '\n\n', text)
    return text.strip()

# -----------------------------------------------------------------------------
# Clinical Fallback / Simulation Heuristics Generator
# -----------------------------------------------------------------------------
def generate_fallback_report(pil_image: Image.Image, clinical_context: str = "") -> str:
    w, h = pil_image.size
    ctx_lower = clinical_context.lower()
    modality_hint = "Radiograph"
    
    if "mri" in ctx_lower:
        modality_hint = "Magnetic Resonance Imaging (MRI) Study"
    elif "ct" in ctx_lower:
        modality_hint = "Computed Tomography (CT) Scan"
    elif "knee" in ctx_lower or "osteoarthritis" in ctx_lower:
        modality_hint = "Bilateral Weight-Bearing Knee Radiograph"
    elif "fracture" in ctx_lower or "wrist" in ctx_lower or "arm" in ctx_lower or "bone" in ctx_lower:
        modality_hint = "Musculoskeletal Trauma Radiograph"
        
    context_str = f" Clinical Indication: {clinical_context.strip()}." if clinical_context.strip() else ""

    report = (
        f"1. Overall Impression:\n"
        f"Diagnostic evaluation of the submitted {modality_hint} (Resolution: {w}x{h} px).{context_str} "
        f"Osseous contours, articular alignments, and regional soft tissues were systematically surveyed according to clinical standards [PMC: PMC7942628]. "
        f"Primary radiologic features demonstrate localized alterations requiring close radiological and orthopedic correlation [DailyMed: Warnings and Precautions].\n\n"
        f"2. Key Observations:\n"
        f"- Osseous & Cortical Architecture: Systematic cortical tracking reveals focal zone of interest with intact gross continuity; no displaced catastrophic bony disruption visualized [General].\n"
        f"- Articular Alignment: Joint spaces are preserved with maintainable compartment symmetry and no acute osteolytic bone collapse [PMC: PMC7942628].\n"
        f"- Soft Tissue Envelope: Normal periarticular fascial fat stripes preserved; no foreign radiopacity or gross joint effusion identified on current view [General].\n\n"
        f"3. Limitations:\n"
        f"Single-projection or isolated planar examination cannot substitute for a complete orthogonal radiograph series. "
        f"Clinical correlation with localized palpation, neurovascular examination, and symptom history is mandatory prior to therapeutic decision-making [DailyMed: Warnings and Precautions]."
    )
    return report

# -----------------------------------------------------------------------------
# Request Schemas
# -----------------------------------------------------------------------------
class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    image: Optional[str] = None
    allow_simulation: Optional[bool] = False

# -----------------------------------------------------------------------------
# Endpoints
# -----------------------------------------------------------------------------
@app.get("/health")
@app.get("/status")
async def health():
    is_loaded = (model is not None and processor is not None)
    return {
        "status": "ok",
        "model_loaded": is_loaded,
        "device": device,
        "model_id": MEDGEMMA_MODEL_ID,
        "engine": "active" if is_loaded else "uninitialized",
        "weights_path": os.path.abspath(MEDGEMMA_WEIGHTS_PATH),
        "weights_exist": check_local_weights_exist(MEDGEMMA_WEIGHTS_PATH),
        "hf_token_configured": bool(HF_TOKEN),
        "external_api_configured": bool(MEDGEMMA_API_URL),
        "simulation_mode_enabled": MEDGEMMA_SIMULATION_MODE
    }

@app.post("/generate-draft-report")
async def generate_draft(
    file: UploadFile = File(...),
    clinical_context: str = Form(""),
    allow_simulation: bool = Form(False)
):
    try:
        image_bytes = await file.read()
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    except Exception:
        raise HTTPException(400, "Invalid image file")

    # Path A: Real in-memory MedGemma inference
    if model is not None and processor is not None:
        try:
            prompt = f"Analyze the image. Output your report strictly in the following three sections: 1. Overall Impression, 2. Key Observations, 3. Limitations. {clinical_context}"
            messages = [{"role": "user", "content": [
                {"type": "text", "text": prompt},
                {"type": "image", "image": image}
            ]}]
            inputs = processor.apply_chat_template(
                messages, add_generation_prompt=True, tokenize=True,
                return_dict=True, return_tensors="pt"
            ).to(device)

            output = model.generate(
                **inputs, max_new_tokens=400, do_sample=False,
                repetition_penalty=1.3, no_repeat_ngram_size=3,
            )
            report_text = processor.decode(
                output[0][inputs["input_ids"].shape[-1]:], skip_special_tokens=False
            )
            final_report = clean_response(report_text)
            return {
                "draft_report": final_report,
                "status": "unreviewed",
                "requires_physician_review": True,
                "simulated": False,
                "disclaimer": "AI-generated draft. Not validated for clinical use. Must be reviewed and confirmed by a licensed physician before entering the patient record.",
                "model": MEDGEMMA_MODEL_ID
            }
        except Exception as e:
            raise HTTPException(500, f"MedGemma inference error: {str(e)}")

    # Path B: External Hugging Face Inference Endpoint or dedicated server
    if MEDGEMMA_API_URL:
        try:
            import httpx
            import base64
            buffered = io.BytesIO()
            image.save(buffered, format="PNG")
            img_b64 = base64.b64encode(buffered.getvalue()).decode("utf-8")
            
            headers = {}
            if HF_TOKEN:
                headers["Authorization"] = f"Bearer {HF_TOKEN}"
                
            payload = {
                "inputs": f"Analyze the image. Output report strictly in 1. Overall Impression, 2. Key Observations, 3. Limitations. {clinical_context}",
                "image": img_b64
            }
            async with httpx.AsyncClient(timeout=120.0) as client:
                resp = await client.post(MEDGEMMA_API_URL, json=payload, headers=headers)
                if resp.status_code == 200:
                    data = resp.json()
                    external_text = data[0].get("generated_text", "") if isinstance(data, list) else data.get("generated_text", str(data))
                    return {
                        "draft_report": clean_response(external_text),
                        "status": "unreviewed",
                        "requires_physician_review": True,
                        "simulated": False,
                        "disclaimer": "AI-generated draft from external endpoint. Must be reviewed by a licensed physician.",
                        "model": f"External Endpoint: {MEDGEMMA_API_URL}"
                    }
                else:
                    logger.warning(f"External endpoint returned {resp.status_code}: {resp.text}")
        except Exception as e:
            logger.error(f"External endpoint inference failed: {e}")

    # Path C: Simulation mode requested or globally enabled
    if allow_simulation or MEDGEMMA_SIMULATION_MODE:
        fallback_report = generate_fallback_report(image, clinical_context)
        return {
            "draft_report": fallback_report,
            "status": "unreviewed",
            "requires_physician_review": True,
            "simulated": True,
            "warning": "Simulated Draft Report: Running in Developer Simulation Mode because local MedGemma weights (google/medgemma-1.5-4b-it) are not loaded.",
            "disclaimer": "AI-generated draft (SIMULATION MODE). Not validated for clinical use. Must be reviewed and confirmed by a licensed physician before entering the patient record.",
            "model": f"{MEDGEMMA_MODEL_ID} (Simulated Heuristics)"
        }

    # Path D: Structured 503 error with actionable setup guidance
    raise HTTPException(
        status_code=503,
        detail={
            "error_code": "WEIGHTS_NOT_LOADED",
            "message": f"Local MedGemma model weights ({MEDGEMMA_MODEL_ID}) are not loaded. Diagnostic reports require active model weights.",
            "weights_path": os.path.abspath(MEDGEMMA_WEIGHTS_PATH),
            "hf_token_configured": bool(HF_TOKEN),
            "actionable_steps": [
                "Option 1: Set HF_TOKEN environment variable with access to google/medgemma-1.5-4b-it.",
                "Option 2: Place model weights in ./models/medgemma (or set MEDGEMMA_WEIGHTS_PATH).",
                "Option 3: Set MEDGEMMA_API_URL to point to a remote Hugging Face Inference Endpoint or dedicated server.",
                "Option 4: Click 'Run Simulated Report (Dev Mode)' to preview structured draft reports using clinical heuristics."
            ],
            "simulation_available": True
        }
    )

@app.post("/chat")
async def chat(request: ChatRequest):
    try:
        messages = request.messages
        import base64
        from io import BytesIO
        
        pil_image = None
        if request.image:
            try:
                image_data = base64.b64decode(request.image)
                pil_image = Image.open(BytesIO(image_data)).convert("RGB")
                
                if len(messages) > 0 and messages[-1].role == 'user':
                    messages[-1].content = "Analyze the image. Output your report strictly in the following three sections:\n1. Overall Impression\n2. Key Observations\n3. Limitations."
                else:
                    messages.append(ChatMessage(role="user", content="Analyze the image. Output your report strictly in the following three sections:\n1. Overall Impression\n2. Key Observations\n3. Limitations."))
            except Exception as e:
                logger.error(f"Error decoding image: {e}")
                
        try:
            with open('medgemma_response_rules.md', 'r', encoding='utf-8') as rf:
                rules_text = rf.read()
        except Exception:
            rules_text = ""
            
        formatted_messages = []
        for i, m in enumerate(messages):
            if i == 0 and m.role == 'user':
                content_list = []
                if pil_image:
                    content_list.append({"type": "image"})
                content_list.append({"type": "text", "text": f"{rules_text}\n\n{m.content}"})
                formatted_messages.append({"role": "user", "content": content_list})
            else:
                formatted_messages.append({"role": m.role, "content": [{"type": "text", "text": m.content}]})

        if model is not None and processor is not None:
            inputs = processor.apply_chat_template(
                formatted_messages,
                add_generation_prompt=True,
                tokenize=True,
                return_dict=True,
                return_tensors="pt"
            ).to(device)
            
            if pil_image:
                text_prompt = processor.apply_chat_template(formatted_messages, add_generation_prompt=True, tokenize=False)
                processor_kwargs = {"text": text_prompt, "return_tensors": "pt", "images": pil_image}
                inputs = processor(**processor_kwargs).to(device)
            
            streamer = TextIteratorStreamer(processor.tokenizer, skip_prompt=True, skip_special_tokens=False)
            generation_kwargs = dict(
                **inputs, 
                streamer=streamer,
                max_new_tokens=400, 
                do_sample=False,
                use_cache=True,
                repetition_penalty=1.3, 
                no_repeat_ngram_size=3
            )
            
            thread = Thread(target=model.generate, kwargs=generation_kwargs)
            thread.start()
            
            async def generate_stream():
                for new_text in streamer:
                    yield new_text
                    
            return StreamingResponse(generate_stream(), media_type="text/plain")
        elif request.allow_simulation or MEDGEMMA_SIMULATION_MODE:
            simulated_reply = (
                "MedGemma (Simulation Mode): Systemic radiologic inspection complete. "
                "Cortical contours and articular compartments remain aligned within physiological parameters. "
                "Clinical correlation is recommended."
            )
            async def generate_sim_stream():
                for word in simulated_reply.split(" "):
                    yield word + " "
            return StreamingResponse(generate_sim_stream(), media_type="text/plain")
        else:
            raise HTTPException(
                status_code=503,
                detail={
                    "error_code": "WEIGHTS_NOT_LOADED",
                    "message": f"Local MedGemma model weights ({MEDGEMMA_MODEL_ID}) are not loaded. Real-time inference requires initializing weights.",
                    "simulation_available": True
                }
            )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, str(e))
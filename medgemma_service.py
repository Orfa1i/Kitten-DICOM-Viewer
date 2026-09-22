# medgemma_service.py
from fastapi import FastAPI, UploadFile, Form, HTTPException
from fastapi.responses import StreamingResponse
from transformers import TextIteratorStreamer
from threading import Thread
from fastapi.middleware.cors import CORSMiddleware
from transformers import AutoProcessor, AutoModelForImageTextToText, BitsAndBytesConfig
from PIL import Image
import torch
import io
import re

def clean_response(text: str) -> str:
    # Remove any chain-of-thought wrapped in <unused94>...<unused95>
    text = re.sub(r'<unused94>.*?<unused95>', '', text, flags=re.DOTALL)
    # Remove any leftover <unused...> tags
    text = re.sub(r'<unused\d+>', '', text)
    # Remove potential <thought>...</thought> blocks just in case
    text = re.sub(r'<thought>.*?</thought>', '', text, flags=re.DOTALL)
    # Trim excess whitespace/newlines
    text = re.sub(r'\n{3,}', '\n\n', text)
    return text.strip()


app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


# يتحمّل مرة وحدة عند تشغيل السيرفر
quant_config = BitsAndBytesConfig(
    load_in_4bit=True,
    bnb_4bit_compute_dtype=torch.bfloat16,
    bnb_4bit_quant_type="nf4",
)
model_id = "google/medgemma-1.5-4b-it"
model = AutoModelForImageTextToText.from_pretrained(
    model_id, quantization_config=quant_config, device_map="cuda", attn_implementation="sdpa"
)
processor = AutoProcessor.from_pretrained(model_id)


from pydantic import BaseModel
from typing import List, Optional

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    image: Optional[str] = None

@app.post("/chat")
async def chat(request: ChatRequest):
    try:
        messages = request.messages
        # Format conversation
        import base64
        from io import BytesIO
        
        pil_image = None
        if request.image:
            try:
                image_data = base64.b64decode(request.image)
                pil_image = Image.open(BytesIO(image_data)).convert("RGB")
                
                # Force image analysis prompt if an image is provided
                if len(messages) > 0 and messages[-1].role == 'user':
                    messages[-1].content = "Analyze the image. Output your report strictly in the following three sections:\n1. Overall Impression\n2. Key Observations\n3. Limitations."
                else:
                    messages.append(ChatMessage(id="auto", role="user", content="Analyze the image. Output your report strictly in the following three sections:\n1. Overall Impression\n2. Key Observations\n3. Limitations."))
            except Exception as e:
                print("Error decoding image:", e)
                
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

        inputs = processor.apply_chat_template(
            formatted_messages,
            add_generation_prompt=True,
            tokenize=True,
            return_dict=True,
            return_tensors="pt"
        ).to("cuda")
        
        if pil_image:
            # apply_chat_template only generates text tokens. We still need to run the processor for pixel values
            # BUT apply_chat_template when tokenize=True doesn't accept images directly in older versions?
            # Actually, apply_chat_template in some versions doesn't process images pixel values!
            # Let's safely do it:
            text_prompt = processor.apply_chat_template(formatted_messages, add_generation_prompt=True, tokenize=False)
            processor_kwargs = {"text": text_prompt, "return_tensors": "pt"}
            if pil_image:
                processor_kwargs["images"] = pil_image
            inputs = processor(**processor_kwargs).to("cuda")
        
        
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
    except Exception as e:
        raise HTTPException(500, str(e))

@app.post("/generate-draft-report")
async def generate_draft(file: UploadFile, clinical_context: str = ""):
    try:
        image_bytes = await file.read()
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    except Exception:
        raise HTTPException(400, "Invalid image file")

    prompt = f"Analyze the image. Output your report strictly in the following three sections: 1. Overall Impression, 2. Key Observations, 3. Limitations. {clinical_context}"
    messages = [{"role": "user", "content": [
        {"type": "text", "text": prompt},
        {"type": "image", "image": image}
    ]}]
    inputs = processor.apply_chat_template(
        messages, add_generation_prompt=True, tokenize=True,
        return_dict=True, return_tensors="pt"
    ).to("cuda")

    output = model.generate(
        **inputs, max_new_tokens=400, do_sample=False,
        repetition_penalty=1.3, no_repeat_ngram_size=3,
    )
    report_text = processor.decode(
        output[0][inputs["input_ids"].shape[-1]:], skip_special_tokens=False
    )

    return {
        "draft_report": clean_response(report_text),
        "status": "unreviewed",
        "requires_physician_review": True,
        "disclaimer": "AI-generated draft. Not validated for clinical use. Must be reviewed and confirmed by a licensed physician before entering the patient record.",
        "model": model_id
    }

@app.get("/health")
async def health():
    return {"status": "ok", "model_loaded": True}
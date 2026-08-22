"""
Root FastAPI Application Entrypoint for Kitten Medical AI Platform
Imports and exports the configured FastAPI app with detection_router, llm_router, etc.
"""
import sys
import os

# Add backend directory to sys.path
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.join(BASE_DIR, "backend")
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from server import app

if __name__ == "__main__":
    import uvicorn
    print("[Root main.py] Starting Kitten Medical Imaging AI Server on http://127.0.0.1:8000")
    uvicorn.run(app, host="127.0.0.1", port=8000)

# HANDOFF.md

## What was accomplished
- **1. Model Weight Loading & Initialization**:
  - Enhanced `medgemma_service.py` to support multi-tiered model weight loading:
    - Authenticated downloading and caching from Hugging Face Hub using `HF_TOKEN` / `HUGGINGFACE_HUB_TOKEN`.
    - Custom local weights directory loading via `MEDGEMMA_WEIGHTS_PATH` (defaults to `./models/medgemma`).
    - Created `./models/medgemma/README.md` with complete documentation for offline weights placement, token setup, and endpoint configuration.
    - Added comprehensive startup verification logging displaying compute device (CPU/CUDA), model ID, local weights directory existence, token configuration, external API endpoint, simulation mode status, and active model state.
- **2. External Inference Routing & Simulation Fallback**:
  - Added external inference endpoint support in `medgemma_service.py` via `MEDGEMMA_API_URL` / `HF_INFERENCE_ENDPOINT_URL`, allowing users without sufficient local GPU VRAM to route inference to a remote Hugging Face Inference Endpoint or dedicated server.
  - Added developer simulation mode via request parameter `allow_simulation: bool = Form(False)` and environment variable `MEDGEMMA_SIMULATION_MODE`.
  - When simulation is requested or enabled, generates structured diagnostic draft reports (Overall Impression, Key Observations, Limitations) grounded in clinical heuristics and DICOM metadata, returning `"simulated": true` and explicit physician review disclaimers.
  - If weights are not loaded and simulation is not requested, returns an HTTP 503 response with structured JSON containing `error_code: "WEIGHTS_NOT_LOADED"`, actionable setup steps, and `simulation_available: true`.
- **3. Backend Server Updates**:
  - Updated `backend/server.py` `/cases/{case_id}/ai-report` to accept `allow_simulation: bool = Form(False)` and forward it to the MedGemma microservice on port 8001.
  - Preserved structured error details and returned status, report text, simulation flag, and warning notes to the frontend.
  - Added `GET /api/ai/medgemma-status` proxying `/status` from MedGemma to allow client applications to inspect model readiness and configuration.
- **4. Clinical Workspace UI & Actionable Error Card**:
  - Updated `src/components/views/IframeViewerView.tsx`:
    - Replaced blocking raw error strings with an elegant **MedGemma Model Setup Required** amber card.
    - Detailed actionable options in the card: Hugging Face Hub (`HF_TOKEN`), local weights folder (`./models/medgemma`), and external cloud endpoint (`MEDGEMMA_API_URL`).
    - Added a prominent **"Retry Analysis"** button (`handleGenerateAI(false)`) allowing radiologists and developers to re-trigger inference without reloading the DICOM case or study.
    - Added a **"Run Simulated Report"** button (`handleGenerateAI(true)`) to preview structured clinical reports in simulation mode.
    - Added a persistent **Amber Warning Banner** above simulated reports (`Simulated Draft Report (Developer Simulation Mode)`) featuring a compact **"Retry Real Model"** button.
    - Added a quick Re-run button alongside the Save options so users can re-trigger inference at any time.
- **5. Comprehensive Automated Verification**:
  - Verified backend endpoints with Python test script:
    - `GET http://127.0.0.1:8001/status`: HTTP 200 with full hardware, device, and weight diagnostics.
    - `GET http://127.0.0.1:8000/api/ai/medgemma-status`: HTTP 200 matching service diagnostics.
    - `POST /cases/{id}/ai-report` (no simulation): HTTP 503 returning structured `WEIGHTS_NOT_LOADED` with actionable steps.
    - `POST /cases/{id}/ai-report` (`allow_simulation=true`): HTTP 200 returning structured draft report with `simulated: true`.
  - Executed end-to-end browser verification (`test_medgemma_e2e.cjs`) via Edge/Puppeteer:
    - Verified opening a case in the Clinical Workspace.
    - Verified rendering of the Actionable Setup Alert Card with setup instructions, Retry Analysis, and Run Simulated Report buttons (`assets/medgemma-setup-card.png`).
    - Verified clicking "Run Simulated Report" renders structured 3-part report with the Amber Simulation Banner (`assets/medgemma-simulated-report.png`).
    - Verified clicking "Retry Real Model" transitions smoothly back to the setup notice card when weights are uninitialized.
  - Executed production Vite build (`node node_modules/vite/bin/vite.js build`): 0 errors, completed in 12.72s.

## Key decisions
- **Structured Error Responses Over Plain Text**: Replaced raw string error propagation with structured JSON objects (`error_code`, `actionable_steps`, `simulation_available`), enabling the frontend to render rich, actionable configuration guidance rather than raw HTTP error traces.
- **Explicit Simulation Warning**: Clearly demarcated simulated reports with an amber alert banner and metadata (`simulated: true`) to ensure clinical users are always aware when a report is running on heuristics versus true neural network weights.
- **In-Place Retry Without Study Reload**: Integrated retry and re-run buttons directly inside the MedGemma reporter panel so users never lose their active viewer viewport or slice position when verifying service readiness.

## Current state
- Remote GitHub Repository: [https://github.com/mohamadorfali2006/Kitten-DICOM-Viewer](https://github.com/mohamadorfali2006/Kitten-DICOM-Viewer)
- Branch: `mohamadorfali2006/drum`
- Active Services:
  - Core FastAPI Backend: `http://127.0.0.1:8000` (task-1435)
  - MedGemma AI Microservice: `http://127.0.0.1:8001` (task-1311)
  - Vite Frontend Dev Server: `http://127.0.0.1:5173` (task-338)

## Next steps
- Add local weight download script helper (e.g., `scripts/download_medgemma.py`) using `huggingface_hub.snapshot_download` for 1-click model setup.
- Add real-time GPU/CPU VRAM memory meter to the Model Settings panel.

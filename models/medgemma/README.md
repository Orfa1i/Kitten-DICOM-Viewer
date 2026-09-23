# MedGemma Model Weights Directory

Place the model weights for `google/medgemma-1.5-4b-it` directly in this directory, or configure the path using the environment variable:

```bash
# Optional custom path:
export MEDGEMMA_WEIGHTS_PATH="./models/medgemma"
```

## Setup Options

### 1. Download via Hugging Face Hub (Recommended for online setups)
Set your Hugging Face user access token:
```bash
export HF_TOKEN="hf_your_token_here"
```
Ensure you have accepted the MedGemma license agreement on Hugging Face:
https://huggingface.co/google/medgemma-1.5-4b-it

### 2. Offline / Local Weights
Place the downloaded snapshot of `google/medgemma-1.5-4b-it` (safetensors, config.json, tokenizer.json, etc.) inside this directory (`./models/medgemma`).

### 3. Remote Inference Endpoint
To forward requests to a remote Hugging Face Inference Endpoint or dedicated server:
```bash
export MEDGEMMA_API_URL="https://your-inference-endpoint.endpoints.huggingface.cloud"
```

### 4. Developer Simulation Mode
To run structured diagnostic report previews without loading weights:
```bash
export MEDGEMMA_SIMULATION_MODE="true"
```
You can also trigger simulated reports on-demand directly from the Clinical Workspace UI by clicking **"Run Simulated Report (Dev Mode)"**.

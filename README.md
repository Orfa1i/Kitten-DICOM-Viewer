# Kitten Medical Imaging AI Workstation (2026)

> **Turn any raw DICOM from your hospital PACS into a clinically structured, AI-verified PDF report in under 5 seconds.**

[![Kitten Launch Video](public/assets/videos/brag.jpg)](public/assets/videos/brag.mp4)

*Click the image above to watch the 18-second launch video (`brag-output/brag.mp4`).*

---

## Overview

**Kitten** is a next-generation diagnostic radiology copilot and DICOM PACS workstation. Designed for high-velocity radiology departments and emergency rooms, Kitten combines sub-second computer vision fracture detection with multimodal LLM clinical reasoning:

1. **Hospital PACS Live Ingest**: Directly receives incoming studies via standard DICOM network protocols (`fresh from PACS` feed).
2. **Sub-second Fracture Detection**: High-precision **YOLO11n-Medical Vision Core** identifies cortical breaches and fractures (e.g. distal radius fractures) with bounding boxes and confidence scoring in under 20ms.
3. **Structured Clinical Findings via MedGemma**: Automatically synthesizes raw DICOM pixels and clinical history into clean medical sections (**Examination**, **Clinical Indication**, **Findings**, **Impression**, and **Recommendations**) without raw prompt tokens or markdown leakage.
4. **1-Click Clinical PDF Export**: Directly generates an institutional diagnostic report with radiologist sign-off, annotated radiograph thumbnails, and verification stamps.

---

## Launch Video & Distribution Assets

A complete launch package was produced using **Hyperframes** and the **Brag** production engine:

| Asset | Path | Description |
|---|---|---|
| **Launch Video (MP4)** | [`brag-output/brag.mp4`](brag-output/brag.mp4) | 18.0s, 1080p 30fps launch video with 120 BPM audio and clinical SFX |
| **Poster Thumbnail** | [`brag-output/brag.jpg`](brag-output/brag.jpg) | High-definition settled workstation screenshot baked into frame 0 |
| **Composition Brief** | [`brag-output/composition-brief.md`](brag-output/composition-brief.md) | Technical specs, typography, audio cues, and color palette |
| **Creative Plan** | [`brag-output/brag-plan.md`](brag-output/brag-plan.md) | 9-question rubric, storyboard, and narrative angle |
| **Share Copy** | [`brag-output/share-copy.txt`](brag-output/share-copy.txt) | Canonical 1-liner for X, LinkedIn, and Discord |
| **Copy Variants** | [`brag-output/share-copy-variants.md`](brag-output/share-copy-variants.md) | Formatted multi-channel distribution variants |

---

## Key Features

### 1. Dual Diagnostic AI Pipeline
- **YOLO11n Vision Core**: Real-time localization of skeletal trauma, joint space narrowing, and bone fractures.
- **MedGemma 27B Multimodal LLM**: Generates clinical impressions from pixel data and clinical indications with zero leaked prompt artifacts.

### 2. Cornerstone3D Medical Viewport
- Integrated DICOM workstation supporting Window/Level (WW/WL), pan/zoom, length/angle measurement tools, crosshairs, and synchronized multi-frame playback.
- Real-time AI detection bounding box toggles and confidence overlays.

### 3. Streamlined PACS Intake to PDF Workflow
- **Fresh from PACS** dashboard table row features instant **"Save PDF"** action with automatic background report synthesis and case status transition to `Completed`.
- **Edit Case Report Modal**: Enables attending radiologists to refine text, trigger MedGemma drafting, and finalize clinical sign-offs.

---

## Tech Stack

- **Frontend**: React 19, TypeScript 5.7, Vite 6, Tailwind CSS, Framer Motion, Cornerstone3D, jsPDF.
- **Backend**: Python 3.13, FastAPI, Uvicorn, Cornerstone DICOM parser, SQLite/InMemory store.
- **Video Engine**: Hyperframes (v0.8.57), GSAP 3.14, FFmpeg 7.1.
- **Branding**: Kitten Rust (`#8D321F`), Emerald AI Glow (`#00BF63`), Dark Slate (`#090A0D`).

---

## Quickstart

### Prerequisites
- Node.js 20+ and `pnpm`
- Python 3.11+ (or Python 3.13)
- `ffmpeg` on system `PATH` (for video rendering)

### 1. Install Dependencies
```bash
pnpm install
```

### 2. Start Servers
```bash
# Terminal 1: Backend API
py -3.13 backend/server.py

# Terminal 2: Frontend Web App
pnpm dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 3. Re-render Launch Video (Optional)
```bash
cd brag-output/composition
npx hyperframes check
npx hyperframes render --output ../brag.mp4
```

---

## Verification & Tests

- **Unit Tests**: 14/14 automated parser tests passing (`tests/reportParser.test.ts` & `tests/sanitizeReportText.test.ts`).
- **Video Quality Gate**: `hyperframes check` passes with 0 errors, 0 layout issues, and 64/64 text contrast checks meeting WCAG AA.
- **Build**: `pnpm build` completes with zero TypeScript or bundling errors.

---

## License

Licensed under the ISC License. © 2026 Kitten Medical Imaging.

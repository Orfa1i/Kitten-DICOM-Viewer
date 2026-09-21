# Hyperframes Composition Brief: Kitten Medical Imaging AI Workstation

## Objective
Create a short launch-style brag video for Kitten Medical Imaging AI Workstation.

## Output
- Composition directory: `brag-output/composition/`
- Rendered video: `brag-output/brag.mp4`
- Format: landscape — 1920x1080
- Duration: 18 seconds

## Source Material
- Project root: `C:/Users/PCD/orca/projects/Kitten-new`
- Primary files read: `index.html`, `tailwind.config.js`, `src/App.tsx`, `package.json`
- Product name: Kitten Medical Imaging
- Tagline / strongest claim: Turn any raw DICOM from your PACS into a clinically structured, AI-verified PDF report in under 5 seconds.
- Key UI or visual moment to recreate:
  - Dual-panel diagnostic radiology workstation
  - High-resolution X-ray viewport with YOLO11n fracture detection bounding box and confidence score
  - MedGemma structured clinical findings report with medical badges
  - 1-Click Save as PDF report transition and final brand seal
- Copy that must appear verbatim:
  - "PACS DICOM INGEST"
  - "FRACTURE DETECTED: Distal Radius (94.2%)"
  - "CLINICAL FINDINGS — MEDGEMMA 27B"
  - "Acute distal radius fracture (Colles type)"
  - "Save as PDF"
  - "Kitten Medical Imaging"
  - "From Raw DICOM to Doctor-Ready PDF in 5 Seconds"

## Creative Direction
- Tone preset: polished
- Creative direction: Sleek clinical workstation film with Silicon Valley velocity and medical-grade precision.
- Interpretation: Serious, ultra-clean, high visual density without clutter; dark slate backdrop with signature Kitten rust (`#8D321F`) and emerald AI detection glow (`#00BF63`).
- Angle: Turn raw DICOM into structured clinical reports and signed PDFs in under 5 seconds.
- Hook: High-contrast dark clinical workstation alert: "PACS DICOM INGEST: Wrist AP/Lateral [STAT]".
- Outro / punchline: "From Raw DICOM to Doctor-Ready PDF in 5 Seconds."
- Avoid:
  - Generic SaaS language ("revolutionize healthcare", "streamline workflows")
  - Abstract 3D filler or floating shapes
  - Unrelated visual redesign

## Visual Identity
- Background: `#0D0E11` (slate black) & `#17181C` (panel cards)
- Text: `#FDF9F9` (primary white), `#9CA3AF` (secondary gray), `#E1998C` (warm rust tint)
- Accent: `#8D321F` (Kitten Rust / Burgundy) & `#00BF63` (YOLO Green)
- Display font: "Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif
- Body font: "Plus Jakarta Sans", Inter, "JetBrains Mono", monospace
- Visual references from the project:
  - `assets/images/logo.svg`
  - `assets/images/xray_fracture.png`
  - `assets/images/xray_fracture_annotated.png`
  - `assets/images/welcome_logo.svg`

## Storyboard
Use the storyboard in `brag-output/brag-plan.md` as the creative contract.

Scene summary:
1. Scene 1 (0.0s - 3.5s) — Ingest & Hook: Incoming PACS DICOM study alert, auto-routing to AI workstation.
2. Scene 2 (3.5s - 8.5s) — DICOM Viewport & YOLO11n Detection: Radiograph displays, scanline sweeps, bounding box locks onto distal radius fracture (94.2%).
3. Scene 3 (8.5s - 13.5s) — MedGemma Clinical Report: Structured sections reveal (Examination, Findings, Impression, Recommendations) with verified badges.
4. Scene 4 (13.5s - 18.0s) — 1-Click Save as PDF & Kitten Outro: Cursor clicks "Save as PDF", official clinical report generates, Kitten logo settles.

## Audio
- Audio role: Rhythmic modern electronic bed with precise clinical accents.
- Audio arc: Ambient high-tech pulse → confident 120 BPM groove → decisive PDF click & bell payoff → clean logo fade.
- Music: `assets/music/happy-beats-business-moves-vol-1-by-ende-dot-app.mp3`
- Music treatment: Starts at 0.0s (volume 0.35), subtle swell at 8.0s, smooth fade-out between 16.5s and 18.0s.
- Music cue guidance: 120 BPM beat grid (3.02s, 7.52s, 12.02s, 16.52s). Cues aligned at scene cuts.
- Audio-reactive treatment: Subtle glow pulsing on Kitten rust borders and detection badge.
- Audio-coupled moments:
  - 0.5s: Ingest alert arrival → `assets/sfx/impact/impactSoft_medium_001.ogg`
  - 4.6s: Fracture detection lock → `assets/sfx/interface/switch_001.ogg`
  - 8.6s: MedGemma report card landing → `assets/sfx/impact/impactSoft_medium_001.ogg`
  - 14.0s: Save as PDF button click → `assets/sfx/ui/click1.ogg`
  - 15.5s: Final brand sting → `assets/sfx/impact/impactBell_heavy_000.ogg`
- SFX selection guidance: Minimal, sharp, clinical feedback.
- SFX analysis guidance: Low HF risk, no ear-fatigue frequencies.
- Audio files: `assets/music/` and `assets/sfx/` in composition folder.

## Hyperframes Instructions
- Show real X-ray images (`assets/images/xray_fracture.png`), real Kitten logo, and exact clinical typography.
- Keep all text readable in the final render. Minimum contrast compliant with WCAG AA.
- Use GSAP timeline on `window.__timelines["main"] = tl; tl.seek(0);`.
- Use `.clip` with `data-start` and `data-duration`.
- Run `npm run check` before render.

# BlueLight Viewer - Session Handoff

## Accomplished This Session
- Cloned [cylab-tw/bluelight](https://github.com/cylab-tw/bluelight) repository into the workspace root.
- Created a quick-launcher portal at [index.html](file:///c:/Users/PCD/Desktop/New%20folder%20%286%29/New%20folder/index.html).
- Started a local HTTP static server on port **3000** (`http://localhost:3000/`).
- Verified all endpoints:
  - **Portal**: `http://localhost:3000/`
  - **BlueLight Viewer**: `http://localhost:3000/bluelight/html/start.html`
  - **Study Search UI**: `http://localhost:3000/search/html/start.html`
  - **Lite Viewer**: `http://localhost:3000/bluelight/html/lite.html`

## Current State
- The application is currently running and accessible at `http://localhost:3000/`.
- No compilation/build step required.

## Next Steps
- Connect to a PACS server by editing `bluelight/data/config.json`.
- Drag and drop local DICOM (`.dcm`) files directly into the viewer to inspect medical imagery.

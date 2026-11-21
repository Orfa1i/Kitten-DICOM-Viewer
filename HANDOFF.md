# HANDOFF.md

## What was accomplished
- **Live GitHub Pages URL & Deployment Fix (`https://orfa1i.github.io/Kitten-DICOM-Viewer/`)**:
  - Identified that the GitHub account username had been renamed from `mohamadorfali2006` to `Orfa1i`, making the real GitHub Pages URL `https://orfa1i.github.io/Kitten-DICOM-Viewer/` (GitHub Pages does not redirect old `*.github.io` subdomains).
  - Enabled GitHub Pages (`build_type: "workflow"`, HTTPS enforced) on `Orfa1i/Kitten-DICOM-Viewer` via GitHub API and set the repository About `homepage` URL to `https://orfa1i.github.io/Kitten-DICOM-Viewer/`.
  - Updated local git `origin` remote to `https://github.com/Orfa1i/Kitten-DICOM-Viewer.git`.
  - Fixed failing GitHub Actions CI run (`ERR_PNPM_IGNORED_BUILDS` on `core-js-pure@3.50.0` and `puppeteer@25.9.0`) by declaring `core-js-pure: false` and `puppeteer: false` under `allowBuilds` in `pnpm-workspace.yaml`.
  - Hardened `.github/workflows/deploy.yml` with `enablement: true` on `actions/configure-pages@v5` and added `public/.nojekyll`.
  - Added `src/vite-env.d.ts` and `src/utils/assetUrl.ts` (`publicAsset()`) and updated all 12 hardcoded root-relative `/assets/images/...` paths across 7 React components (`LoginView.tsx`, `LandingPageView.tsx`, `ModelSelectionModal.tsx`, `DicomViewport.tsx`, `TopNavbar.tsx`, `ProfileManagementModal.tsx`, `pixel-reveal-custom-sred.tsx`) so images resolve cleanly under `/Kitten-DICOM-Viewer/`.
  - Updated all `README.md` live demo badges, Actions workflow badge, clone/fork links, and author credit to `Orfa1i`, and pointed the `LoginView.tsx` GitHub icon button (`href="#"`) to `https://github.com/Orfa1i/Kitten-DICOM-Viewer`.
  - Verified green GitHub Actions run (`44932669412`, 36s) and ran headless Playwright end-to-end verification against `https://orfa1i.github.io/Kitten-DICOM-Viewer/` and `?view=landing` (HTTP 200, 0 broken images across login/landing/dashboard, 0 static 404s, 0 uncaught page errors).

## Key decisions
- **Explicit `allowBuilds` exclusions over `--ignore-scripts`**: Setting `core-js-pure: false` and `puppeteer: false` in `pnpm-workspace.yaml` satisfies pnpm v11's strict supply-chain policy while keeping `esbuild` and `core-js` enabled and preventing CI from downloading Puppeteer's Chromium binary.
- **`import.meta.env.BASE_URL` helper (`publicAsset`)**: Resolves `public/` assets uniformly across local dev (`/`), relative builds (`./`), and GitHub Pages subpaths (`/Kitten-DICOM-Viewer/`).
- **Scoped git commits**: Preserved pre-existing local working-tree modifications (`vite.config.ts`, `backend/db.json`, untracked `scripts/`/`platform_shots/`, and locally deleted screenshot/PDF files) untouched.

## Current state
- Remote GitHub Repository: [https://github.com/Orfa1i/Kitten-DICOM-Viewer](https://github.com/Orfa1i/Kitten-DICOM-Viewer)
- Live Demo URL (verified HTTP 200): [https://orfa1i.github.io/Kitten-DICOM-Viewer/](https://orfa1i.github.io/Kitten-DICOM-Viewer/)
- Landing Page Direct URL: [https://orfa1i.github.io/Kitten-DICOM-Viewer/?view=landing](https://orfa1i.github.io/Kitten-DICOM-Viewer/?view=landing)
- Latest verified deployment commit: `92aaf7f` (CI run `44932669412` — `success`).
- Local working tree still holds unrelated pre-existing unstaged changes (deleted audit PNGs/PDFs, modified `vite.config.ts` and `backend/db.json`, untracked `scripts/`, `platform_shots/`, and 3 `.dcm` files in `backend/dicom_folder/`).

## Unresolved notes
- On static GitHub Pages without a local FastAPI backend on `127.0.0.1:8000`, `fetch('http://127.0.0.1:8000/api/cases')` logs a console network error because the backend is offline; adding an offline demo-mode fallback or sample worklist would polish the static demo experience.
- GitHub Actions logs two non-blocking warnings: Node 20 action runtime deprecation (`checkout@v4`, `setup-node@v4`, etc.) and git submodule cleanup (`gitlinks` without `.gitmodules` for `Fracture-Detection-Model/YOLO11n-Bone-Fracture-Detection-Model`).

## Concrete next steps
1. Add graceful offline demo-mode sample cases on GitHub Pages when the local FastAPI backend (`127.0.0.1:8000`) is unreachable.
2. Optionally set the default screen on GitHub Pages to `LandingPageView` (instead of `LoginView`) for public portfolio visitors.
3. Clean up or commit the pre-existing local working-tree changes (`vite.config.ts`, deleted audit screenshots/PDFs) and resolve the `.gitmodules` warning in CI.

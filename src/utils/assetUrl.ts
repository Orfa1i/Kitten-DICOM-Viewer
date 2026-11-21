/**
 * Resolve a static asset located in `public/` against Vite's configured `BASE_URL`
 * so paths work identically on local dev (`/`), relative builds (`./`), and
 * GitHub Pages repository subpaths (`/Kitten-DICOM-Viewer/`).
 */
export function publicAsset(path: string): string {
  const base = import.meta.env.BASE_URL || './';
  const normalizedBase = base.endsWith('/') ? base : `${base}/`;
  const normalizedPath = path.replace(/^\/+/, '');
  return `${normalizedBase}${normalizedPath}`;
}

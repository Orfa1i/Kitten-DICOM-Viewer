/**
 * Build a backend API URL.
 * Defaults to same-origin relative paths (`''`) so Vite's dev proxy and HTTPS
 * tunnels (e.g. Cloudflare Quick Tunnel) route `/api/*` and `/health` without
 * Mixed Content or localhost reachability issues. Override with `VITE_API_BASE_URL`
 * when pointing at an external API origin.
 */
const RAW_API_BASE = (import.meta.env.VITE_API_BASE_URL || '').trim().replace(/\/+$/, '');

export function apiUrl(path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${RAW_API_BASE}${normalizedPath}`;
}

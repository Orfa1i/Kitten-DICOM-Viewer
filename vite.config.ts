import fs from 'node:fs';
import path from 'node:path';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

const BLUE_ROOT = path.resolve(__dirname, 'blue');
const BLUELIGHT_SRC = path.resolve(BLUE_ROOT, 'bluelight');

const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.wasm': 'application/wasm',
  '.dcm': 'application/dicom',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
};

function bluelightStaticPlugin(): Plugin {
  return {
    name: 'kitten-bluelight-static',
    configureServer(server) {
      server.middlewares.use('/static/blue', (req, res, next) => {
        const rawUrl = (req.url || '/').split('?')[0];
        let decodedPath: string;
        try {
          decodedPath = decodeURIComponent(rawUrl);
        } catch {
          res.statusCode = 400;
          res.end('Bad Request');
          return;
        }
        const safeRel = decodedPath.replace(/^\/+/, '');
        const resolved = path.resolve(BLUE_ROOT, safeRel);
        if (!resolved.startsWith(BLUE_ROOT + path.sep) && resolved !== BLUE_ROOT) {
          res.statusCode = 403;
          res.end('Forbidden');
          return;
        }
        if (fs.existsSync(resolved) && fs.statSync(resolved).isFile()) {
          const ext = path.extname(resolved).toLowerCase();
          res.setHeader('Content-Type', MIME_TYPES[ext] || 'application/octet-stream');
          fs.createReadStream(resolved).pipe(res);
          return;
        }
        next();
      });
    },
    closeBundle() {
      if (!fs.existsSync(BLUELIGHT_SRC)) return;
      const dest = path.resolve(__dirname, 'dist', 'static', 'blue', 'bluelight');
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      fs.cpSync(BLUELIGHT_SRC, dest, { recursive: true, force: true });
    },
  };
}

export default defineConfig({
  base: './',
  plugins: [
    react(),
    bluelightStaticPlugin(),
    nodePolyfills({
      include: ['events', 'url', 'fs', 'path'],
      globals: {
        Buffer: true,
        global: true,
        process: true,
      },
    }),
  ],
  server: {
    host: true,
    port: 3000,
    strictPort: true,
    allowedHosts: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      '/static/uploads': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      '/health': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
    },
  },
  worker: {
    format: 'es',
  },
});

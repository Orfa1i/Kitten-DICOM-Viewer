import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

export default defineConfig({
  base: './',
  plugins: [
    react(),
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
    allowedHosts: true,
  },
  worker: {
    format: 'es',
  },
});

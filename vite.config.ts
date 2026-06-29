import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

// Dev proxy: same-origin `/api/*` is served by Caddy in prod (→ users for /api/auth, hub otherwise).
// In dev we forward to a Caddy that already does that split — the simplest target is v2x.tools itself
// (its Caddy routes /api/auth → users and /api → hub). Override with VITE_API_TARGET.
const apiTarget = process.env.VITE_API_TARGET ?? 'https://v2x.tools';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  server: {
    proxy: {
      '/api': { target: apiTarget, changeOrigin: true, secure: false },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
        },
      },
    },
  },
});

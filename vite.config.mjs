import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Root-level vite config used by Vercel.
// Sets root to client/ so all source paths resolve correctly.
export default defineConfig({
  root: 'client',
  plugins: [react()],
  build: {
    outDir: '../dist',
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    proxy: { '/api': 'http://localhost:3001' },
  },
});

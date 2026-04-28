import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { existsSync } from 'fs';

// In Docker / CI, logos.png is copied into client/public/assets/ beforehand.
// Locally, we resolve the alias to the project-root assets/ folder.
const assetsAlias = existsSync(resolve(__dirname, '..', 'assets', 'logos.png'))
  ? resolve(__dirname, '..', 'assets')
  : resolve(__dirname, 'public', 'assets'); // fallback if already copied

export default defineConfig({
  plugins: [react()],

  server: {
    port: 5173,
    fs: { allow: ['..'] },   // allow imports from project root in dev
    proxy: {
      '/api': { target: 'http://localhost:5000', changeOrigin: true },
      '/socket.io': { target: 'http://localhost:5000', ws: true, changeOrigin: true },
    },
  },

  resolve: {
    alias: {
      '@assets': assetsAlias,
    },
  },
});

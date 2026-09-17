import { fileURLToPath, URL } from 'node:url';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Loads ALL variables (including non-VITE_ ones) for use in this Node-side config only.
  // Only VITE_-prefixed variables are ever exposed to the browser bundle.
  const env = loadEnv(mode, process.cwd(), '');
  const apiTarget = env.SORAQ_DEV_API_TARGET || 'http://localhost/SoraqSystem/backend/public';

  return {
    // Tailwind v4 is required by HeroUI v3 (see docs/decisions/0007).
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
    },
    server: {
      port: 5173,
      strictPort: true,
      // Same-origin API in development, mirroring production (soraq.app/api):
      // no CORS configuration, and session cookies behave exactly like production.
      proxy: {
        '/api': {
          target: apiTarget,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ''),
        },
      },
    },
    build: {
      target: 'es2022',
      sourcemap: false,
    },
  };
});

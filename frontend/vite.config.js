import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const backendUrl = env.VITE_BACKEND_URL
  const port = parseInt(env.VITE_PORT)

  return {
    plugins: [react()],
    server: {
      port,
      // Dev proxy: forward /api and /outputs to the local backend.
      // On Vercel (production), VITE_API_BASE_URL must be set to the full backend URL.
      proxy: {
        '/api': {
          target: backendUrl || 'http://localhost:5000',
          changeOrigin: true,
          secure: false
        },
        '/outputs': {
          target: backendUrl || 'http://localhost:5000',
          changeOrigin: true,
          secure: false
        }
      }
    },
    build: {
      outDir: 'dist',
      // Generate a manifest for cache-busting
      manifest: true,
      rollupOptions: {
        output: {
          // Split vendor code for better caching
          manualChunks: {
            vendor: ['react', 'react-dom'],
            motion: ['framer-motion'],
            ui: ['lucide-react', 'clsx', 'tailwind-merge']
          }
        }
      }
    }
  }
})

import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  // .env.development es la API del APK de prueba. El servidor de Vite
  // reenvía /api a la URL de .env, el backend local.
  const localEnv = loadEnv('', process.cwd(), '')
  const apiTarget = command === 'serve'
    ? (localEnv.VITE_API_URL || 'http://127.0.0.1:8081')
    : (env.VITE_API_URL || 'http://127.0.0.1:8081')

  return {
    plugins: [react(), tailwindcss()],
    server: {
      // Windows reserva 5174-5273. El 5173 lo usa otro proyecto en localhost.
      host: '127.0.0.1',
      port: 5274,
      strictPort: true,
      proxy: {
        '/api': {
          target: apiTarget,
          changeOrigin: true,
          ws: true,
        },
        '/uploads': {
          target: apiTarget,
          changeOrigin: true,
        },
      },
    },
  }
})

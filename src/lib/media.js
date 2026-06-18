import { optimizeCloudinaryUrl } from './mediaCloudinary'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8001'

export { optimizeCloudinaryUrl } from './mediaCloudinary'

export function resolveMediaUrl(path, options = {}) {
  if (!path) return null
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return optimizeCloudinaryUrl(path, options)
  }
  // En dev, /uploads pasa por el proxy de Vite. En prod, apunta al backend.
  if (path.startsWith('/')) {
    return import.meta.env.DEV ? path : `${API_URL}${path}`
  }
  return `${API_URL}/${path}`
}

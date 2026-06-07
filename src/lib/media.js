const API_URL = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8001'

export function resolveMediaUrl(path) {
  if (!path) return null
  if (path.startsWith('http://') || path.startsWith('https://')) return path
  // En dev, /uploads pasa por el proxy de Vite. En prod, apunta al backend.
  if (path.startsWith('/')) {
    return import.meta.env.DEV ? path : `${API_URL}${path}`
  }
  return `${API_URL}/${path}`
}

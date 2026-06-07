const API_URL = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8001'

export function resolveMediaUrl(path) {
  if (!path) return null
  if (path.startsWith('http://') || path.startsWith('https://')) return path
  if (path.startsWith('/')) return path
  return `${API_URL}/${path}`
}

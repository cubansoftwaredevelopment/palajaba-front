import { optimizeCloudinaryUrl } from './mediaCloudinary.js'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8001'
/** 1x1 transparente: evita requests a rutas legacy /api/catalog/banners/.../file que ya no existen. */
const TRANSPARENT_PIXEL =
  'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'

export function isUnservableLegacyBannerUrl(path) {
  const value = String(path || '').trim()
  if (!value) return false
  const withoutQuery = value.split('?')[0].replace(/\/+$/, '')
  return withoutQuery.includes('/api/catalog/banners/') && withoutQuery.endsWith('/file')
}

export function resolveMediaUrl(path, options = {}) {
  if (!path) return null
  if (isUnservableLegacyBannerUrl(path)) return TRANSPARENT_PIXEL
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return optimizeCloudinaryUrl(path, options)
  }
  // Las fotos del sitio (/images, logos) salen del propio front.
  // /uploads y /api, en prod, salen del backend.
  if (path.startsWith('/images/') || path.startsWith('/logo') || path.startsWith('/favicon') || path.startsWith('/icons')) {
    return path
  }
  if (path.startsWith('/')) {
    return import.meta.env.DEV ? path : `${API_URL}${path}`
  }
  return `${API_URL}/${path}`
}

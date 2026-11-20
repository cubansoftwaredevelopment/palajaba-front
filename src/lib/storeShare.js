import { BRAND_NAME } from '../constants/branding'
import { storeNameToSlug, storePublicPath } from './storeSlug'

export function resolveStoreSlug(profile) {
  return profile?.store_slug || storeNameToSlug(profile?.store_name)
}

/** Origen público (VITE_SITE_URL). En la app nativa window.location.origin es localhost. */
export function getPublicSiteOrigin() {
  const raw = String(import.meta.env.VITE_SITE_URL || '').trim()
  if (raw) {
    try {
      return new URL(raw).origin
    } catch {
      return raw.replace(/\/+$/, '')
    }
  }
  if (typeof window !== 'undefined' && window.location?.origin) return window.location.origin
  return ''
}

export function getStoreCatalogUrl(profile) {
  const slug = resolveStoreSlug(profile)
  const path = storePublicPath(slug)
  const origin = getPublicSiteOrigin()
  return origin ? `${origin}${path}` : path
}

export function getStoreShareMessage(profile) {
  const url = getStoreCatalogUrl(profile)
  const storeName = profile?.store_name?.trim() || 'mi tienda'
  return `Mira el catálogo de ${storeName} en ${BRAND_NAME}: ${url}`
}

export function buildWhatsAppShareUrl(message) {
  return `https://wa.me/?text=${encodeURIComponent(message)}`
}

export function buildTelegramShareUrl(url, text) {
  return `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`
}

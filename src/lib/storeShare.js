import { BRAND_NAME } from '../constants/branding'
import { storeNameToSlug, storePublicPath } from './storeSlug'

export function resolveStoreSlug(profile) {
  return profile?.store_slug || storeNameToSlug(profile?.store_name)
}

export function getStoreCatalogUrl(profile) {
  const slug = resolveStoreSlug(profile)
  const path = storePublicPath(slug)

  if (typeof window === 'undefined') {
    return path
  }

  return `${window.location.origin}${path}`
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

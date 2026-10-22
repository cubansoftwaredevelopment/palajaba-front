import { Capacitor } from '@capacitor/core'
import { Share } from '@capacitor/share'
import { BRAND_NAME } from '../constants/branding'
import { storeGestorPublicPath, storePublicPath } from './storeSlug'
import { buildWhatsAppShareUrl } from './storeShare'

export function zoneLabel(location) {
  const municipality = location?.municipality?.name
  const province = location?.province?.name
  if (municipality && province) return `${municipality}, ${province}`
  return province || municipality || ''
}

function absoluteUrl(path) {
  if (typeof window === 'undefined') return path
  return `${window.location.origin}${path}`
}

function zoneQuery(location, extra = {}) {
  const params = new URLSearchParams({
    provincia: location.province.id,
    municipio: location.municipality.id,
  })
  for (const [key, value] of Object.entries(extra)) {
    if (value) params.set(key, String(value))
  }
  return params.toString()
}

export function buildProductShareUrl(productId, location) {
  return absoluteUrl(`/comprar?${zoneQuery(location, { producto: productId })}`)
}

export function buildStoreShareUrl(storeSlug, location, gestorUsername = null) {
  const path = gestorUsername
    ? storeGestorPublicPath(storeSlug, gestorUsername)
    : storePublicPath(storeSlug)
  return absoluteUrl(`${path}?${zoneQuery(location)}`)
}

export function encodeSharedJabaItems(items) {
  return (items ?? [])
    .filter((item) => item?.id)
    .map((item) => `${item.id}.${Math.max(1, Math.floor(Number(item.quantity) || 1))}`)
    .join(',')
}

export function parseSharedJabaItems(value) {
  const entries = []
  for (const part of String(value || '').split(',')) {
    const text = part.trim()
    if (!text) continue
    const [productId, quantityRaw] = text.split('.')
    const id = productId?.trim()
    if (!id) continue
    const quantity = Math.min(99, Math.max(1, Math.floor(Number(quantityRaw) || 1)))
    entries.push({ id, quantity })
  }
  return entries
}

export function buildJabaShareUrl(items, location) {
  return absoluteUrl(`/comprar?${zoneQuery(location, { jaba: encodeSharedJabaItems(items) })}`)
}

export function buildProductShareMessage(product, location) {
  const place = zoneLabel(location)
  const name = product?.name?.trim() || 'este producto'
  const url = buildProductShareUrl(product.id, location)
  return `Mira ${name} en ${place} en ${BRAND_NAME}: ${url}`
}

export function buildStoreShareMessage({ storeName, storeSlug, gestorUsername, location }) {
  const place = zoneLabel(location)
  const name = storeName?.trim() || 'esta tienda'
  const url = buildStoreShareUrl(storeSlug, location, gestorUsername)
  return `Mira ${name} en ${place} en ${BRAND_NAME}: ${url}`
}

export function buildJabaShareMessage(items, location) {
  const place = zoneLabel(location)
  const url = buildJabaShareUrl(items, location)
  return `Mira mi jaba en ${place} en ${BRAND_NAME}: ${url}`
}

export function locationFromBusinessArea(area) {
  if (!area?.province_id || !area?.municipality_id) return null
  return {
    province: { id: area.province_id, name: area.province_name },
    municipality: { id: area.municipality_id, name: area.municipality_name },
  }
}

export function buildSellerCheckoutShareMessage({ storeName, items, location }) {
  const place = zoneLabel(location)
  const count = items?.length ?? 0
  const url = buildJabaShareUrl(items, location)
  const name = storeName?.trim() || 'esta tienda'
  const productLabel = count === 1 ? 'un producto' : `${count} productos`
  return `Te compartí ${productLabel} de ${name} en ${place} en ${BRAND_NAME}: ${url}`
}

export function canUseSystemShare() {
  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') return true
  return Capacitor.isNativePlatform()
}

export async function shareWithSystem({ title, text, url }) {
  if (Capacitor.isNativePlatform()) {
    await Share.share({ title, text, url, dialogTitle: title })
    return
  }
  await navigator.share({ title, text, url })
}

export { buildWhatsAppShareUrl }

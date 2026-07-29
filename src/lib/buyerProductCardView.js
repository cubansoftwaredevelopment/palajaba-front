import { storeNameToSlug, storePublicPath } from './storeSlug.js'

/**
 * Flags de presentación de la tarjeta de producto del marketplace.
 * El aviso de domicilio vive solo en el detalle, no en la card.
 */
export function getBuyerProductCardContentFlags() {
  return {
    showPickupBadge: false,
    showPickupHint: false,
  }
}

/** Ruta pública de la tienda del producto, o null si no hay slug usable. */
export function resolveBuyerProductStorePath(store) {
  if (!store) return null
  const slug = (store.store_slug || storeNameToSlug(store.store_name) || '').trim()
  if (!slug) return null
  return storePublicPath(slug)
}

/**
 * Jerarquía de acciones de la tarjeta (para UI + tests).
 * primary = Comprar (sólido, full width)
 * secondary = Pa' La Jaba (ghost/outline + ícono)
 */
export const BUYER_PRODUCT_CARD_ACTIONS = Object.freeze({
  primary: 'buy',
  secondary: 'jaba',
  layout: 'stack',
})

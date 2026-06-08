const RESERVED_STORE_SLUGS = new Set([
  'admin',
  'comprar',
  'login',
  'registro',
  'tienda',
])

export function storeNameToSlug(storeName) {
  if (!storeName) return ''

  return storeName
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function isReservedStoreSlug(slug) {
  if (!slug) return true
  return RESERVED_STORE_SLUGS.has(slug.trim().toLowerCase())
}

export function storePublicPath(storeSlug) {
  const slug = storeSlug?.trim()
  if (!slug || isReservedStoreSlug(slug)) return '/comprar'
  return `/${encodeURIComponent(slug)}`
}
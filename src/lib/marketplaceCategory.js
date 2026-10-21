import { storeGestorPublicPath, storePublicPath } from './storeSlug'

export function slugifyMarketplaceCategory(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function marketplaceCategoryPath(section) {
  const slug =
    slugifyMarketplaceCategory(section?.category_name || section?.name) ||
    slugifyMarketplaceCategory(section?.category_id || section?.id)
  return `/comprar/${encodeURIComponent(slug)}`
}

export function storeCategoryPath(storeSlug, section, gestorUsername) {
  const slug =
    slugifyMarketplaceCategory(section?.category_name || section?.name) ||
    slugifyMarketplaceCategory(section?.category_id || section?.id)
  const base = gestorUsername
    ? storeGestorPublicPath(storeSlug, gestorUsername)
    : storePublicPath(storeSlug)
  return `${base}/${encodeURIComponent(slug)}`
}

export function resolveMarketplaceCategory(categories, slug) {
  const raw = decodeURIComponent(String(slug || '')).trim()
  if (!raw) return null

  const decoded = raw.toLowerCase()
  const decodedSlug = slugifyMarketplaceCategory(raw)

  return (
    (categories || []).find((category) => {
      const id = String(category.id || '').toLowerCase()
      return (
        id === decoded ||
        id === decodedSlug ||
        slugifyMarketplaceCategory(category.name) === decodedSlug
      )
    }) ?? null
  )
}

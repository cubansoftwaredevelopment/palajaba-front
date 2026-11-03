import { storePublicPath } from './storeSlug.js'

export const STORE_PAGES = Object.freeze([
  { key: 'faq', slug: 'faq', label: 'FAQ' },
  { key: 'about', slug: 'sobre-nosotros', label: 'Sobre nosotros' },
  { key: 'delivery_policy', slug: 'politica-de-entrega', label: 'Política de entrega' },
  { key: 'terms', slug: 'terminos-y-condiciones', label: 'Términos y condiciones' },
])

const PAGE_BY_SLUG = new Map(STORE_PAGES.map((page) => [page.slug, page]))

export const EMPTY_STORE_PAGE = Object.freeze({
  type: 'doc',
  content: [{ type: 'paragraph' }],
})

export const MIN_IMAGE_WIDTH = 5
export const MAX_IMAGE_WIDTH = 100

const UNSAFE_LINK = /[\s<>"'\\]/

export function normalizeStoreLink(value) {
  const raw = String(value ?? '').trim()
  if (!raw || raw.length > 2000 || UNSAFE_LINK.test(raw)) return ''
  if (raw.startsWith('/') && !raw.startsWith('//')) return raw
  const withScheme = /^[a-z][a-z0-9+.-]*:/i.test(raw) ? raw : `https://${raw}`
  try {
    const url = new URL(withScheme)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return ''
    if (!url.hostname) return ''
    return url.href
  } catch {
    return ''
  }
}

export function clampImageWidth(value) {
  const number = Number(value)
  if (!Number.isFinite(number)) return MAX_IMAGE_WIDTH
  return Math.min(MAX_IMAGE_WIDTH, Math.max(MIN_IMAGE_WIDTH, Math.round(number)))
}

export function storePageBySlug(slug) {
  if (!slug) return null
  return PAGE_BY_SLUG.get(String(slug).trim().toLowerCase()) ?? null
}

export function isStorePageSlug(slug) {
  return Boolean(storePageBySlug(slug))
}

export function storePagePublicPath(storeSlug, slug) {
  const base = storePublicPath(storeSlug)
  if (!slug || base === '/comprar') return base
  return `${base}/${slug}`
}

export function storeCopyrightLine(storeName, year = new Date().getFullYear()) {
  const name = String(storeName || '').trim() || 'Tienda'
  return `© ${year} ${name}. Todos los derechos reservados.`
}

export function isStorePagePublished(pages, key) {
  return pages?.[key] === true
}

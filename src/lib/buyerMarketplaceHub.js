import { matchPath, useLocation, useMatch } from 'react-router-dom'
import { isReservedStoreSlug } from './storeSlug'

const COMPRAR_SCROLL_EXCLUDED = new Set(['provincia', 'municipio', 'negocios', 'tienda'])

export function isPublicStorePath(pathname) {
  const parts = pathname.split('/').filter(Boolean)
  if (parts.length < 1 || parts.length > 2) return false
  return !isReservedStoreSlug(decodeURIComponent(parts[0]))
}

export function isScrollToTopPath(pathname) {
  const path = String(pathname || '').split('?')[0]
  if (path === '/comprar' || path === '/comprar/') return true
  const marketplaceCategory = matchPath({ path: '/comprar/:categorySlug', end: true }, path)
  const categorySlug = marketplaceCategory?.params?.categorySlug
  if (categorySlug) {
    return !COMPRAR_SCROLL_EXCLUDED.has(decodeURIComponent(categorySlug).toLowerCase())
  }
  return isPublicStorePath(path)
}

export function useBuyerMarketplaceHub() {
  const marketplace = useMatch({ path: '/comprar', end: true })
  const businesses = useMatch({ path: '/comprar/negocios', end: true })
  const { pathname } = useLocation()
  return Boolean(marketplace || businesses || isPublicStorePath(pathname))
}

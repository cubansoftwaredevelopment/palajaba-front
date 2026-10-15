import { useLocation, useMatch } from 'react-router-dom'
import { isReservedStoreSlug } from './storeSlug'

export function isPublicStorePath(pathname) {
  const parts = pathname.split('/').filter(Boolean)
  if (parts.length < 1 || parts.length > 2) return false
  return !isReservedStoreSlug(decodeURIComponent(parts[0]))
}

export function useBuyerMarketplaceHub() {
  const marketplace = useMatch({ path: '/comprar', end: true })
  const businesses = useMatch({ path: '/comprar/negocios', end: true })
  const { pathname } = useLocation()
  return Boolean(marketplace || businesses || isPublicStorePath(pathname))
}

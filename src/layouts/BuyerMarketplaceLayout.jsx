import { useEffect } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import {
  applySharedZoneFromSearch,
  hasCompleteBuyerLocation,
  resolveBuyerEntryPath,
} from '../buyer/utils/buyerLocation.js'

const LAST_MARKETPLACE_LOCATION_KEY = 'pala_jaba_last_marketplace_location'

export default function BuyerMarketplaceLayout() {
  const location = useLocation()
  const preview = new URLSearchParams(location.search).get('vista') === 'preview'

  useEffect(() => {
    if (preview || !hasCompleteBuyerLocation()) return undefined
    try {
      window.localStorage.setItem(
        LAST_MARKETPLACE_LOCATION_KEY,
        `${location.pathname}${location.search}${location.hash}`,
      )
    } catch {
      // Si el almacenamiento está deshabilitado, la vuelta usa /comprar.
    }
    return undefined
  }, [location.hash, location.pathname, location.search, preview])

  if (!preview) {
    applySharedZoneFromSearch(location.search)
    if (!hasCompleteBuyerLocation()) {
      return <Navigate to={resolveBuyerEntryPath()} replace />
    }
  }

  return <Outlet />
}

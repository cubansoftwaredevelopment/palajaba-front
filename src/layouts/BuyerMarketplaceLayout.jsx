import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import BuyerMarketplaceNav from '../buyer/components/BuyerMarketplaceNav'

const LAST_MARKETPLACE_LOCATION_KEY = 'pala_jaba_last_marketplace_location'

export default function BuyerMarketplaceLayout() {
  const location = useLocation()

  useEffect(() => {
    try {
      window.localStorage.setItem(
        LAST_MARKETPLACE_LOCATION_KEY,
        `${location.pathname}${location.search}${location.hash}`,
      )
    } catch {
      // Si el almacenamiento está deshabilitado, la vuelta usa /comprar.
    }
  }, [location.pathname, location.search, location.hash])

  return (
    <>
      <Outlet />
      <BuyerMarketplaceNav />
    </>
  )
}

import { Outlet } from 'react-router-dom'
import BuyerMarketplaceNav from '../buyer/components/BuyerMarketplaceNav'

export default function BuyerMarketplaceLayout() {
  return (
    <>
      <Outlet />
      <BuyerMarketplaceNav />
    </>
  )
}

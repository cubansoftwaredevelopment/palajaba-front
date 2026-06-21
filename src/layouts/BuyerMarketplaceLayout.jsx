import { Outlet } from 'react-router-dom'
import BuyerMarketplaceNav from '../components/buyer/BuyerMarketplaceNav'

export default function BuyerMarketplaceLayout() {
  return (
    <>
      <Outlet />
      <BuyerMarketplaceNav />
    </>
  )
}

import { Outlet } from 'react-router-dom'
import BuyerMarketplaceNav from '../components/buyer/BuyerMarketplaceNav'
import { isBuyerMarketplaceNavVisible } from '../constants/buyerMarketplaceNav'

export default function BuyerMarketplaceLayout() {
  return (
    <>
      <Outlet />
      {isBuyerMarketplaceNavVisible() ? <BuyerMarketplaceNav /> : null}
    </>
  )
}

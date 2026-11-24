import { Outlet } from 'react-router-dom'
import BuyerMarketplaceNav from '../buyer/componentes/BuyerMarketplaceNav.jsx'
import { BuyerDisplayCurrencyProvider, BuyerJabaProvider } from '../buyer/context/context.js'

export default function BuyerJabaLayout() {
  return (
    <BuyerDisplayCurrencyProvider>
      <BuyerJabaProvider>
        <Outlet />
        <BuyerMarketplaceNav />
      </BuyerJabaProvider>
    </BuyerDisplayCurrencyProvider>
  )
}

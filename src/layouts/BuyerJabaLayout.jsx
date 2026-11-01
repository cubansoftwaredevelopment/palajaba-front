import { Outlet } from 'react-router-dom'
import { BuyerDisplayCurrencyProvider, BuyerJabaProvider } from '../buyer/context.js'

export default function BuyerJabaLayout() {
  return (
    <BuyerDisplayCurrencyProvider>
      <BuyerJabaProvider>
        <Outlet />
      </BuyerJabaProvider>
    </BuyerDisplayCurrencyProvider>
  )
}

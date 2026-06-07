import { Outlet } from 'react-router-dom'
import { BuyerDisplayCurrencyProvider } from '../context/BuyerDisplayCurrencyContext'
import { BuyerJabaProvider } from '../context/BuyerJabaContext'

export default function BuyerJabaLayout() {
  return (
    <BuyerDisplayCurrencyProvider>
      <BuyerJabaProvider>
        <Outlet />
      </BuyerJabaProvider>
    </BuyerDisplayCurrencyProvider>
  )
}

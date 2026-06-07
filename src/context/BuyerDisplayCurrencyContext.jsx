import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { getBuyerDisplayCurrency, setBuyerDisplayCurrency } from '../lib/buyerDisplayCurrency'

const BuyerDisplayCurrencyContext = createContext(null)

export function BuyerDisplayCurrencyProvider({ children }) {
  const [currency, setCurrencyState] = useState(getBuyerDisplayCurrency)

  useEffect(() => {
    function onChange(event) {
      setCurrencyState(event.detail)
    }

    window.addEventListener('buyer-display-currency-change', onChange)
    return () => window.removeEventListener('buyer-display-currency-change', onChange)
  }, [])

  const value = useMemo(
    () => ({
      currency,
      setCurrency: (code) => {
        setBuyerDisplayCurrency(code)
        setCurrencyState(code)
      },
    }),
    [currency],
  )

  return (
    <BuyerDisplayCurrencyContext.Provider value={value}>
      {children}
    </BuyerDisplayCurrencyContext.Provider>
  )
}

export function useBuyerDisplayCurrency() {
  const context = useContext(BuyerDisplayCurrencyContext)
  if (!context) {
    throw new Error('useBuyerDisplayCurrency debe usarse dentro de BuyerDisplayCurrencyProvider')
  }
  return context
}

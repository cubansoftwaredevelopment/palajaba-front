import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import {
  BUYER_DISPLAY_CURRENCY_EVENT,
  getBuyerDisplayCurrencies,
  setBuyerDisplayCurrencies,
  setBuyerDisplayCurrency,
  toggleBuyerDisplayCurrency,
} from '../lib/buyerDisplayCurrency'
import {
  areExchangeRatesAvailable,
  getCupPerUnit,
  getExchangeRatesMeta,
  loadExchangeRates,
} from '../lib/exchangeRates'

export const BuyerDisplayCurrencyContext = createContext(null)

export function BuyerDisplayCurrencyProvider({ children }) {
  const [currencies, setCurrenciesState] = useState(getBuyerDisplayCurrencies)
  const [cupPerUnit, setCupPerUnitState] = useState(getCupPerUnit)
  const [ratesReady, setRatesReady] = useState(areExchangeRatesAvailable)
  const [ratesMeta, setRatesMeta] = useState(getExchangeRatesMeta)

  useEffect(() => {
    let cancelled = false

    loadExchangeRates()
      .then(() => {
        if (cancelled) return
        setCupPerUnitState(getCupPerUnit())
        setRatesMeta(getExchangeRatesMeta())
        setRatesReady(areExchangeRatesAvailable())
      })
      .catch(() => {
        if (!cancelled) {
          setCupPerUnitState(getCupPerUnit())
          setRatesMeta(getExchangeRatesMeta())
          setRatesReady(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    function onChange(event) {
      const next = Array.isArray(event.detail) ? event.detail : getBuyerDisplayCurrencies()
      setCurrenciesState(next)
    }

    window.addEventListener(BUYER_DISPLAY_CURRENCY_EVENT, onChange)
    return () => window.removeEventListener(BUYER_DISPLAY_CURRENCY_EVENT, onChange)
  }, [])

  const value = useMemo(
    () => ({
      currencies,
      currency: currencies[0],
      cupPerUnit,
      ratesReady,
      ratesMeta,
      setCurrency: (code) => {
        setCurrenciesState(setBuyerDisplayCurrency(code))
      },
      setCurrencies: (codes) => {
        setCurrenciesState(setBuyerDisplayCurrencies(codes))
      },
      toggleCurrency: (code) => {
        setCurrenciesState(toggleBuyerDisplayCurrency(code))
      },
    }),
    [currencies, cupPerUnit, ratesMeta, ratesReady],
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

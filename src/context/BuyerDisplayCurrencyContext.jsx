import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { getBuyerDisplayCurrency, setBuyerDisplayCurrency } from '../lib/buyerDisplayCurrency'
import { loadExchangeRates, getCupPerUnit } from '../lib/exchangeRates'

const BuyerDisplayCurrencyContext = createContext(null)

export function BuyerDisplayCurrencyProvider({ children }) {
  const [currency, setCurrencyState] = useState(getBuyerDisplayCurrency)
  const [cupPerUnit, setCupPerUnitState] = useState(getCupPerUnit)
  const [ratesReady, setRatesReady] = useState(false)
  const [ratesMeta, setRatesMeta] = useState(null)

  useEffect(() => {
    let cancelled = false

    loadExchangeRates()
      .then((data) => {
        if (cancelled) return
        setCupPerUnitState(getCupPerUnit())
        setRatesMeta({
          updatedAt: data?.updated_at ?? null,
          source: data?.source ?? 'elTOQUE',
          attribution: data?.attribution ?? null,
          referenceDate: data?.reference_date ?? null,
          referenceTime: data?.reference_time ?? null,
          stale: Boolean(data?.stale),
        })
      })
      .catch(() => {
        if (!cancelled) {
          setCupPerUnitState(getCupPerUnit())
        }
      })
      .finally(() => {
        if (!cancelled) {
          setRatesReady(true)
        }
      })

    return () => {
      cancelled = true
    }
  }, [])

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
      cupPerUnit,
      ratesReady,
      ratesMeta,
      setCurrency: (code) => {
        setBuyerDisplayCurrency(code)
        setCurrencyState(code)
      },
    }),
    [currency, cupPerUnit, ratesMeta, ratesReady],
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

import { useEffect, useState } from 'react'
import {
  formatPlanAmount,
  getPlanPrice,
  getPlanPriceUsd,
  getPlanYearlySavings,
} from '../constants/plan'
import { areExchangeRatesAvailable, getCupPerUnit, loadExchangeRates } from './exchangeRates'

export function usePlanPricing() {
  const [cupPerUnit, setCupPerUnit] = useState(() => getCupPerUnit())
  const [ready, setReady] = useState(() => areExchangeRatesAvailable())

  useEffect(() => {
    let mounted = true

    loadExchangeRates()
      .then(() => {
        if (!mounted) return
        setCupPerUnit(getCupPerUnit())
        setReady(areExchangeRatesAvailable())
      })
      .catch(() => {
        if (mounted) {
          setCupPerUnit(getCupPerUnit())
          setReady(false)
        }
      })

    return () => {
      mounted = false
    }
  }, [])

  return {
    ready,
    cupPerUnit,
    getPlanPrice: (tier, billing) => getPlanPrice(tier, billing, cupPerUnit),
    getPlanPriceUsd,
    getPlanYearlySavings: (tier) => getPlanYearlySavings(tier, cupPerUnit),
    formatPlanAmount,
  }
}

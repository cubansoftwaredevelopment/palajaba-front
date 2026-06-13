import { useEffect, useState } from 'react'
import {
  formatPlanAmount,
  getPlanPrice,
  getPlanYearlySavings,
} from '../constants/plan'
import { getCupPerUnit, loadExchangeRates } from './exchangeRates'

export function usePlanPricing() {
  const [cupPerUnit, setCupPerUnit] = useState(() => getCupPerUnit())
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let mounted = true

    loadExchangeRates()
      .catch(() => null)
      .finally(() => {
        if (!mounted) return
        setCupPerUnit(getCupPerUnit())
        setReady(true)
      })

    return () => {
      mounted = false
    }
  }, [])

  return {
    ready,
    cupPerUnit,
    getPlanPrice: (tier, billing) => getPlanPrice(tier, billing, cupPerUnit),
    getPlanYearlySavings: (tier) => getPlanYearlySavings(tier, cupPerUnit),
    formatPlanAmount,
  }
}

import { useEffect, useState } from 'react'
import {
  DEFAULT_PLAN_PRICES,
  formatPlanAmount,
  getPlanPrice,
  getPlanPeriodSavings,
  getPlanYearlySavings,
  normalizePlanPrices,
} from '../subscriptions/constants.js'
import { fetchPlanPrices } from '../subscriptions/api.js'
import { areExchangeRatesAvailable, getCupPerUnit, loadExchangeRates } from './exchangeRates'

export function usePlanPricing() {
  const [cupPerUnit, setCupPerUnit] = useState(() => getCupPerUnit())
  const [ready, setReady] = useState(() => areExchangeRatesAvailable())
  const [planPrices, setPlanPrices] = useState(DEFAULT_PLAN_PRICES)
  const [qvapayPlanDiscountPercent, setQvapayPlanDiscountPercent] = useState(0)

  useEffect(() => {
    let mounted = true

    Promise.all([
      loadExchangeRates().catch(() => null),
      fetchPlanPrices().catch(() => null),
    ]).then(([, pricesPayload]) => {
      if (!mounted) return
      setCupPerUnit(getCupPerUnit())
      setReady(areExchangeRatesAvailable())
      if (pricesPayload?.plan_prices) {
        setPlanPrices(normalizePlanPrices(pricesPayload.plan_prices))
      }
      const discount = Number(pricesPayload?.qvapay_plan_discount_percent)
      setQvapayPlanDiscountPercent(Number.isFinite(discount) ? discount : 0)
    })

    return () => {
      mounted = false
    }
  }, [])

  return {
    ready,
    cupPerUnit,
    planPrices,
    qvapayPlanDiscountPercent,
    getPlanPrice: (tier, billing) => getPlanPrice(tier, billing, cupPerUnit, planPrices),
    getPlanYearlySavings: (tier) => getPlanYearlySavings(tier, cupPerUnit, planPrices),
    getPlanPeriodSavings: (tier, billing) =>
      getPlanPeriodSavings(tier, billing, cupPerUnit, planPrices),
    formatPlanAmount,
  }
}

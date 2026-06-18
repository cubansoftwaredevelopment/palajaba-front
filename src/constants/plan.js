import { convertBetweenCurrencies } from '../lib/displayPrice'
import { areExchangeRatesAvailable, getCupPerUnit } from '../lib/exchangeRates'

export const PLAN_SOURCE_CURRENCY = 'USD'
export const PLAN_DISPLAY_CURRENCY = 'CUP'

export const PLAN_TAGLINE =
  'Elige el plan que mejor se adapte a tu negocio y empieza a vender sin complicaciones.'

export const PLAN_TIERS = {
  standard: {
    id: 'standard',
    name: 'Básico',
    description: 'Todo lo esencial para publicar tu catálogo y recibir pedidos.',
    features: [
      'Catálogos a tu medida',
      'Pedidos directos a Whatsapp',
      'Control total de tus ganancias',
      'Impresión de tickets para mensajeros',
    ],
    prices: {
      monthly: { amountUsd: 2, label: 'mes', period: 'monthly' },
      yearly: { amountUsd: 20, label: 'año', period: 'yearly' },
    },
    yearlySavingsUsd: 4,
  },
  premium: {
    id: 'premium',
    name: 'Premium',
    description: 'Estadísticas de tu tienda y más visibilidad en el marketplace.',
    features: [
      'Todo lo del plan Básico',
      'Estadísticas de tu tienda',
      'Boost en recomendaciones (×2 visibilidad)',
    ],
    prices: {
      monthly: { amountUsd: 4, label: 'mes', period: 'monthly' },
      yearly: { amountUsd: 30, label: 'año', period: 'yearly' },
    },
    yearlySavingsUsd: 18,
  },
}

export const PLAN_TIER_ORDER = ['standard', 'premium']

export function normalizePlanTier(tier) {
  return tier === 'premium' ? 'premium' : 'standard'
}

export function getPlanTier(tierId) {
  return PLAN_TIERS[normalizePlanTier(tierId)]
}

export function getPlanPriceUsd(tier, billing) {
  const period = billing === 'yearly' ? 'yearly' : 'monthly'
  return getPlanTier(tier).prices[period]
}

export function getPlanPrice(tier, billing, cupPerUnit = getCupPerUnit()) {
  const usdPrice = getPlanPriceUsd(tier, billing)
  if (!areExchangeRatesAvailable()) {
    return {
      ...usdPrice,
      amountUsd: usdPrice.amountUsd,
      amount: null,
      currency: PLAN_DISPLAY_CURRENCY,
    }
  }
  return {
    ...usdPrice,
    amountUsd: usdPrice.amountUsd,
    amount: convertBetweenCurrencies(usdPrice.amountUsd, PLAN_SOURCE_CURRENCY, PLAN_DISPLAY_CURRENCY, cupPerUnit),
    currency: PLAN_DISPLAY_CURRENCY,
  }
}

export function getPlanYearlySavings(tier, cupPerUnit = getCupPerUnit()) {
  const savingsUsd = getPlanTier(tier).yearlySavingsUsd
  if (!areExchangeRatesAvailable()) return null
  return convertBetweenCurrencies(savingsUsd, PLAN_SOURCE_CURRENCY, PLAN_DISPLAY_CURRENCY, cupPerUnit)
}

export function formatPlanPriceLabel(price, formatter = formatPlanAmount) {
  if (price.amount != null && areExchangeRatesAvailable()) {
    return formatter(price.amount, price.currency)
  }
  return formatter(price.amountUsd, PLAN_SOURCE_CURRENCY)
}

export function formatPlanAmount(amount, currency = PLAN_DISPLAY_CURRENCY) {
  return `${Number(amount).toLocaleString('es')} ${currency}`
}

export function sellerHasStatistics(profile) {
  return Boolean(profile?.has_statistics ?? normalizePlanTier(profile?.plan_tier) === 'premium')
}

export function sellerHasRecommendationBoost(profile) {
  return Boolean(
    profile?.has_recommendation_boost ?? normalizePlanTier(profile?.plan_tier) === 'premium',
  )
}

/** @deprecated Use getPlanPrice(planTier, billing) */
export const PLAN_PRICES = PLAN_TIERS.standard.prices

/** @deprecated Use getPlanTier(planTier).features */
export const PLAN_FEATURES = PLAN_TIERS.standard.features

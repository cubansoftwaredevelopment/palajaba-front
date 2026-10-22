import { convertBetweenCurrencies } from '../lib/displayPrice'
import { areExchangeRatesAvailable, getCupPerUnit } from '../lib/exchangeRates'
import { PLAN_GESTOR_FEATURES } from '../lib/gestorPlanLimits'

export const PLAN_SOURCE_CURRENCY = 'USD'
export const PLAN_DISPLAY_CURRENCY = 'CUP'

export const DEFAULT_PLAN_PRICES = {
  standard: {
    monthly: { amount: 2, currency: PLAN_SOURCE_CURRENCY },
    yearly: { amount: 20, currency: PLAN_SOURCE_CURRENCY },
  },
  pro: {
    monthly: { amount: 8, currency: PLAN_SOURCE_CURRENCY },
    yearly: { amount: 80, currency: PLAN_SOURCE_CURRENCY },
  },
  premium: {
    monthly: { amount: 4, currency: PLAN_SOURCE_CURRENCY },
    yearly: { amount: 30, currency: PLAN_SOURCE_CURRENCY },
  },
}

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
      PLAN_GESTOR_FEATURES.standard,
    ],
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    description: 'Estadísticas, banners y más visibilidad para hacer crecer tu tienda.',
    features: [
      'Todo lo del plan Básico',
      'Estadísticas de tu tienda',
      PLAN_GESTOR_FEATURES.pro,
      'Menciones en Instagram',
      'Banners de tu tienda',
      'Boost en recomendaciones (×2 visibilidad)',
      'Promociones de tus productos en redes sociales',
    ],
  },
  premium: {
    id: 'premium',
    name: 'Premium',
    description: 'Máxima visibilidad y personalización total del catálogo.',
    features: [
      'Todo lo del plan Pro',
      PLAN_GESTOR_FEATURES.premium,
      'Tema y personalización total del catálogo',
      'Prioridad en las búsquedas de negocios',
      'Boost en recomendaciones (×4 visibilidad)',
      'Soporte VIP',
    ],
  },
}

export const PLAN_TIER_ORDER = ['standard', 'pro', 'premium']

export function normalizePlanTier(tier) {
  if (tier === 'pro' || tier === 'premium') return tier
  return 'standard'
}

export function getPlanTier(tierId) {
  return PLAN_TIERS[normalizePlanTier(tierId)]
}

export function normalizePlanPrices(raw) {
  const source = raw && typeof raw === 'object' ? raw : {}
  const next = {}
  for (const tier of PLAN_TIER_ORDER) {
    const fallback = DEFAULT_PLAN_PRICES[tier]
    const configured = source[tier] && typeof source[tier] === 'object' ? source[tier] : {}
    next[tier] = {}
    for (const period of ['monthly', 'yearly']) {
      const item = configured[period] && typeof configured[period] === 'object' ? configured[period] : {}
      const amount = Number(item.amount)
      const currency = String(item.currency || fallback[period].currency).toUpperCase()
      next[tier][period] = {
        amount: Number.isFinite(amount) && amount >= 0 ? amount : fallback[period].amount,
        currency: currency || fallback[period].currency,
      }
    }
  }
  return next
}

function priceMeta(billing) {
  const period = billing === 'yearly' ? 'yearly' : 'monthly'
  return {
    label: period === 'yearly' ? 'año' : 'mes',
    period,
  }
}

export function getConfiguredPlanPrice(tier, billing, prices = DEFAULT_PLAN_PRICES) {
  const period = billing === 'yearly' ? 'yearly' : 'monthly'
  const configured = normalizePlanPrices(prices)[normalizePlanTier(tier)][period]
  return {
    ...priceMeta(billing),
    sourceAmount: configured.amount,
    sourceCurrency: configured.currency,
  }
}

export function getPlanPrice(tier, billing, cupPerUnit = getCupPerUnit(), prices = DEFAULT_PLAN_PRICES) {
  const configured = getConfiguredPlanPrice(tier, billing, prices)
  if (configured.sourceCurrency === PLAN_DISPLAY_CURRENCY) {
    return {
      ...configured,
      amount: Math.round(configured.sourceAmount),
      currency: PLAN_DISPLAY_CURRENCY,
    }
  }
  if (!areExchangeRatesAvailable()) {
    return {
      ...configured,
      amount: null,
      currency: PLAN_DISPLAY_CURRENCY,
    }
  }
  return {
    ...configured,
    amount: convertBetweenCurrencies(
      configured.sourceAmount,
      configured.sourceCurrency,
      PLAN_DISPLAY_CURRENCY,
      cupPerUnit,
    ),
    currency: PLAN_DISPLAY_CURRENCY,
  }
}

export function getPlanYearlySavings(tier, cupPerUnit = getCupPerUnit(), prices = DEFAULT_PLAN_PRICES) {
  const monthly = getPlanPrice(tier, 'monthly', cupPerUnit, prices)
  const yearly = getPlanPrice(tier, 'yearly', cupPerUnit, prices)
  if (monthly.amount == null || yearly.amount == null) return null
  return Math.max(0, monthly.amount * 12 - yearly.amount)
}

export function formatPlanPriceLabel(price, formatter = formatPlanAmount) {
  if (price.amount != null) {
    return formatter(price.amount, price.currency || PLAN_DISPLAY_CURRENCY)
  }
  if (price.sourceAmount != null && price.sourceCurrency) {
    return formatter(price.sourceAmount, price.sourceCurrency)
  }
  return formatter(price.amountUsd, PLAN_SOURCE_CURRENCY)
}

export function formatPlanAmount(amount, currency = PLAN_DISPLAY_CURRENCY) {
  return `${Number(amount).toLocaleString('es')} ${currency}`
}

export function sellerHasStatistics(profile) {
  const tier = normalizePlanTier(profile?.plan_tier)
  return Boolean(profile?.has_statistics ?? (tier === 'pro' || tier === 'premium'))
}

export function sellerHasRecommendationBoost(profile) {
  const tier = normalizePlanTier(profile?.plan_tier)
  return Boolean(profile?.has_recommendation_boost ?? (tier === 'pro' || tier === 'premium'))
}

export function sellerHasStoreBanners(profile) {
  const tier = normalizePlanTier(profile?.plan_tier)
  return Boolean(profile?.has_store_banners ?? (tier === 'pro' || tier === 'premium'))
}

export function sellerHasFullStoreCustomization(profile) {
  return Boolean(
    profile?.has_full_store_customization ?? normalizePlanTier(profile?.plan_tier) === 'premium',
  )
}

export {
  STANDARD_GESTOR_LIMIT,
  PRO_GESTOR_LIMIT,
  PLAN_GESTOR_FEATURES,
  canAddGestor,
  formatGestorUsage,
  gestorLimitFeatureLabel,
  maxGestoresForPlan,
} from '../lib/gestorPlanLimits'

/** @deprecated Use getPlanPrice(planTier, billing) */
export const PLAN_PRICES = {
  monthly: { amountUsd: DEFAULT_PLAN_PRICES.standard.monthly.amount, label: 'mes', period: 'monthly' },
  yearly: { amountUsd: DEFAULT_PLAN_PRICES.standard.yearly.amount, label: 'año', period: 'yearly' },
}

/** @deprecated Use getPlanTier(planTier).features */
export const PLAN_FEATURES = PLAN_TIERS.standard.features

import { convertBetweenCurrencies } from '../lib/displayPrice.js'
import { areExchangeRatesAvailable, getCupPerUnit } from '../lib/exchangeRates.js'
import { PLAN_GESTOR_FEATURES } from '../lib/gestorPlanLimits.js'

export const PLAN_SOURCE_CURRENCY = 'USD'
export const PLAN_DISPLAY_CURRENCY = 'CUP'

export const BILLING_PERIOD_ORDER = ['monthly', 'quarterly', 'yearly']

export const BILLING_UNIT_LABELS = {
  monthly: 'mes',
  quarterly: 'trimestre',
  yearly: 'año',
}

export const DEFAULT_PLAN_PRICES = {
  standard: {
    monthly: { amount: 2, currency: PLAN_SOURCE_CURRENCY },
    quarterly: { amount: 5, currency: PLAN_SOURCE_CURRENCY },
    yearly: { amount: 20, currency: PLAN_SOURCE_CURRENCY },
  },
  pro: {
    monthly: { amount: 8, currency: PLAN_SOURCE_CURRENCY },
    quarterly: { amount: 22, currency: PLAN_SOURCE_CURRENCY },
    yearly: { amount: 80, currency: PLAN_SOURCE_CURRENCY },
  },
  premium: {
    monthly: { amount: 4, currency: PLAN_SOURCE_CURRENCY },
    quarterly: { amount: 10, currency: PLAN_SOURCE_CURRENCY },
    yearly: { amount: 30, currency: PLAN_SOURCE_CURRENCY },
  },
}

export const PLAN_TAGLINE =
  'Elige el plan que mejor se adapte a tu negocio y empieza a vender sin complicaciones.'

export const PLAN_TIERS = {
  standard: {
    id: 'standard',
    name: 'Básico',
    recommended: false,
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
    recommended: true,
    description: 'Estadísticas, banners y más visibilidad para hacer crecer tu tienda.',
    features: [
      'Todo lo del plan Básico',
      'Estadísticas de tu tienda',
      PLAN_GESTOR_FEATURES.pro,
      'Banners de tu tienda',
      'Boost en recomendaciones (×2 visibilidad)',
      'Descuentos en productos',
    ],
  },
  premium: {
    id: 'premium',
    name: 'Premium',
    recommended: false,
    description: 'Máxima visibilidad y paleta de colores a tu medida.',
    features: [
      'Todo lo del plan Pro',
      PLAN_GESTOR_FEATURES.premium,
      'Personaliza la paleta de colores del catálogo',
      'Prioridad en las búsquedas de negocios',
      'Boost en recomendaciones (×4 visibilidad)',
      'Soporte VIP',
    ],
  },
}

export const PLAN_TIER_ORDER = ['standard', 'pro', 'premium']

export const TRIAL_PLAN = Object.freeze({
  id: 'trial',
  name: 'Prueba',
  recommended: false,
  description: '15 días con las herramientas del plan Pro. Puedes pasar a Básico, Pro o Premium cuando quieras.',
})

export function normalizePlanTier(tier) {
  if (tier === 'pro' || tier === 'premium') return tier
  return 'standard'
}

export function isTrialSeller(profile) {
  return Boolean(profile && typeof profile === 'object' && profile.is_trial)
}

export function getPlanTier(tierId) {
  return PLAN_TIERS[normalizePlanTier(tierId)]
}

export function getSellerPlan(profile) {
  if (isTrialSeller(profile)) return TRIAL_PLAN
  return getPlanTier(profile?.plan_tier)
}

export function isRecommendedPlan(tierId) {
  return Boolean(getPlanTier(tierId).recommended)
}

export function upgradeablePlanTiers(profileOrTier) {
  if (isTrialSeller(profileOrTier)) {
    return PLAN_TIER_ORDER.map((id) => PLAN_TIERS[id])
  }
  const tier =
    typeof profileOrTier === 'string' || profileOrTier == null
      ? profileOrTier
      : profileOrTier.plan_tier
  const index = PLAN_TIER_ORDER.indexOf(normalizePlanTier(tier))
  if (index < 0) return []
  return PLAN_TIER_ORDER.slice(index + 1).map((id) => PLAN_TIERS[id])
}

export function canUpgradePlan(profileOrTier) {
  return upgradeablePlanTiers(profileOrTier).length > 0
}

export function normalizePlanPrices(raw) {
  const source = raw && typeof raw === 'object' ? raw : {}
  const next = {}
  for (const tier of PLAN_TIER_ORDER) {
    const fallback = DEFAULT_PLAN_PRICES[tier]
    const configured = source[tier] && typeof source[tier] === 'object' ? source[tier] : {}
    next[tier] = {}
    for (const period of BILLING_PERIOD_ORDER) {
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

export function normalizeBillingPeriod(billing) {
  if (billing === 'yearly' || billing === 'quarterly') return billing
  return 'monthly'
}

function priceMeta(billing) {
  const period = normalizeBillingPeriod(billing)
  return {
    label: BILLING_UNIT_LABELS[period],
    period,
  }
}

export function getConfiguredPlanPrice(tier, billing, prices = DEFAULT_PLAN_PRICES) {
  const period = normalizeBillingPeriod(billing)
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
  return getPlanPeriodSavings(tier, 'yearly', cupPerUnit, prices)
}

export function getPlanPeriodSavings(tier, billing, cupPerUnit = getCupPerUnit(), prices = DEFAULT_PLAN_PRICES) {
  const period = normalizeBillingPeriod(billing)
  const months = period === 'yearly' ? 12 : period === 'quarterly' ? 3 : 0
  if (!months) return null
  const monthly = getPlanPrice(tier, 'monthly', cupPerUnit, prices)
  const bundle = getPlanPrice(tier, period, cupPerUnit, prices)
  if (monthly.amount == null || bundle.amount == null) return null
  return Math.max(0, monthly.amount * months - bundle.amount)
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

export function featurePlanTier(profileOrTier) {
  if (typeof profileOrTier === 'string' || profileOrTier == null) {
    return normalizePlanTier(profileOrTier)
  }
  const tier = normalizePlanTier(profileOrTier.plan_tier)
  if (tier === 'pro' || tier === 'premium') return tier
  if (profileOrTier.is_trial) return 'pro'
  return 'standard'
}

export function sellerHasStatistics(profile) {
  const tier = featurePlanTier(profile)
  return Boolean(profile?.has_statistics ?? (tier === 'pro' || tier === 'premium'))
}

export function sellerHasRecommendationBoost(profile) {
  const tier = featurePlanTier(profile)
  return Boolean(profile?.has_recommendation_boost ?? (tier === 'pro' || tier === 'premium'))
}

export function sellerHasStoreBanners(profile) {
  const tier = featurePlanTier(profile)
  return Boolean(profile?.has_store_banners ?? (tier === 'pro' || tier === 'premium'))
}

export function sellerHasFullStoreCustomization(profile) {
  return Boolean(
    profile?.has_full_store_customization ?? normalizePlanTier(profile?.plan_tier) === 'premium',
  )
}

export function sellerHasProductDiscounts(profile) {
  if (typeof profile?.has_product_discounts === 'boolean') {
    return profile.has_product_discounts
  }
  const tier = featurePlanTier(profile)
  return tier === 'pro' || tier === 'premium'
}

export {
  STANDARD_GESTOR_LIMIT,
  PRO_GESTOR_LIMIT,
  PLAN_GESTOR_FEATURES,
  canAddGestor,
  formatGestorUsage,
  gestorLimitFeatureLabel,
  maxGestoresForPlan,
} from '../lib/gestorPlanLimits.js'

/** @deprecated Use getPlanPrice(planTier, billing) */
export const PLAN_PRICES = {
  monthly: { amountUsd: DEFAULT_PLAN_PRICES.standard.monthly.amount, label: 'mes', period: 'monthly' },
  yearly: { amountUsd: DEFAULT_PLAN_PRICES.standard.yearly.amount, label: 'año', period: 'yearly' },
}

/** @deprecated Use getPlanTier(planTier).features */
export const PLAN_FEATURES = PLAN_TIERS.standard.features

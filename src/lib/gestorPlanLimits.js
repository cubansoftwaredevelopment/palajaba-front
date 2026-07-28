/** Límites de gestores de venta por plan (Básico / Premium). */

export const STANDARD_GESTOR_LIMIT = 3

export const PLAN_GESTOR_FEATURES = Object.freeze({
  standard: `Hasta ${STANDARD_GESTOR_LIMIT} gestores de venta`,
  premium: 'Gestores de venta ilimitados',
})

function isPremiumTier(tier) {
  return tier === 'premium'
}

/** Tope de gestores. null = ilimitado (Premium). */
export function maxGestoresForPlan(tier) {
  return isPremiumTier(tier) ? null : STANDARD_GESTOR_LIMIT
}

export function canAddGestor(tier, currentCount) {
  const limit = maxGestoresForPlan(tier)
  if (limit == null) return true
  const count = Number(currentCount)
  return Number.isFinite(count) ? count < limit : true
}

export function gestorLimitFeatureLabel(tier) {
  return isPremiumTier(tier) ? PLAN_GESTOR_FEATURES.premium : PLAN_GESTOR_FEATURES.standard
}

export function formatGestorUsage(tier, currentCount) {
  const count = Math.max(0, Number(currentCount) || 0)
  const limit = maxGestoresForPlan(tier)
  if (limit == null) return `${count} gestores`
  return `${count} de ${limit} gestores`
}

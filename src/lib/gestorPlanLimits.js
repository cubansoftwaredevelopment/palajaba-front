/** Límites de gestores de venta por plan (Básico 10 / Pro 25 / Premium ilimitado). */

export const STANDARD_GESTOR_LIMIT = 10
export const PRO_GESTOR_LIMIT = 25

export const PLAN_GESTOR_FEATURES = Object.freeze({
  standard: `Hasta ${STANDARD_GESTOR_LIMIT} gestores de venta`,
  pro: `Hasta ${PRO_GESTOR_LIMIT} gestores de venta`,
  premium: 'Gestores de venta ilimitados',
})

function normalizeTier(tier) {
  if (tier === 'pro' || tier === 'premium') return tier
  return 'standard'
}

/** Tope de gestores. null = ilimitado (Premium). */
export function maxGestoresForPlan(tier) {
  const normalized = normalizeTier(tier)
  if (normalized === 'premium') return null
  if (normalized === 'pro') return PRO_GESTOR_LIMIT
  return STANDARD_GESTOR_LIMIT
}

export function canAddGestor(tier, currentCount) {
  const limit = maxGestoresForPlan(tier)
  if (limit == null) return true
  const count = Number(currentCount)
  return Number.isFinite(count) ? count < limit : true
}

export function gestorLimitFeatureLabel(tier) {
  return PLAN_GESTOR_FEATURES[normalizeTier(tier)]
}

export function formatGestorUsage(tier, currentCount) {
  const count = Math.max(0, Number(currentCount) || 0)
  const limit = maxGestoresForPlan(tier)
  if (limit == null) return `${count} gestores`
  return `${count} de ${limit} gestores`
}

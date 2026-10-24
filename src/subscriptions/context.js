import { maxGestoresForPlan } from '../lib/gestorPlanLimits.js'
import { isGestorActive } from '../lib/sellerGestores.js'

export function listActiveGestores(gestores = []) {
  return (gestores ?? []).filter(isGestorActive)
}

export function needsGestorKeepPicker(planTier, gestores = []) {
  const limit = maxGestoresForPlan(planTier)
  if (limit == null) return false
  return listActiveGestores(gestores).length > limit
}

export function toggleKeepGestorId(selectedIds, gestorId, limit) {
  const current = (selectedIds ?? []).map(String)
  const id = String(gestorId ?? '').trim()
  if (!id) return current
  if (current.includes(id)) return current.filter((item) => item !== id)
  if (limit != null && current.length >= limit) return current
  return [...current, id]
}

export function isKeepSelectionInvalid({
  needsPick,
  loading = false,
  loadError = '',
  selectedIds = [],
  limit,
} = {}) {
  if (!needsPick) return false
  return Boolean(loading || loadError || (limit != null && selectedIds.length > limit))
}

export function buildReplaceSubscriptionBody({
  planTier,
  billingPeriod,
  keepGestorIds = [],
  needsPick = false,
} = {}) {
  return {
    plan_tier: planTier,
    billing_period: billingPeriod,
    keep_gestor_ids: needsPick ? [...keepGestorIds] : [],
  }
}

/**
 * Simula el reemplazo de plan en admin: si el tope no alcanza, deja activos solo keepGestorIds.
 */
export function simulateAdminPlanReplace({
  planTier,
  gestores = [],
  keepGestorIds = [],
} = {}) {
  const needsPick = needsGestorKeepPicker(planTier, gestores)
  const active = listActiveGestores(gestores)
  const limit = maxGestoresForPlan(planTier)
  const keepSet = new Set((keepGestorIds ?? []).map(String))
  const next = gestores.map((gestor) => {
    if (!isGestorActive(gestor)) return { ...gestor, is_active: false }
    if (!needsPick) return { ...gestor, is_active: true }
    return { ...gestor, is_active: keepSet.has(String(gestor.id)) }
  })
  const activeAfter = next.filter(isGestorActive)
  return {
    needsPick,
    limit,
    activeBefore: active.length,
    activeAfter: activeAfter.length,
    deactivatedIds: active
      .filter((gestor) => needsPick && !keepSet.has(String(gestor.id)))
      .map((gestor) => String(gestor.id)),
    body: buildReplaceSubscriptionBody({
      planTier,
      billingPeriod: 'monthly',
      keepGestorIds,
      needsPick,
    }),
    invalid: isKeepSelectionInvalid({
      needsPick,
      selectedIds: keepGestorIds,
      limit,
    }),
  }
}

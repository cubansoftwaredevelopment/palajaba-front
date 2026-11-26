import { maxGestoresForPlan } from '../../gestor/utils/gestorPlanLimits.js'

const PRO_RECOMMENDATION_MULTIPLIER = 2
const PREMIUM_RECOMMENDATION_MULTIPLIER = 4

export const PLAN_PLUGINS = [
  { id: 'whatsapp_orders', label: 'Pedidos a WhatsApp', quantity: false, defaultUsd: 1 },
  { id: 'gestores', label: 'Gestores', quantity: true, defaultUsd: 1 },
  { id: 'catalog_palette', label: 'Paleta de colores del catálogo', quantity: false, defaultUsd: 2 },
  { id: 'recommendation_boost', label: 'Boost de recomendación', quantity: true, defaultUsd: 1 },
  { id: 'mensajeros', label: 'Mensajeros', quantity: true, defaultUsd: 1 },
  { id: 'customers', label: 'Clientes', quantity: false, defaultUsd: 1 },
  { id: 'customer_notices', label: 'Avisos a clientes', quantity: false, defaultUsd: 1 },
  { id: 'manual_orders', label: 'Pedidos manuales', quantity: false, defaultUsd: 1 },
  { id: 'statistics', label: 'Estadísticas', quantity: false, defaultUsd: 2 },
  { id: 'discounts', label: 'Descuentos', quantity: true, defaultUsd: 1 },
  { id: 'banners', label: 'Banners', quantity: true, defaultUsd: 1 },
]

export const PLAN_PLUGIN_PERIOD_FACTOR = { monthly: 1, quarterly: 3, yearly: 12 }

export function defaultPluginPrices() {
  return Object.fromEntries(PLAN_PLUGINS.map((plugin) => [plugin.id, plugin.defaultUsd]))
}

export function pluginUnitUsd(prices, pluginId) {
  const amount = Number(prices?.[pluginId])
  if (Number.isFinite(amount) && amount >= 0) return amount
  return defaultPluginPrices()[pluginId] || 0
}

const UNLIMITED_ON_PAID_PLAN = ['mensajeros', 'discounts', 'banners']

function featureTier(profile) {
  if (!profile || profile.plan_tier === 'custom') return profile?.plan_tier || 'standard'
  if (profile.plan_tier === 'pro' || profile.plan_tier === 'premium') return profile.plan_tier
  if (profile.is_trial) return 'pro'
  return 'standard'
}

/** Contadores que el plan fijo ya incluye sin tope. Premium: gestores. Pro y Premium: mensajeros, descuentos y banners. */
export function includedUnlimitedPluginIds(profile) {
  if (!profile || profile.plan_tier === 'custom') return []
  const tier = featureTier(profile)
  const ids = []
  if (tier === 'premium') ids.push('gestores')
  if (tier === 'pro' || tier === 'premium') ids.push(...UNLIMITED_ON_PAID_PLAN)
  return ids
}

export function unlimitedPluginLabel(pluginLabel, planName) {
  const plan = planName ? ` · Plan ${planName}` : ''
  return `${pluginLabel} × ilimitado${plan}`
}

export function liveAddonQuantity(source, pluginId) {
  const expires = source?.plugin_addons_expires_at ? new Date(source.plugin_addons_expires_at) : null
  const live = !expires || Number.isNaN(expires.getTime()) || expires > new Date()
  if (!live) return 0
  const qty = Number(source?.plugin_addons?.[pluginId]) || 0
  return qty > 0 ? qty : 0
}

function planBaseQuantity(profile, pluginId) {
  const tier = featureTier(profile)
  if (pluginId === 'gestores') {
    const limit = maxGestoresForPlan(tier)
    return limit == null ? 0 : limit
  }
  if (pluginId === 'recommendation_boost') {
    if (tier === 'premium') return PREMIUM_RECOMMENDATION_MULTIPLIER
    if (tier === 'pro') return PRO_RECOMMENDATION_MULTIPLIER
    return liveAddonQuantity(profile, pluginId) > 0 ? 1 : 0
  }
  return 0
}

/** Mínimo visible: cantidad del plan + cantidad comprada del plugin. */
export function fixedCounterTotal(profile, pluginId) {
  if (!profile || profile.plan_tier === 'custom') return 0
  if (includedUnlimitedPluginIds(profile).includes(pluginId)) return 0
  return planBaseQuantity(profile, pluginId) + liveAddonQuantity(profile, pluginId)
}

export function fixedCounterMap(profile) {
  const totals = {}
  for (const plugin of PLAN_PLUGINS) {
    if (!plugin.quantity) continue
    const total = fixedCounterTotal(profile, plugin.id)
    if (total > 0) totals[plugin.id] = total
  }
  return totals
}

export function fixedCounterLabel(pluginLabel, total, planName) {
  const plan = planName ? ` · Plan ${planName}` : ''
  return `${pluginLabel} × ${total}${plan}`
}

export function fixedCounterLabels(profile, planName) {
  const totals = fixedCounterMap(profile)
  return PLAN_PLUGINS.flatMap((plugin) => {
    const total = totals[plugin.id]
    if (!total) return []
    return [fixedCounterLabel(plugin.label, total, planName)]
  })
}

export function pluginSelectionLabels(selection = {}) {
  const known = new Set(PLAN_PLUGINS.map((plugin) => plugin.id))
  const catalog = [
    ...PLAN_PLUGINS,
    ...Object.keys(selection)
      .filter((id) => id !== 'automatic_orders' && !known.has(id) && Number(selection[id]) > 0)
      .map((id) => ({ id, label: id, quantity: true })),
  ]
  return catalog.flatMap((plugin) => {
    const count = Number(selection[plugin.id] || 0)
    if (count <= 0) return []
    const label = plugin.quantity ? `${plugin.label} × ${count}` : plugin.label
    return [label]
  })
}

export function pluginPeriodUsd(prices, pluginId, period, quantity = 1) {
  const factor = PLAN_PLUGIN_PERIOD_FACTOR[period] || 1
  return pluginUnitUsd(prices, pluginId) * Math.max(0, quantity) * factor
}

export const PLAN_PLUGIN_LOCKED_MESSAGE = 'Esta función no está en tu plan.'
export const MENSAJEROS_QUOTA_MESSAGE = 'Agotado el número de mensajeros de su plan.'
export const DISCOUNTS_QUOTA_MESSAGE = 'Agotado el número de descuento a productos.'

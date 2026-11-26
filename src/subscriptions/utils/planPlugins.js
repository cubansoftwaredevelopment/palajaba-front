export const PLAN_PLUGINS = [
  { id: 'whatsapp_orders', label: 'Pedidos a WhatsApp', quantity: false, defaultUsd: 1 },
  { id: 'gestores', label: 'Gestores', quantity: true, defaultUsd: 1 },
  { id: 'catalog_palette', label: 'Paleta de colores del catálogo', quantity: false, defaultUsd: 2 },
  { id: 'recommendation_boost', label: 'Boost de recomendación', quantity: true, defaultUsd: 1 },
  { id: 'mensajeros', label: 'Mensajeros', quantity: true, defaultUsd: 1 },
  { id: 'customers', label: 'Clientes', quantity: false, defaultUsd: 1 },
  { id: 'customer_notices', label: 'Avisos a clientes', quantity: false, defaultUsd: 1 },
  { id: 'automatic_orders', label: 'Pedidos automáticos', quantity: false, defaultUsd: 1 },
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

export function pluginPeriodUsd(prices, pluginId, period, quantity = 1) {
  const factor = PLAN_PLUGIN_PERIOD_FACTOR[period] || 1
  return pluginUnitUsd(prices, pluginId) * Math.max(0, quantity) * factor
}

export const PLAN_PLUGIN_LOCKED_MESSAGE = 'Esta función no está en tu plan.'

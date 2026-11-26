import { PLAN_PLUGIN_LOCKED_MESSAGE } from './planPlugins.js'
import { PROFILE_PANEL_IDS } from '../../seller/utils/sellerProfileHub.js'

export function pluginCap(profile, key) {
  const access = profile?.plugin_access
  if (!access || !(key in access)) return null
  const value = access[key]
  return value == null ? null : Number(value)
}

export function pluginLocked(profile, key) {
  const cap = pluginCap(profile, key)
  return cap != null && cap <= 0
}

export function openPlanPanel(navigate, message = PLAN_PLUGIN_LOCKED_MESSAGE) {
  navigate('/tienda/perfil', {
    state: { panel: PROFILE_PANEL_IDS.plan, planWarning: message },
  })
}

export function guardPlugin(profile, key, navigate) {
  if (!pluginLocked(profile, key)) return false
  openPlanPanel(navigate)
  return true
}

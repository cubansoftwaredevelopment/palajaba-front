import { useMemo } from 'react'
import AdminModal from './AdminModal.jsx'
import { adminFocusRing, adminSubtle } from './adminStyles.js'
import { BILLING_LABELS } from '../utils/admin.js'
import { formatPlanAmount, getSellerPlan } from '../../subscriptions/utils/constants.js'
import { fixedCounterLabel, fixedCounterMap, includedUnlimitedPluginIds, PLAN_PLUGINS, pluginPeriodUsd, unlimitedPluginLabel } from '../../subscriptions/utils/planPlugins.js'
import AdminButton from './AdminButton.jsx'

function moneyUsd(value) {
  return `${Number(value || 0).toLocaleString('es', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD`
}

function cupFromUsd(usd, rate) {
  if (!(Number(rate) > 0)) return null
  return Math.round(Number(usd || 0) * Number(rate))
}

function effectivePlanPlugins(item) {
  const selected = { ...(item?.plan_plugins || {}) }
  const expires = item?.plugin_addons_expires_at ? new Date(item.plugin_addons_expires_at) : null
  const addonsLive = !expires || Number.isNaN(expires.getTime()) || expires > new Date()
  if (!addonsLive) return selected
  for (const [key, value] of Object.entries(item?.plugin_addons || {})) {
    const qty = Number(value) || 0
    if (qty > 0) selected[key] = (Number(selected[key]) || 0) + qty
  }
  return selected
}

function liveAddonPlugins(source) {
  const expires = source?.plugin_addons_expires_at ? new Date(source.plugin_addons_expires_at) : null
  const addonsLive = !expires || Number.isNaN(expires.getTime()) || expires > new Date()
  if (!addonsLive) return {}
  const selected = {}
  for (const [key, value] of Object.entries(source?.plugin_addons || {})) {
    const qty = Number(value) || 0
    if (qty > 0) selected[key] = qty
  }
  return selected
}

export function fixedPlanAddonItem(item) {
  const selected = liveAddonPlugins(item)
  const pending = item?.plan_upgrade
  if (pending?.payment_method === 'cup' && pending?.status === 'submitted') {
    for (const [key, value] of Object.entries(pending.plan_plugins || {})) {
      const qty = Number(value) || 0
      if (qty > 0) selected[key] = (Number(selected[key]) || 0) + qty
    }
  }
  return {
    store_name: item?.store_name,
    billing_period: pending?.billing_period || item?.billing_period,
    plan_plugins: selected,
  }
}

export function fixedPlanFeatureItem(item) {
  const addon = fixedPlanAddonItem(item)
  const unlimited = includedUnlimitedPluginIds(item)
  const fixed = fixedCounterMap(item)
  const skip = new Set([...unlimited, ...Object.keys(fixed)])
  const selected = {}
  for (const [key, value] of Object.entries(addon.plan_plugins || {})) {
    if (!skip.has(key)) selected[key] = value
  }
  return {
    ...addon,
    plan_plugins: selected,
    unlimited_plugins: unlimited,
    fixed_counters: fixed,
    plan_name: getSellerPlan(item)?.name || '',
  }
}

export function customPlanFeatureLines(item, pluginPrices) {
  const selected = effectivePlanPlugins(item)
  const unlimited = new Set(item?.unlimited_plugins || [])
  const known = new Set(PLAN_PLUGINS.map((plugin) => plugin.id))
  const catalog = [
    ...PLAN_PLUGINS,
    ...Object.keys(selected)
      .filter((id) => id !== 'automatic_orders' && !known.has(id) && !unlimited.has(id) && Number(selected[id]) > 0)
      .map((id) => ({ id, label: id, quantity: true })),
  ]
  return catalog
    .map((plugin) => {
      if (unlimited.has(plugin.id)) {
        return {
          id: plugin.id,
          label: unlimitedPluginLabel(plugin.label, item?.plan_name),
          usd: 0,
          included: true,
        }
      }
      const floor = Number(item?.fixed_counters?.[plugin.id] || 0)
      const extra = Number(selected[plugin.id] || 0)
      if (floor > 0) {
        return {
          id: plugin.id,
          label: fixedCounterLabel(plugin.label, floor + extra, item?.plan_name),
          usd: extra > 0 ? pluginPeriodUsd(pluginPrices, plugin.id, item?.billing_period, extra) : 0,
          included: extra <= 0,
        }
      }
      const count = extra
      if (count <= 0) return null
      return {
        id: plugin.id,
        label: plugin.quantity ? `${plugin.label} × ${count}` : plugin.label,
        usd: pluginPeriodUsd(pluginPrices, plugin.id, item?.billing_period, count),
        included: false,
      }
    })
    .filter(Boolean)
}

export function CustomPlanFeaturesButton({ count, onClick }) {
  const label = `${count} ${count === 1 ? 'función' : 'funciones'}`
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border border-brand-green/30 bg-brand-green/10 px-2.5 py-1 text-xs font-semibold text-emerald-100 ${adminFocusRing}`}
    >
      {label}
    </button>
  )
}

export function CustomPlanFeaturesModal({ item, pluginPrices, cupPerUsd, onClose, onApprove, onReject, busy = false }) {
  const lines = useMemo(
    () => customPlanFeatureLines(item, pluginPrices),
    [item, pluginPrices],
  )
  const billable = lines.filter((line) => !line.included)
  const totalUsd = billable.reduce((sum, line) => sum + line.usd, 0)
  const period = BILLING_LABELS[item?.billing_period] || item?.billing_period || ''

  return (
    <AdminModal
      title={item?.store_name || 'Plan personalizado'}
      subtitle={`${lines.length} ${lines.length === 1 ? 'función' : 'funciones'}${period ? ` · ${period}` : ''}`}
      onClose={onClose}
      panelClassName="max-w-lg"
    >
      {lines.length === 0 ? (
        <p className={`text-sm ${adminSubtle}`}>Este plan no tiene funciones.</p>
      ) : (
        <ul className="divide-y divide-zinc-800">
          {lines.map((line) => {
            const cup = cupFromUsd(line.usd, cupPerUsd)
            return (
              <li key={line.id} className="flex items-start justify-between gap-4 py-3">
                <p className="min-w-0 text-sm font-medium text-zinc-100">{line.label}</p>
                {line.included ? (
                  <p className="shrink-0 text-xs font-semibold text-zinc-400">Incluido</p>
                ) : (
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-semibold tabular-nums text-zinc-50">{moneyUsd(line.usd)}</p>
                    <p className="text-xs font-semibold tabular-nums text-zinc-400">
                      {cup == null ? '—' : formatPlanAmount(cup, 'CUP')}
                    </p>
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}
      {billable.length ? (
      <div className="mt-2 flex items-start justify-between gap-4 border-t border-zinc-700 pt-3">
        <p className="text-sm font-semibold text-zinc-50">Total</p>
        <div className="text-right">
          <p className="text-sm font-semibold tabular-nums text-zinc-50">{moneyUsd(totalUsd)}</p>
          <p className="text-xs font-semibold tabular-nums text-zinc-400">
            {cupFromUsd(totalUsd, cupPerUsd) == null ? '—' : formatPlanAmount(cupFromUsd(totalUsd, cupPerUsd), 'CUP')}
          </p>
        </div>
      </div>
      ) : null}
      {onApprove || onReject ? (
        <div className="mt-4 grid grid-cols-2 gap-2">
          {onReject ? (
            <AdminButton type="button" variant="danger" size="sm" className="!w-full" disabled={busy} onClick={onReject}>
              No aprobar
            </AdminButton>
          ) : null}
          {onApprove ? (
            <AdminButton type="button" size="sm" className="!w-full" disabled={busy} onClick={onApprove}>
              Aprobar
            </AdminButton>
          ) : null}
        </div>
      ) : null}
    </AdminModal>
  )
}

import { adminFocusRing } from './adminStyles.js'
import { fixedCounterLabel, fixedCounterMap, PLAN_PLUGINS, pluginSelectionLabels, unlimitedPluginLabel } from '../../subscriptions/utils/planPlugins.js'

const viewButton = `rounded-full border border-brand-green/30 bg-brand-green/10 px-2.5 py-1 text-xs font-semibold text-emerald-100 ${adminFocusRing}`

export default function StorePlanUpgradeCell({ upgrade, onView, store, planName = '', unlimitedIds = [] }) {
  const fixedTotals = fixedCounterMap(store)
  const unlimitedLabels = PLAN_PLUGINS
    .filter((plugin) => unlimitedIds.includes(plugin.id))
    .map((plugin) => unlimitedPluginLabel(plugin.label, planName))
  const fixedLabels = PLAN_PLUGINS
    .filter((plugin) => fixedTotals[plugin.id])
    .map((plugin) => fixedCounterLabel(plugin.label, fixedTotals[plugin.id], planName))

  if (!upgrade?.plan_plugins || !Object.keys(upgrade.plan_plugins).length) {
    return <span className="text-zinc-500">—</span>
  }

  if (upgrade.payment_method === 'qvapay' && upgrade.status === 'paid') {
    const skip = new Set([...unlimitedIds, ...Object.keys(fixedTotals)])
    const purchased = Object.fromEntries(
      Object.entries(upgrade.plan_plugins).filter(([id]) => !skip.has(id)),
    )
    const labels = [...unlimitedLabels, ...fixedLabels, ...pluginSelectionLabels(purchased)]
    return (
      <div>
        <p className="text-xs font-semibold text-emerald-200">Pagado con QvaPay</p>
        {labels.length ? (
          <ul className="mt-1 space-y-0.5 text-xs text-zinc-300">
            {labels.map((label) => <li key={label}>{label}</li>)}
          </ul>
        ) : null}
      </div>
    )
  }

  if (upgrade.payment_method !== 'cup' || upgrade.status !== 'submitted') {
    return <span className="text-zinc-500">—</span>
  }

  return (
    <button type="button" className={viewButton} onClick={onView}>
      Ver mejoras
    </button>
  )
}

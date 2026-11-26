import { useState } from 'react'
import { canUpgradePlan, getSellerPlan } from '../../subscriptions/utils/constants.js'
import { fixedCounterLabels, fixedCounterMap, includedUnlimitedPluginIds, PLAN_PLUGINS, pluginSelectionLabels, unlimitedPluginLabel } from '../../subscriptions/utils/planPlugins.js'
import { parseApiDateTime } from '../../shared/utils/dates.js'
import { getProfileHubSubtitle } from '../utils/sellerProfileHub.js'
import { sellerFocusRing } from './sellerStyles.js'
import PhotoLightbox from '../../shared/componentes/PhotoLightbox.jsx'
import SellerProfileAvatarUpload from './SellerProfileAvatarUpload.jsx'

function currentPlanLabels(profile) {
  const merged = {}
  for (const [key, value] of Object.entries(profile?.plan_plugins || {})) {
    const qty = Number(value) || 0
    if (qty > 0) merged[key] = qty
  }
  const expires = profile?.plugin_addons_expires_at ? new Date(profile.plugin_addons_expires_at) : null
  const addonsLive = !expires || (!Number.isNaN(expires.getTime()) && expires > new Date())
  if (addonsLive) {
    for (const [key, value] of Object.entries(profile?.plugin_addons || {})) {
      const qty = Number(value) || 0
      if (qty > 0) merged[key] = (merged[key] || 0) + qty
    }
  }
  return pluginSelectionLabels(merged)
}

function addonLabels(profile, skipIds = []) {
  const expires = profile?.plugin_addons_expires_at ? new Date(profile.plugin_addons_expires_at) : null
  const addonsLive = !expires || (!Number.isNaN(expires.getTime()) && expires > new Date())
  if (!addonsLive) return []
  const skip = new Set(skipIds)
  const selected = {}
  for (const [key, value] of Object.entries(profile?.plugin_addons || {})) {
    if (skip.has(key)) continue
    const qty = Number(value) || 0
    if (qty > 0) selected[key] = qty
  }
  return pluginSelectionLabels(selected)
}

function FeatureList({ title, labels, waiting = false }) {
  return (
    <div className="mt-2">
      <p className={`text-[0.65rem] font-semibold uppercase tracking-wide ${waiting ? 'text-amber-800' : 'text-brand-green/80'}`}>
        {title}
      </p>
      <ul className="mt-1 space-y-0.5 text-xs text-brand-carmelita/90">
        {labels.map((label) => <li key={label}>{label}</li>)}
      </ul>
    </div>
  )
}

function EditPencilIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      aria-hidden
    >
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
    </svg>
  )
}

export default function SellerProfileHeroCard({
  profile,
  photoUrl,
  photoUploading,
  onPhotoClick,
  onEditClick,
  onUpgradeClick,
}) {
  const subtitle = getProfileHubSubtitle(profile)
  const endsAt = parseApiDateTime(profile?.subscription_ends_at)
  const endsLabel = endsAt
    ? `Vence el ${endsAt.toLocaleDateString('es', { day: 'numeric', month: 'long', year: 'numeric' })}`
    : ''
  const handleEdit = onEditClick ?? onPhotoClick
  const [photoOpen, setPhotoOpen] = useState(false)
  const showUpgrade = canUpgradePlan(profile) && typeof onUpgradeClick === 'function'
  const planName = getSellerPlan(profile)?.name || 'Básico'
  const unlimitedIds = profile?.plan_tier === 'custom' ? [] : includedUnlimitedPluginIds(profile)
  const fixedTotals = profile?.plan_tier === 'custom' ? {} : fixedCounterMap(profile)
  const unlimitedLabels = PLAN_PLUGINS
    .filter((plugin) => unlimitedIds.includes(plugin.id))
    .map((plugin) => unlimitedPluginLabel(plugin.label, planName))
  const pluginLabels = profile?.plan_tier === 'custom'
    ? currentPlanLabels(profile)
    : [...unlimitedLabels, ...fixedCounterLabels(profile, planName), ...addonLabels(profile, [...unlimitedIds, ...Object.keys(fixedTotals)])]
  const pendingSelection = { ...(profile?.pending_plan_upgrade?.plan_plugins || {}) }
  for (const id of unlimitedIds) delete pendingSelection[id]
  for (const id of Object.keys(fixedTotals)) {
    const extra = Number(pendingSelection[id]) || 0
    if (extra > 0) pendingSelection[id] = fixedTotals[id] + extra
  }
  const pendingUpgrade = profile?.pending_plan_upgrade?.payment_method === 'cup'
    ? pluginSelectionLabels(pendingSelection).map((label) => {
      const match = PLAN_PLUGINS.find((plugin) => label === plugin.label || label.startsWith(`${plugin.label} ×`))
      if (!match || !fixedTotals[match.id]) return label
      return `${label} · Plan ${planName}`
    })
    : []

  return (
    <div className="relative z-10 rounded-2xl border border-brand-green/10 bg-brand-white p-4 shadow-[0_8px_28px_rgba(89,128,44,0.12)] sm:p-5">
      <div className="flex items-center gap-3.5">
        <SellerProfileAvatarUpload
          photoUrl={photoUrl}
          uploading={photoUploading}
          onSelectClick={onPhotoClick}
          onViewClick={photoUrl ? () => setPhotoOpen(true) : undefined}
          size="account"
          storeName={profile.store_name}
        />

        <div className="min-w-0 flex-1">
          <h3 className="truncate font-display text-lg font-bold text-brand-green sm:text-xl">
            {profile.store_name}
          </h3>
          <p className="mt-0.5 truncate text-xs text-brand-carmelita/80 sm:text-sm">{subtitle}</p>
          {endsLabel ? (
            <p className="mt-1.5 text-[0.7rem] font-semibold text-brand-green/85">{endsLabel}</p>
          ) : null}
          <p className="mt-2 text-[0.65rem] font-semibold uppercase tracking-wide text-brand-green/80">
            Plan {planName}
          </p>
          {pluginLabels.length ? (
            <FeatureList title="Plugins" labels={pluginLabels} />
          ) : null}
          {pendingUpgrade.length ? (
            <FeatureList title="Mejoras por confirmar" labels={pendingUpgrade} waiting />
          ) : null}
          {showUpgrade ? (
            <button
              type="button"
              onClick={onUpgradeClick}
              className={`mt-2 inline-flex min-h-8 items-center rounded-full bg-brand-green px-3 py-1 text-[0.7rem] font-semibold text-brand-white touch-manipulation active:scale-[0.98] ${sellerFocusRing}`}
            >
              Mejorar plan
            </button>
          ) : null}
        </div>

        <button
          type="button"
          onClick={handleEdit}
          disabled={photoUploading}
          aria-label="Editar foto de perfil"
          className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-brand-green/15 bg-brand-green/[0.04] text-brand-green touch-manipulation active:bg-brand-yellow/15 disabled:opacity-60 ${sellerFocusRing}`}
        >
          <EditPencilIcon />
        </button>
      </div>

      {photoOpen && photoUrl ? (
        <PhotoLightbox
          images={[{ id: 'profile', image_url: photoUrl }]}
          index={0}
          onIndex={() => {}}
          onClose={() => setPhotoOpen(false)}
          label="Foto de perfil"
        />
      ) : null}
    </div>
  )
}

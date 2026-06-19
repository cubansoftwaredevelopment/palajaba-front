import { BILLING_LABELS, PLAN_TIER_LABELS, STATUS_LABELS } from '../../constants/admin'
import { normalizePlanTier } from '../../constants/plan'
import {
  adminBadgeApproved,
  adminBadgeExpired,
  adminBadgePending,
  adminBadgeRejected,
  adminFocusRing,
  adminMuted,
  adminSubtle,
} from './adminStyles'

const STATUS_BADGES = {
  pending: adminBadgePending,
  approved: adminBadgeApproved,
  rejected: adminBadgeRejected,
  expired: adminBadgeExpired,
}

export default function RegistrationRow({ item, onViewDetails }) {
  const badgeClass = STATUS_BADGES[item.status] ?? adminBadgePending

  return (
    <article className="group flex items-center gap-3 rounded-xl border border-brand-green/8 bg-zinc-900/40 px-4 py-3 transition-all hover:border-brand-green/20 hover:bg-zinc-900/65">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="truncate font-medium text-zinc-50">{item.store_name}</h2>
          <span className={`shrink-0 ${badgeClass}`}>{STATUS_LABELS[item.status]}</span>
        </div>
        <div className={`mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs ${adminSubtle}`}>
          <span className="font-mono text-zinc-400">{item.transfer_id}</span>
          <span className={adminMuted}>·</span>
          <span>{PLAN_TIER_LABELS[normalizePlanTier(item.plan_tier)]}</span>
          <span className={adminMuted}>·</span>
          <span>{BILLING_LABELS[item.billing_period]}</span>
          {(item.status === 'approved' || item.status === 'expired') && (
            <>
              <span className={adminMuted}>·</span>
              <span
                className={
                  item.published_product_count > 0 ? 'text-emerald-300/90' : 'text-zinc-500'
                }
                title="Productos publicados en marketplace (disponibles, no solo vista)"
              >
                {item.published_product_count} publicado
                {item.published_product_count === 1 ? '' : 's'}
                {item.total_product_count > item.published_product_count
                  ? ` / ${item.total_product_count} total`
                  : ''}
              </span>
            </>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={() => onViewDetails(item)}
        className={`shrink-0 rounded-xl border border-zinc-700/80 bg-zinc-800/80 px-3 py-2 text-xs font-medium text-zinc-200 transition-colors hover:border-brand-green/30 hover:bg-brand-green/10 hover:text-brand-white ${adminFocusRing}`}
      >
        Ver detalles
      </button>
    </article>
  )
}

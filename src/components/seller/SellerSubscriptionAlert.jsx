import RenewPlanButton from './RenewPlanButton'
import { formatDateTime } from '../../lib/dates'
import {
  formatUrgentSubscriptionRemaining,
  shouldShowSubscriptionUrgentBanner,
} from '../../lib/subscription'

export default function SellerSubscriptionAlert({ profile }) {
  if (!shouldShowSubscriptionUrgentBanner(profile)) {
    return null
  }

  const timeLabel = formatUrgentSubscriptionRemaining(profile)
  const endsAt = profile.subscription_ends_at

  return (
    <div
      className="flex flex-col gap-2.5 rounded-xl border border-brand-carmelita/18 bg-brand-yellow/12 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:py-3"
      role="alert"
    >
      <div className="flex min-w-0 items-start gap-2.5">
        <div
          className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-carmelita/10 text-brand-carmelita"
          aria-hidden="true"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6v6l4 2" />
          </svg>
        </div>

        <div className="min-w-0">
          <p className="text-sm font-semibold leading-snug text-brand-green">
            Tu plan vence en {timeLabel}
          </p>
          <p className="mt-0.5 text-xs leading-relaxed text-brand-carmelita/85">
            Renueva para mantener tu tienda visible
            {endsAt ? (
              <>
                {' '}
                · {formatDateTime(endsAt)}
              </>
            ) : null}
            .
          </p>
        </div>
      </div>

      <RenewPlanButton className="shrink-0 sm:!w-auto sm:min-w-[8.5rem]" size="compact" />
    </div>
  )
}

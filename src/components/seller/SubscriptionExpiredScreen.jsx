import AuthShell from '../auth/AuthShell'
import RenewPlanButton from './RenewPlanButton'
import { sellerAlertError } from './sellerStyles'
import { formatDateTime } from '../../lib/dates'

export default function SubscriptionExpiredScreen({
  storeName,
  subscriptionEndsAt,
  renewalContactPhone,
  onBack,
}) {
  return (
    <AuthShell centered hideHeader>
      <section
        className="animate-fade-in mx-auto w-full max-w-lg text-center"
        aria-labelledby="subscription-expired-title"
      >
        <div className="rounded-3xl border-2 border-brand-carmelita/20 bg-brand-carmelita/8 px-6 py-10 shadow-[0_20px_60px_rgba(123,76,56,0.12)] sm:px-10 sm:py-12">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-yellow/30 text-brand-carmelita sm:h-20 sm:w-20">
            <svg
              width="34"
              height="34"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v4M12 16h.01" />
            </svg>
          </div>

          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-brand-carmelita sm:text-xs">
            Suscripción vencida
          </p>
          <h1
            id="subscription-expired-title"
            className="mt-2 font-display text-2xl font-bold leading-snug text-brand-green sm:text-3xl"
          >
            Tu tienda ya no está activa
          </h1>

          {storeName && (
            <p className="mt-3 text-sm font-semibold text-brand-carmelita sm:text-base">
              {storeName}
            </p>
          )}

          <p className={`mt-4 ${sellerAlertError} text-left sm:text-center`} role="alert">
            Tu suscripción ha expirado y tu cuenta quedó deshabilitada en la vista pública.
            Renueva tu plan para volver a mostrar tu tienda a los clientes.
          </p>

          {subscriptionEndsAt && (
            <p className="mt-3 text-xs text-brand-carmelita/85 sm:text-sm">
              Venció el {formatDateTime(subscriptionEndsAt)}
            </p>
          )}

          <div className="mt-6 flex flex-col gap-3">
            <RenewPlanButton
              className="w-full"
              storeName={storeName}
              renewalPhone={renewalContactPhone}
            />
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="rounded-full px-4 py-2.5 text-sm font-semibold text-brand-carmelita/85 touch-manipulation active:text-brand-carmelita"
              >
                Volver al inicio de sesión
              </button>
            )}
          </div>
        </div>
      </section>
    </AuthShell>
  )
}

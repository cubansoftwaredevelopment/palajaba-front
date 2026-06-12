import AuthShell from '../auth/AuthShell'
import { DEAD_MASCOT } from '../../constants/branding'
import RenewPlanButton from './RenewPlanButton'

export default function SubscriptionExpiredScreen({
  storeName,
  renewalContactPhone,
  onBack,
}) {
  return (
    <AuthShell centered hideHeader>
      <section
        className="animate-fade-in mx-auto w-full max-w-md text-center"
        aria-labelledby="subscription-expired-title"
      >
        <div className="rounded-2xl border border-brand-carmelita/15 bg-brand-white px-5 py-7 shadow-[0_12px_40px_rgba(123,76,56,0.1)] sm:px-6 sm:py-8">
          <img
            src={DEAD_MASCOT.src}
            alt=""
            width={288}
            height={288}
            className="mx-auto h-56 w-56 object-contain sm:h-64 sm:w-64 lg:h-72 lg:w-72"
            decoding="async"
          />

          <p className="mt-4 text-xs font-semibold uppercase tracking-[0.12em] text-brand-carmelita">
            Suscripción vencida
          </p>
          <h1
            id="subscription-expired-title"
            className="mt-1.5 font-display text-lg font-bold leading-snug text-brand-green sm:text-xl"
          >
            Tu tienda ya no está activa
          </h1>

          <div className="mt-5 flex flex-col gap-2.5">
            <RenewPlanButton
              className="w-full"
              storeName={storeName}
              renewalPhone={renewalContactPhone}
            />
            {onBack ? (
              <button
                type="button"
                onClick={onBack}
                className="rounded-full px-4 py-2 text-sm font-semibold text-brand-carmelita/85 touch-manipulation active:text-brand-carmelita"
              >
                Volver al inicio de sesión
              </button>
            ) : null}
          </div>
        </div>
      </section>
    </AuthShell>
  )
}

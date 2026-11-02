import { useEffect, useRef, useState } from 'react'

import { BILLING_LABELS } from '../../constants/admin.js'
import {
  BILLING_PERIOD_ORDER,
  canUpgradePlan,
  formatPlanPriceLabel,
  getSellerPlan,
  normalizeBillingPeriod,
  PLAN_TIERS,
  PLAN_TIER_ORDER,
} from '../constants.js'
import { usePlanPricing } from '../../lib/usePlanPricing'
import UpgradeToPremiumButton from './UpgradeToPremiumButton'
import { sellerBtnPrimary, sellerFocusRing, sellerHint } from '../../components/seller/sellerStyles.js'
import { getSellerToken } from '../../lib/sellerAuth.js'
import { createSubscriptionQvaPayCheckout, fetchSubscriptionQvaPayCheckout } from '../api.js'
import { isSubscriptionCheckoutClosed, isSubscriptionCheckoutPaid, subscriptionCheckoutStatusMessage } from '../qvapay.js'

const planActionButtonClass = `${sellerBtnPrimary} h-12 min-h-12 w-full min-w-0 justify-center px-2 text-center text-sm leading-tight ${sellerFocusRing}`

function QvaPayCheckout({ tier, billing, onActivated, secondaryAction, canPay = true }) {
  const [checkout, setCheckout] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [paid, setPaid] = useState(false)
  const onActivatedRef = useRef(onActivated)
  const checkoutPurchaseId = checkout?.purchase_id
  const checkoutStatus = checkout?.status

  useEffect(() => { onActivatedRef.current = onActivated }, [onActivated])

  useEffect(() => {
    if (!checkoutPurchaseId || isSubscriptionCheckoutClosed({ status: checkoutStatus })) return undefined
    let stopped = false
    const check = async () => {
      if (stopped) return
      try {
        const result = await fetchSubscriptionQvaPayCheckout(getSellerToken(), checkoutPurchaseId)
        if (stopped) return
        setCheckout((current) => ({ ...result, payment_url: current?.payment_url || result.payment_url || '' }))
        if (isSubscriptionCheckoutPaid(result)) {
          setPaid(true)
          await onActivatedRef.current?.()
        }
      } catch {
        // Se reintenta en la próxima consulta mientras el usuario termina de pagar.
      }
    }
    const interval = window.setInterval(check, 4000)
    return () => {
      stopped = true
      window.clearInterval(interval)
    }
  }, [checkoutPurchaseId, checkoutStatus])

  async function beginCheckout() {
    setBusy(true)
    setError('')
    try {
      const result = await createSubscriptionQvaPayCheckout(getSellerToken(), {
        planTier: tier.id,
        billingPeriod: billing,
      })
      setCheckout(result)
      if (result.payment_url) window.open(result.payment_url, '_blank', 'noopener,noreferrer')
    } catch (err) {
      setError(err?.message || 'No pudimos crear la factura QvaPay. Inténtalo de nuevo.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mt-4 grid grid-cols-2 gap-2">
      <button type="button" className={planActionButtonClass} onClick={beginCheckout} disabled={busy || paid || !canPay}>
        {busy ? 'Creando factura…' : paid ? 'Plan activado' : 'Pagar con QvaPay'}
      </button>
      {secondaryAction}
      {checkout?.payment_url && checkout.status === 'pending' ? (
        <a className="col-span-2 text-center text-sm font-semibold text-brand-green underline underline-offset-2" href={checkout.payment_url} target="_blank" rel="noreferrer">Abrir factura QvaPay</a>
      ) : null}
      {checkout ? <p className={`col-span-2 text-center text-sm ${paid ? 'font-semibold text-brand-green' : 'text-brand-carmelita/80'}`} role="status">{subscriptionCheckoutStatusMessage(checkout)}</p> : null}
      {error ? <p className="col-span-2 text-sm text-red-700" role="alert">{error}</p> : null}
    </div>
  )
}

function CheckIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.75"
      aria-hidden
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  )
}

export default function SellerUpgradePlan({ profile, onUpdated }) {
  const currentPlan = getSellerPlan(profile)
  const isTrial = currentPlan.id === 'trial'
  const canUpgrade = canUpgradePlan(profile)
  const currentBilling = normalizeBillingPeriod(profile?.billing_period)
  const subscriptionInactive = profile?.subscription_active === false
  const paidPlanActive = !isTrial && !subscriptionInactive
  const [billing, setBilling] = useState(currentBilling)
  const [selectedPlanId, setSelectedPlanId] = useState(null)
  const { getPlanPrice, getPlanPeriodSavings, formatPlanAmount, cupPerUnit } = usePlanPricing()
  const currentPlanName = currentPlan.name
  const planOptions = PLAN_TIER_ORDER.map((tierId) => PLAN_TIERS[tierId])

  return (
    <div className="flex flex-col gap-3">
      <p className={sellerHint}>
        {subscriptionInactive
          ? 'Tu tienda aún no tiene una suscripción activa. Elige un plan y paga con QvaPay o solicita el cambio por WhatsApp.'
          : isTrial
          ? 'Estás en el plan Prueba. Puedes mejorarlo a Básico, Pro o Premium con QvaPay o por WhatsApp.'
          : `Estás en el plan ${currentPlan.name} · ${BILLING_LABELS[currentBilling] ?? BILLING_LABELS.monthly}. ${
              paidPlanActive
                ? 'Tu suscripción sigue activa. Podrás pagar o cambiar de plan cuando venza; puedes contactar al equipo para consultar opciones.'
                : canUpgrade
                  ? 'Elige un plan superior y págalo con QvaPay o solicita el cambio por WhatsApp.'
                  : 'Ya tienes el plan más completo; puedes renovarlo con QvaPay.'
            }`}
      </p>

      {planOptions.length > 0 ? (
        <div
          className="flex rounded-full border border-brand-green/15 bg-brand-white p-1"
          role="radiogroup"
          aria-label="Periodo de facturación"
        >
          {BILLING_PERIOD_ORDER.map((period) => (
            <button
              key={period}
              type="button"
              role="radio"
              aria-checked={billing === period}
              onClick={() => setBilling(period)}
              className={`flex-1 rounded-full px-2 py-2 text-xs font-semibold transition-all sm:px-3 sm:text-sm ${
                billing === period
                  ? 'bg-brand-green text-brand-white shadow-sm'
                  : 'text-brand-green sm:hover:bg-brand-yellow/15'
              }`}
            >
              {BILLING_LABELS[period]}
            </button>
          ))}
        </div>
      ) : null}

      {planOptions.length === 0 ? (
        <p className={sellerHint} role="status">No hay planes disponibles para esta cuenta.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {planOptions.map((tier) => {
            const isCurrentTier = tier.id === currentPlan.id && !isTrial
            const isSelected = selectedPlanId === tier.id
            const price = getPlanPrice(tier.id, billing)
            const usdEquivalent = price.amount != null && Number(cupPerUnit?.USD) > 0
              ? Number(price.amount) / Number(cupPerUnit.USD)
              : null
            const savings = getPlanPeriodSavings(tier.id, billing)
            const recommended = Boolean(tier.recommended)
            return (
              <li
                key={tier.id}
                onClick={() => setSelectedPlanId(tier.id)}
                onKeyDown={(event) => {
                  if (event.target !== event.currentTarget) return
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    setSelectedPlanId(tier.id)
                  }
                }}
                tabIndex={0}
                className={`cursor-pointer rounded-2xl border p-4 shadow-sm transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green/40 ${
                  isSelected
                    ? 'border-brand-green bg-brand-green/[0.08] ring-2 ring-brand-green/55 shadow-[0_8px_24px_rgba(45,80,22,0.24)]'
                    : recommended
                      ? 'border-brand-yellow bg-brand-yellow/[0.08] ring-2 ring-brand-yellow/35'
                      : 'border-brand-green/12 bg-brand-white hover:border-brand-green/30'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-brand-carmelita/80">
                    Plan {tier.name}
                  </p>
                  {recommended ? (
                    <span className="rounded-full bg-brand-yellow px-2.5 py-0.5 text-[0.62rem] font-semibold uppercase tracking-[0.08em] text-brand-green">
                      Recomendado
                    </span>
                  ) : null}
                </div>

                <p className="mt-2 font-display text-3xl font-bold leading-none tracking-tight text-brand-green">
                  {formatPlanPriceLabel(price, formatPlanAmount)}
                  <span className="ml-1 text-sm font-semibold text-brand-carmelita/80">
                    /{price.label}
                  </span>
                </p>
                {usdEquivalent != null ? (
                  <p className="mt-1 text-sm font-semibold text-brand-green/80">
                    ≈ {usdEquivalent.toLocaleString('es', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD/{price.label}
                  </p>
                ) : null}
                <p className="mt-2 text-sm leading-relaxed text-brand-carmelita/90">
                  {tier.description}
                </p>
                {savings != null && savings > 0 ? (
                  <p className="mt-1.5 text-xs font-medium text-brand-green">
                    Ahorra {formatPlanAmount(savings)} frente al mensual.
                  </p>
                ) : null}

                <ul className="mt-3 flex flex-col gap-1">
                  {tier.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-center gap-2 text-[0.8rem] leading-snug text-brand-green"
                    >
                      <span className="flex h-4 w-4 shrink-0 items-center justify-center text-brand-green">
                        <CheckIcon />
                      </span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <QvaPayCheckout
                  tier={tier}
                  billing={billing}
                  onActivated={onUpdated}
                  canPay={!paidPlanActive}
                  secondaryAction={(
                    <UpgradeToPremiumButton
                      className={planActionButtonClass}
                      storeName={profile?.store_name}
                      currentPlanName={currentPlanName}
                      targetPlanName={tier.name}
                      billingLabel={BILLING_LABELS[billing]}
                      label={`Pasar a ${tier.name}`}
                      disabled={isCurrentTier}
                    />
                  )}
                />
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

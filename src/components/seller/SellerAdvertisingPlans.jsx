import { useEffect, useState } from 'react'

import { ADVERTISING_TAGLINE, getAdvertisingPlans } from '../../constants/advertisingPlans'
import { checkoutAdvertisingPlan, fetchAdvertisingPlans } from '../../lib/api'
import { getSellerToken } from '../../lib/sellerAuth'
import { resolveUserFacingError } from '../../lib/userFacingError'
import SellerNotificationToast from './SellerNotificationToast'
import {
  sellerBtnPrimary,
  sellerBtnSecondary,
  sellerHint,
} from './sellerStyles.js'

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

function toUiPlan(plan) {
  return {
    id: plan.id,
    name: plan.name,
    eyebrow: plan.eyebrow,
    features: plan.features || [],
    recommended: Boolean(plan.recommended),
    amountUsd: Number(plan.amount_usd ?? plan.amountUsd),
    exchangeFeeUsd: Number(plan.exchange_fee_usd ?? 0),
    invoiceAmountUsd: Number(plan.invoice_amount_usd ?? plan.amountUsd),
  }
}

function formatUsd(amount) {
  return Number(amount).toLocaleString('es', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

export default function SellerAdvertisingPlans() {
  const fallbackPlans = getAdvertisingPlans().map(toUiPlan)
  const [plans, setPlans] = useState(fallbackPlans)
  const [hiringId, setHiringId] = useState(null)
  const [errorToast, setErrorToast] = useState(null)

  useEffect(() => {
    let cancelled = false
    fetchAdvertisingPlans()
      .then((data) => {
        if (cancelled || !Array.isArray(data?.plans)) return
        setPlans(data.plans.map(toUiPlan))
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  function showHireError(err, fallback) {
    const resolved = resolveUserFacingError(err, { fallbackMessage: fallback })
    setErrorToast({
      id: `${Date.now()}`,
      tone: 'error',
      title: resolved.title || 'No pudimos crear el pago',
      content: resolved.message,
    })
  }

  async function handleHire(plan) {
    setErrorToast(null)
    setHiringId(plan.id)
    try {
      const token = getSellerToken()
      const checkout = await checkoutAdvertisingPlan(token, plan.id)
      const url = checkout?.payment_url
      if (!url) {
        showHireError(null, 'No pudimos abrir el pago. Inténtalo más tarde.')
        return
      }
      window.location.assign(url)
    } catch (err) {
      showHireError(err, 'No pudimos crear el pago. Inténtalo más tarde.')
    } finally {
      setHiringId(null)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <p className={sellerHint}>{ADVERTISING_TAGLINE}</p>
      <p className={sellerHint}>
        Al pagar se suma 0.5% de exchange de QvaPay sobre el precio del plan.
      </p>
      <SellerNotificationToast
        toast={errorToast}
        aboveNav
        onDone={(id) => setErrorToast((current) => (current?.id === id ? null : current))}
      />
      <ul className="flex flex-col gap-3">
        {plans.map((plan) => {
          return (
            <li
              key={plan.id}
              className={`rounded-2xl border p-4 shadow-sm ${
                plan.recommended
                  ? 'border-brand-yellow bg-brand-yellow/[0.08] ring-2 ring-brand-yellow/35'
                  : 'border-brand-green/12 bg-brand-white'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="rounded-full border border-brand-green/15 bg-brand-green/8 px-2 py-0.5 text-[0.62rem] font-semibold uppercase tracking-[0.1em] text-brand-carmelita">
                  {plan.eyebrow}
                </span>
                {plan.recommended ? (
                  <span className="rounded-full bg-brand-yellow px-2.5 py-0.5 text-[0.62rem] font-semibold uppercase tracking-[0.08em] text-brand-green">
                    Más popular
                  </span>
                ) : null}
              </div>

              <div className="mt-3 flex items-baseline gap-1.5 text-brand-green">
                <span className="font-display text-4xl font-bold leading-none tracking-tight">
                  {formatUsd(plan.amountUsd)}
                </span>
                <span className="text-xs font-semibold uppercase tracking-[0.08em] text-brand-carmelita">
                  USD
                </span>
              </div>
              <p className="mt-1.5 text-sm font-semibold text-brand-carmelita/85">{plan.name}</p>
              <p className="mt-1 text-xs text-brand-carmelita/70">
                Cobro: {formatUsd(plan.invoiceAmountUsd)} USD (incluye 0.5% de exchange)
              </p>

              <ul className="mt-3 flex flex-col gap-1">
                {plan.features.map((feature) => (
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

              <button
                type="button"
                onClick={() => handleHire(plan)}
                disabled={Boolean(hiringId)}
                className={`${plan.recommended ? sellerBtnPrimary : sellerBtnSecondary} mt-4 w-full`}
              >
                {hiringId === plan.id ? 'Abriendo QvaPay…' : 'Pagar con QvaPay'}
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

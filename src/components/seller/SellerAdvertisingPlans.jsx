import { useState } from 'react'

import {
  ADVERTISING_TAGLINE,
  getAdvertisingPlanHireLabel,
  getAdvertisingPlans,
} from '../../constants/advertisingPlans'
import { fetchRenewalContactPhone } from '../../lib/api'
import { convertBetweenCurrencies } from '../../lib/displayPrice'
import { areExchangeRatesAvailable } from '../../lib/exchangeRates'
import { openAdvertisingPlanWhatsApp } from '../../lib/renewalWhatsApp'
import { usePlanPricing } from '../../lib/usePlanPricing'
import { PLAN_DISPLAY_CURRENCY, PLAN_SOURCE_CURRENCY } from '../../constants/plan'
import {
  sellerAlertError,
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

function formatPriceParts(plan, cupPerUnit) {
  if (areExchangeRatesAvailable()) {
    const amount = convertBetweenCurrencies(
      plan.amountUsd,
      PLAN_SOURCE_CURRENCY,
      PLAN_DISPLAY_CURRENCY,
      cupPerUnit,
    )
    return {
      amount: Number(amount).toLocaleString('es'),
      currency: PLAN_DISPLAY_CURRENCY,
    }
  }
  return {
    amount: Number(plan.amountUsd).toLocaleString('es'),
    currency: PLAN_SOURCE_CURRENCY,
  }
}

export default function SellerAdvertisingPlans({ profile }) {
  const plans = getAdvertisingPlans()
  const { cupPerUnit } = usePlanPricing()
  const [hiringId, setHiringId] = useState(null)
  const [error, setError] = useState('')

  async function handleHire(plan) {
    setError('')
    setHiringId(plan.id)
    try {
      const data = await fetchRenewalContactPhone()
      const phone = data.renewal_contact_phone
      if (!phone) {
        setError('El administrador aún no configuró un teléfono de contacto.')
        return
      }
      const opened = openAdvertisingPlanWhatsApp({
        storeName: profile?.store_name,
        planName: getAdvertisingPlanHireLabel(plan),
        adminPhone: phone,
      })
      if (!opened) {
        setError('No pudimos abrir WhatsApp. Revisa el número de contacto.')
      }
    } catch {
      setError('No pudimos obtener el teléfono de contacto. Inténtalo más tarde.')
    } finally {
      setHiringId(null)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <p className={sellerHint}>{ADVERTISING_TAGLINE}</p>
      {error ? (
        <p className={sellerAlertError} role="alert">
          {error}
        </p>
      ) : null}
      <ul className="flex flex-col gap-3">
        {plans.map((plan) => {
          const price = formatPriceParts(plan, cupPerUnit)
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
                  {price.amount}
                </span>
                <span className="text-xs font-semibold uppercase tracking-[0.08em] text-brand-carmelita">
                  {price.currency}
                </span>
              </div>
              <p className="mt-1.5 text-sm font-semibold text-brand-carmelita/85">{plan.name}</p>

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
                {hiringId === plan.id ? 'Abriendo WhatsApp…' : 'Contratar plan'}
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

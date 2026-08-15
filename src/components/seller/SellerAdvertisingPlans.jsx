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
import {
  PLAN_DISPLAY_CURRENCY,
  PLAN_SOURCE_CURRENCY,
  formatPlanAmount,
} from '../../constants/plan'
import {
  sellerAlertError,
  sellerBtnPrimary,
  sellerHint,
} from './sellerStyles.js'

function CheckIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      aria-hidden
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  )
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
          const priceLabel = areExchangeRatesAvailable()
            ? formatPlanAmount(
                convertBetweenCurrencies(
                  plan.amountUsd,
                  PLAN_SOURCE_CURRENCY,
                  PLAN_DISPLAY_CURRENCY,
                  cupPerUnit,
                ),
                PLAN_DISPLAY_CURRENCY,
              )
            : formatPlanAmount(plan.amountUsd, PLAN_SOURCE_CURRENCY)
          return (
            <li
              key={plan.id}
              className={`rounded-2xl border p-4 shadow-sm ${
                plan.recommended
                  ? 'border-brand-green bg-brand-green/[0.04] ring-2 ring-brand-green/15'
                  : 'border-brand-green/12 bg-brand-white'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-brand-carmelita/80">
                    {plan.eyebrow}
                  </p>
                  <h3 className="mt-1 font-display text-base font-bold text-brand-green">
                    {plan.name}
                  </h3>
                </div>
                {plan.recommended ? (
                  <span className="shrink-0 rounded-full bg-brand-yellow/25 px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.08em] text-brand-green">
                    Más completo
                  </span>
                ) : null}
              </div>
              <p className="mt-2 font-display text-xl font-bold text-brand-green">{priceLabel}</p>
              <ul className="mt-3 flex flex-col gap-1.5">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm text-brand-green">
                    <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-brand-yellow/25 text-brand-green">
                      <CheckIcon />
                    </span>
                    <span className="leading-relaxed">{feature}</span>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={() => handleHire(plan)}
                disabled={Boolean(hiringId)}
                className={`${sellerBtnPrimary} mt-4 w-full`}
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

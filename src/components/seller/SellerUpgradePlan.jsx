import { useState } from 'react'

import { BILLING_LABELS } from '../../constants/admin'
import {
  BILLING_PERIOD_ORDER,
  canUpgradePlan,
  formatPlanPriceLabel,
  getPlanTier,
  normalizeBillingPeriod,
  normalizePlanTier,
  upgradeablePlanTiers,
} from '../../constants/plan'
import { usePlanPricing } from '../../lib/usePlanPricing'
import UpgradeToPremiumButton from './UpgradeToPremiumButton'
import { sellerHint } from './sellerStyles.js'

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

export default function SellerUpgradePlan({ profile }) {
  const currentTierId = normalizePlanTier(profile?.plan_tier)
  const currentTier = getPlanTier(currentTierId)
  const isTrial = Boolean(profile?.is_trial)
  const upgrades = upgradeablePlanTiers(profile)
  const canUpgrade = canUpgradePlan(profile)
  const currentBilling = normalizeBillingPeriod(profile?.billing_period)
  const [billing, setBilling] = useState(currentBilling)
  const { getPlanPrice, getPlanPeriodSavings, formatPlanAmount } = usePlanPricing()
  const currentPlanName = isTrial ? 'prueba gratuita' : currentTier.name

  return (
    <div className="flex flex-col gap-3">
      <p className={sellerHint}>
        {isTrial
          ? 'Estás en prueba gratuita. Elige un plan de pago —incluido Básico— y te conectamos por WhatsApp para completar el cambio.'
          : `Estás en el plan ${currentTier.name} · ${BILLING_LABELS[currentBilling] ?? BILLING_LABELS.monthly}. ${
              canUpgrade
                ? 'Elige un plan superior y te conectamos por WhatsApp para completar el cambio.'
                : 'Ya tienes el plan más completo.'
            }`}
      </p>

      {canUpgrade ? (
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

      {upgrades.length === 0 ? (
        <p className={sellerHint} role="status">
          Si quieres cambiar el periodo de cobro, escribe al administrador al renovar.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {upgrades.map((tier) => {
            const price = getPlanPrice(tier.id, billing)
            const savings = getPlanPeriodSavings(tier.id, billing)
            const recommended = Boolean(tier.recommended)
            return (
              <li
                key={tier.id}
                className={`rounded-2xl border p-4 shadow-sm ${
                  recommended
                    ? 'border-brand-yellow bg-brand-yellow/[0.08] ring-2 ring-brand-yellow/35'
                    : 'border-brand-green/12 bg-brand-white'
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

                <UpgradeToPremiumButton
                  className="mt-4 w-full"
                  storeName={profile?.store_name}
                  currentPlanName={currentPlanName}
                  targetPlanName={tier.name}
                  billingLabel={BILLING_LABELS[billing]}
                  label={`Pasar a ${tier.name}`}
                />
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

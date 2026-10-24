import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AuthHeader from '../components/AuthHeader'
import AuthShell from '../components/AuthShell'
import RegisterDiscountCodeField from '../components/RegisterDiscountCodeField'
import { authPageIntro } from '../components/authStyles'
import RegisterProgress from '../components/RegisterProgress'
import Button from '../../components/Button'
import { BILLING_LABELS } from '../../constants/admin'
import {
  BILLING_PERIOD_ORDER,
  PLAN_TIER_ORDER,
  PLAN_TIERS,
  formatPlanPriceLabel,
  normalizePlanTier,
} from '../../subscriptions/constants.js'
import { fetchDiscountCodesAvailability } from '../api.js'
import { getDiscountedPlanPrice } from '../../lib/discountCode'
import { getRegisterSteps } from '../constants.js'
import { usePlanPricing } from '../../lib/usePlanPricing'

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  )
}

function BillingToggle({ billing, onChange }) {
  return (
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
          onClick={() => onChange(period)}
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
  )
}

function PlanPriceDisplay({ price, discountPercent, formatPlanAmount }) {
  const discountedPrice = getDiscountedPlanPrice(price, discountPercent)
  const hasDiscount = Boolean(discountPercent && discountPercent > 0)

  if (!hasDiscount) {
    return (
      <p className="mt-1 font-display text-2xl font-bold leading-tight text-brand-green sm:text-[1.75rem]">
        <span className="whitespace-nowrap">{formatPlanPriceLabel(price, formatPlanAmount)}</span>
        <span className="ml-1 text-sm font-semibold text-brand-carmelita/80">/{price.label}</span>
      </p>
    )
  }

  return (
    <div className="mt-1">
      <p className="text-sm font-semibold text-brand-carmelita/70 line-through">
        {formatPlanPriceLabel(price, formatPlanAmount)}
      </p>
      <p className="font-display text-2xl font-bold leading-tight text-brand-green sm:text-[1.75rem]">
        <span className="whitespace-nowrap">
          {formatPlanPriceLabel(discountedPrice, formatPlanAmount)}
        </span>
        <span className="ml-1 text-sm font-semibold text-brand-carmelita/80">/{price.label}</span>
      </p>
    </div>
  )
}

const planCardShell = (selected, recommended) =>
  `flex h-full min-h-0 w-full flex-col rounded-3xl border p-5 text-left transition-all touch-manipulation sm:p-6 ${
    recommended
      ? 'border-brand-yellow bg-brand-yellow/[0.08] shadow-[0_8px_28px_rgba(89,128,44,0.14)] ring-2 ring-brand-yellow/40'
      : selected
        ? 'border-brand-green bg-brand-white shadow-[0_8px_28px_rgba(89,128,44,0.14)] ring-2 ring-brand-green/20'
        : 'border-brand-green/15 bg-brand-white/90 active:border-brand-green/30 sm:hover:border-brand-green/30'
  }`

function PlanCard({
  tier,
  billing,
  selected,
  onSelect,
  getPlanPrice,
  getPlanPeriodSavings: periodSavings,
  formatPlanAmount,
  discountPercent,
}) {
  const price = getPlanPrice(tier.id, billing)
  const periodSavingsAmount = periodSavings(tier.id, billing)
  const discountedSavings =
    discountPercent && periodSavingsAmount != null
      ? Math.max(0, Math.floor((periodSavingsAmount * (100 - discountPercent)) / 100))
      : periodSavingsAmount
  const recommended = Boolean(tier.recommended)

  return (
    <button
      type="button"
      onClick={() => onSelect(tier.id)}
      className={planCardShell(selected, recommended)}
      aria-pressed={selected}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-brand-carmelita/80">
            Plan {tier.name}
          </p>
          <PlanPriceDisplay
            price={price}
            discountPercent={discountPercent}
            formatPlanAmount={formatPlanAmount}
          />
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          {recommended ? (
            <span className="rounded-full bg-brand-yellow px-2 py-0.5 text-[0.62rem] font-semibold uppercase tracking-[0.08em] text-brand-green">
              Recomendado
            </span>
          ) : null}
          <span
            className={`flex h-5 w-5 items-center justify-center rounded-full border ${
              selected ? 'border-brand-green bg-brand-green text-brand-white' : 'border-brand-green/25'
            }`}
            aria-hidden="true"
          >
            {selected ? <CheckIcon /> : null}
          </span>
        </div>
      </div>

      <p className="mt-3 text-sm leading-relaxed text-pretty text-brand-carmelita/90">
        {tier.description}
      </p>

      {discountedSavings != null && discountedSavings > 0 ? (
        <p className="mt-2 text-xs font-medium text-brand-green">
          Ahorra {formatPlanAmount(discountedSavings)} frente al mensual.
        </p>
      ) : null}

      <ul className="mt-4 flex flex-1 flex-col gap-2">
        {tier.features.map((feature) => (
          <li key={feature} className="flex items-start gap-2">
            <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-brand-yellow/25 text-brand-green">
              <CheckIcon />
            </span>
            <span className="min-w-0 text-sm leading-relaxed text-pretty text-brand-green">
              {feature}
            </span>
          </li>
        ))}
      </ul>
    </button>
  )
}

function TrialCard({ selected, onSelect }) {
  const tier = PLAN_TIERS.pro
  return (
    <button
      type="button"
      onClick={onSelect}
      className={planCardShell(selected, false)}
      aria-pressed={selected}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-brand-carmelita/80">
            Plan Prueba
          </p>
          <p className="mt-1 font-display text-2xl font-bold leading-tight text-brand-green sm:text-[1.75rem]">
            Gratis
          </p>
        </div>
        <span
          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
            selected ? 'border-brand-green bg-brand-green text-brand-white' : 'border-brand-green/25'
          }`}
          aria-hidden="true"
        >
          {selected ? <CheckIcon /> : null}
        </span>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-pretty text-brand-carmelita/90">
        15 días con las herramientas del plan Pro. Luego puedes pasar a Básico, Pro o Premium.
        No incluye menciones en Instagram ni promociones en redes.
      </p>
      <ul className="mt-4 flex flex-1 flex-col gap-2">
        {tier.features.map((feature) => (
          <li key={feature} className="flex items-start gap-2">
            <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-brand-yellow/25 text-brand-green">
              <CheckIcon />
            </span>
            <span className="min-w-0 text-sm leading-relaxed text-pretty text-brand-green">
              {feature}
            </span>
          </li>
        ))}
      </ul>
    </button>
  )
}

export default function RegisterPlan() {
  const navigate = useNavigate()
  const [billing, setBilling] = useState('monthly')
  const [kind, setKind] = useState('paid')
  const [planTier, setPlanTier] = useState('pro')
  const [discountCodesAvailable, setDiscountCodesAvailable] = useState(false)
  const [appliedDiscount, setAppliedDiscount] = useState(null)
  const { getPlanPrice, getPlanPeriodSavings, formatPlanAmount } = usePlanPricing()

  useEffect(() => {
    let active = true
    fetchDiscountCodesAvailability()
      .then((data) => {
        if (active) setDiscountCodesAvailable(Boolean(data?.available))
      })
      .catch(() => {
        if (active) setDiscountCodesAvailable(false)
      })
    return () => {
      active = false
    }
  }, [])

  function continueNext() {
    try {
      sessionStorage.setItem('registerKind', kind)
    } catch {
      /* ignore */
    }
    if (kind === 'trial') {
      navigate('/registro/verificacion', {
        state: {
          kind: 'trial',
          billing: 'monthly',
          planTier: 'standard',
        },
      })
      return
    }
    navigate('/registro/pago', {
      state: {
        kind: 'paid',
        billing,
        planTier: normalizePlanTier(planTier),
        discountCode: appliedDiscount?.code ?? null,
        discountPercent: appliedDiscount?.percent_off ?? null,
      },
    })
  }

  return (
    <AuthShell backTo="/" backLabel="Inicio" contentWidth="plans">
      <section className="animate-fade-in" aria-labelledby="plan-title">
        <div className={authPageIntro}>
          <AuthHeader
            eyebrow="Crear cuenta"
            title="Elige tu plan"
            description="El plan Prueba dura 15 días con las prestaciones del plan Pro. También puedes elegir Básico, Pro o Premium y continuar al pago."
            layout="desktop-left"
          />
          <RegisterProgress currentStep={1} steps={getRegisterSteps(kind)} />
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-6">
            <div className="min-w-0 w-full max-w-xl flex-1">
              {kind === 'paid' ? (
                <BillingToggle billing={billing} onChange={setBilling} />
              ) : (
                <p className="text-sm text-brand-carmelita/85">
                  Prueba gratis 15 días. Puedes elegir un plan de pago cuando quieras.
                </p>
              )}
            </div>
            <div className="flex w-full flex-col gap-2 lg:w-64 lg:shrink-0">
              <Button onClick={continueNext}>
                {kind === 'trial' ? 'Continuar sin pago' : 'Continuar al pago'}
              </Button>
              <p className="text-center text-xs text-brand-carmelita/80">
                ¿Ya tienes cuenta?{' '}
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="font-semibold text-brand-green underline-offset-2 hover:underline"
                >
                  Inicia sesión
                </button>
              </p>
            </div>
          </div>

          {kind === 'paid' && discountCodesAvailable ? (
            <RegisterDiscountCodeField
              billing={billing}
              planTier={normalizePlanTier(planTier)}
              applied={appliedDiscount}
              onApplied={setAppliedDiscount}
              onClear={() => setAppliedDiscount(null)}
            />
          ) : null}

          <div className="grid grid-cols-1 items-stretch gap-3 sm:grid-cols-2 sm:gap-4">
            <TrialCard
              selected={kind === 'trial'}
              onSelect={() => {
                setKind('trial')
                setPlanTier('standard')
                setAppliedDiscount(null)
              }}
            />
            {PLAN_TIER_ORDER.map((tierId) => (
              <PlanCard
                key={tierId}
                tier={PLAN_TIERS[tierId]}
                billing={billing}
                selected={kind === 'paid' && planTier === tierId}
                onSelect={(id) => {
                  setKind('paid')
                  setPlanTier(id)
                }}
                getPlanPrice={getPlanPrice}
                getPlanPeriodSavings={getPlanPeriodSavings}
                formatPlanAmount={formatPlanAmount}
                discountPercent={appliedDiscount?.percent_off ?? null}
              />
            ))}
          </div>
        </div>
      </section>

    </AuthShell>
  )
}

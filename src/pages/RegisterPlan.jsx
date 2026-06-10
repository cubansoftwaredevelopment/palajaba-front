import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AuthCard from '../components/auth/AuthCard'
import AuthHeader from '../components/auth/AuthHeader'
import AuthShell from '../components/auth/AuthShell'
import {
  authPageIntro,
  authRegisterGrid,
  authStickyAside,
} from '../components/auth/authStyles'
import RegisterProgress from '../components/auth/RegisterProgress'
import Button from '../components/Button'
import {
  PLAN_TAGLINE,
  PLAN_TIER_ORDER,
  PLAN_TIERS,
  formatPlanAmount,
  getPlanPrice,
  normalizePlanTier,
} from '../constants/plan'

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
      <button
        type="button"
        role="radio"
        aria-checked={billing === 'monthly'}
        onClick={() => onChange('monthly')}
        className={`flex-1 rounded-full px-3 py-2 text-sm font-semibold transition-all ${
          billing === 'monthly'
            ? 'bg-brand-green text-brand-white shadow-sm'
            : 'text-brand-green sm:hover:bg-brand-yellow/15'
        }`}
      >
        Mensual
      </button>
      <button
        type="button"
        role="radio"
        aria-checked={billing === 'yearly'}
        onClick={() => onChange('yearly')}
        className={`relative flex-1 rounded-full px-3 py-2 text-sm font-semibold transition-all ${
          billing === 'yearly'
            ? 'bg-brand-green text-brand-white shadow-sm'
            : 'text-brand-green sm:hover:bg-brand-yellow/15'
        }`}
      >
        Anual
      </button>
    </div>
  )
}

function PlanCard({ tier, billing, selected, onSelect }) {
  const price = getPlanPrice(tier.id, billing)

  return (
    <button
      type="button"
      onClick={() => onSelect(tier.id)}
      className={`w-full rounded-3xl border p-4 text-left transition-all touch-manipulation sm:p-5 ${
        selected
          ? 'border-brand-green bg-brand-white shadow-[0_8px_28px_rgba(89,128,44,0.14)] ring-2 ring-brand-green/20'
          : 'border-brand-green/15 bg-brand-white/90 active:border-brand-green/30'
      }`}
      aria-pressed={selected}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-brand-carmelita/80">
            Plan {tier.name}
          </p>
          <p className="mt-1 font-display text-xl font-bold text-brand-green sm:text-2xl">
            {formatPlanAmount(price.amount)}
            <span className="ml-1 text-sm font-semibold text-brand-carmelita/80">/{price.label}</span>
          </p>
        </div>
        <span
          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
            selected ? 'border-brand-green bg-brand-green text-brand-white' : 'border-brand-green/25'
          }`}
          aria-hidden="true"
        >
          {selected ? <CheckIcon /> : null}
        </span>
      </div>

      <p className="mt-2 text-sm leading-relaxed text-brand-carmelita/90">{tier.description}</p>

      {billing === 'yearly' ? (
        <p className="mt-2 text-xs font-medium text-brand-green">
          Ahorra {formatPlanAmount(tier.yearlySavings)} al año.
        </p>
      ) : null}

      <ul className="mt-4 flex flex-col gap-2">
        {tier.features.map((feature) => (
          <li key={feature} className="flex items-start gap-2">
            <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-brand-yellow/25 text-brand-green">
              <CheckIcon />
            </span>
            <span className="text-sm leading-relaxed text-brand-green">{feature}</span>
          </li>
        ))}
      </ul>
    </button>
  )
}

export default function RegisterPlan() {
  const navigate = useNavigate()
  const [billing, setBilling] = useState('monthly')
  const [planTier, setPlanTier] = useState('standard')
  const selectedTier = PLAN_TIERS[normalizePlanTier(planTier)]

  return (
    <AuthShell backTo="/" backLabel="Inicio">
      <section className="animate-fade-in" aria-labelledby="plan-title">
        <div className={authPageIntro}>
          <AuthHeader
            eyebrow="Crear cuenta"
            title="Elige tu plan"
            description={PLAN_TAGLINE}
            layout="desktop-left"
          />
          <RegisterProgress currentStep={1} />
        </div>

        <div className={authRegisterGrid}>
          <div className="flex flex-col gap-4">
            <BillingToggle billing={billing} onChange={setBilling} />

            <div className="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-2">
              {PLAN_TIER_ORDER.map((tierId) => (
                <PlanCard
                  key={tierId}
                  tier={PLAN_TIERS[tierId]}
                  billing={billing}
                  selected={planTier === tierId}
                  onSelect={setPlanTier}
                />
              ))}
            </div>
          </div>

          <aside className={`${authStickyAside} flex flex-col gap-4`}>
            <AuthCard>
              <div className="text-center lg:text-left">
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-brand-carmelita/80">
                  Resumen
                </p>
                <p className="mt-2 font-display text-2xl font-bold text-brand-green">
                  Plan {selectedTier.name}
                </p>
                <p className="mt-1 text-sm text-brand-carmelita/85">
                  Facturación {billing === 'yearly' ? 'anual' : 'mensual'}
                </p>
                <p className="mt-3 text-3xl font-bold text-brand-green">
                  {formatPlanAmount(getPlanPrice(planTier, billing).amount)}
                  <span className="ml-1 text-base font-semibold text-brand-carmelita/80">
                    /{getPlanPrice(planTier, billing).label}
                  </span>
                </p>
              </div>
            </AuthCard>

            <Button
              onClick={() =>
                navigate('/registro/pago', {
                  state: { billing, planTier: normalizePlanTier(planTier) },
                })
              }
            >
              Continuar
            </Button>

            <p className="text-center text-xs text-brand-carmelita/80 lg:text-left">
              ¿Ya tienes cuenta?{' '}
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="font-semibold text-brand-green underline-offset-2 hover:underline"
              >
                Inicia sesión
              </button>
            </p>
          </aside>
        </div>
      </section>
    </AuthShell>
  )
}

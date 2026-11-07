import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import Button from '../../components/Button'
import { BILLING_LABELS } from '../../constants/admin.js'
import { usePlanPricing } from '../../lib/usePlanPricing'
import {
  BILLING_PERIOD_ORDER,
  formatPlanPriceLabel,
  PLAN_TIERS,
  TRIAL_PLAN,
} from '../../subscriptions/constants.js'
import AuthHeader from '../components/AuthHeader'
import AuthShell from '../components/AuthShell'
import RegisterProgress from '../components/RegisterProgress'
import { getRegisterSteps } from '../constants.js'

function PlanSelectionMark({ selected }) {
  return (
    <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${selected ? 'border-brand-green bg-brand-green text-brand-white' : 'border-brand-green/25 bg-brand-white/70 text-transparent'}`} aria-hidden="true">
      {selected ? <span className="text-xs font-bold">✓</span> : null}
    </span>
  )
}

export default function RegisterPlan() {
  const navigate = useNavigate()
  const location = useLocation()
  const [planTier, setPlanTier] = useState('')
  const [trialSelected, setTrialSelected] = useState(false)
  const [billing, setBilling] = useState('monthly')
  const { getPlanPrice, formatPlanAmount, cupPerUnit, qvapayPlanDiscountPercent } = usePlanPricing()

  function continueToRegistration() {
    if (trialSelected) {
      navigate('/registro', {
        state: {
          kind: 'trial',
          backTo: location.state?.backTo,
        },
      })
      return
    }
    if (!planTier) return
    navigate('/registro', {
      state: {
        kind: 'paid',
        planTier,
        billing,
        backTo: location.state?.backTo,
      },
    })
  }

  return (
    <AuthShell backTo="/crear-cuenta" backLabel="Tipo de cuenta" contentWidth="plans">
      <section className="animate-fade-in" aria-label="Seleccionar plan de tienda">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(250px,0.8fr)] lg:items-center">
          <AuthHeader
            eyebrow="Crear cuenta"
            title="Elige tu plan"
            description="El plan Prueba dura 15 días con las prestaciones del plan Pro. También puedes elegir Básico, Pro o Premium y continuar al pago."
            layout="desktop-left"
          />
          <RegisterProgress currentStep={1} steps={getRegisterSteps('paid')} className="mx-auto mb-4 w-full max-w-sm lg:mb-6" />
        </div>

        <div className="mt-2 grid gap-3 sm:grid-cols-[1.2fr_1fr] sm:items-center lg:max-w-4xl">
          <div className="flex rounded-full border border-brand-green/15 bg-brand-white p-1" role="radiogroup" aria-label="Periodo de facturación">
            {BILLING_PERIOD_ORDER.map((period) => (
              <button
                key={period}
                type="button"
                role="radio"
                aria-checked={billing === period}
                onClick={() => setBilling(period)}
                className={`flex-1 rounded-full px-2 py-2 text-xs font-semibold transition-all sm:px-3 sm:text-sm ${billing === period ? 'bg-brand-green text-brand-white shadow-sm' : 'text-brand-green hover:bg-brand-yellow/15'}`}
              >
                {BILLING_LABELS[period]}
              </button>
            ))}
          </div>
          <div className="flex flex-col items-center gap-1">
            <Button type="button" className="w-full" disabled={!planTier && !trialSelected} onClick={continueToRegistration}>
              {trialSelected ? 'Continuar con la prueba' : 'Continuar al pago'}
            </Button>
            <p className="text-xs text-brand-carmelita/75">¿Ya tienes cuenta? <Link to="/login" className="font-semibold text-brand-green hover:underline">Inicia sesión</Link></p>
          </div>
        </div>

        <div className="mt-5 grid items-stretch gap-3 sm:gap-4 md:grid-cols-2 lg:max-w-5xl">
          <button
            type="button"
            role="radio"
            aria-checked={trialSelected}
            onClick={() => {
              setTrialSelected(true)
              setPlanTier('')
            }}
            className={`flex h-full flex-col rounded-2xl border p-5 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green/40 ${trialSelected ? 'border-brand-green bg-brand-green/5 ring-2 ring-brand-green/25' : 'border-brand-yellow bg-brand-yellow/[0.07] hover:border-brand-green/35'}`}
          >
            <span className="flex items-start justify-between gap-2">
              <span className="text-xs font-bold uppercase tracking-[0.12em] text-brand-carmelita/80">Plan Prueba</span>
              <PlanSelectionMark selected={trialSelected} />
            </span>
            <span className="mt-3 block font-display text-2xl font-bold text-brand-green">Gratis</span>
            <span className="mt-2 block text-sm leading-relaxed text-brand-carmelita/85">{TRIAL_PLAN.description}</span>
            <span className="mt-3 flex flex-col gap-1">
              <span className="flex items-start gap-2 text-xs leading-relaxed text-brand-green"><span aria-hidden="true" className="font-bold">✓</span>Prueba las herramientas del plan Pro</span>
              <span className="flex items-start gap-2 text-xs leading-relaxed text-brand-green"><span aria-hidden="true" className="font-bold">✓</span>Sin pago para empezar</span>
              {TRIAL_PLAN.features.map((feature) => (
                <span key={feature} className="flex items-start gap-2 text-xs leading-relaxed text-brand-green"><span aria-hidden="true" className="font-bold">✓</span>{feature}</span>
              ))}
            </span>
          </button>
          {Object.values(PLAN_TIERS).map((plan) => {
            const selected = planTier === plan.id
            const price = getPlanPrice(plan.id, billing)
            const usdEquivalent = price.amount != null && Number(cupPerUnit?.USD) > 0
              ? Number(price.amount) / Number(cupPerUnit.USD)
              : null
            return (
              <button
                key={plan.id}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => {
                  setTrialSelected(false)
                  setPlanTier(plan.id)
                }}
                className={`flex h-full flex-col rounded-2xl border p-5 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green/40 ${selected ? 'border-brand-green bg-brand-green/5 ring-2 ring-brand-green/25' : plan.recommended ? 'border-brand-yellow bg-brand-yellow/[0.07]' : 'border-brand-green/12 bg-brand-white hover:border-brand-green/35'}`}
              >
            <span className="flex items-start justify-between gap-2">
              <span className="whitespace-nowrap text-xs font-bold uppercase tracking-[0.12em] text-brand-carmelita/80">Plan {plan.name}</span>
              <span className="flex shrink-0 items-center gap-1.5">
                {plan.recommended ? <span className="rounded-full bg-brand-yellow px-2 py-0.5 text-[0.6rem] font-bold uppercase text-brand-green">Recomendado</span> : null}
                <PlanSelectionMark selected={selected} />
              </span>
                </span>
                <span className="mt-3 block font-display text-2xl font-bold text-brand-green">
                  {formatPlanPriceLabel(price, formatPlanAmount)}<span className="ml-1 text-xs font-semibold text-brand-carmelita/80">/{price.label}</span>
                </span>
                {usdEquivalent != null ? (
                  <span className="mt-1 block text-sm font-semibold text-brand-green/80">
                    ≈ {usdEquivalent.toLocaleString('es', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD/{price.label}
                  </span>
                ) : null}
                {usdEquivalent != null && qvapayPlanDiscountPercent > 0 ? (
                  <span className="mt-1 block text-xs font-semibold text-brand-green">
                    Con QvaPay: {(Math.round(usdEquivalent * (100 - qvapayPlanDiscountPercent)) / 100).toLocaleString('es', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
                  </span>
                ) : null}
                <span className="mt-2 block text-sm leading-relaxed text-brand-carmelita/85">{plan.description}</span>
                <span className="mt-3 flex flex-col gap-1">
                  {plan.features.map((feature) => (
                    <span key={feature} className="flex items-start gap-2 text-xs leading-relaxed text-brand-green">
                      <span aria-hidden="true" className="font-bold">✓</span>{feature}
                    </span>
                  ))}
                </span>
              </button>
            )
          })}
        </div>

      </section>
    </AuthShell>
  )
}

import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
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

export default function RegisterPlan() {
  const navigate = useNavigate()
  const location = useLocation()
  const [planTier, setPlanTier] = useState('')
  const [trialSelected, setTrialSelected] = useState(false)
  const [billing, setBilling] = useState('monthly')
  const { getPlanPrice, formatPlanAmount } = usePlanPricing()

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
        kind: 'account',
        planTier,
        billing,
        backTo: location.state?.backTo,
      },
    })
  }

  return (
    <AuthShell backTo="/crear-cuenta" backLabel="Tipo de cuenta">
      <section className="animate-fade-in" aria-label="Seleccionar plan de tienda">
        <AuthHeader
          eyebrow="Crear tienda · Paso 1"
          title="Elige un plan para tu tienda"
          description="Selecciona el plan y el periodo de facturación que quieres asociar a tu cuenta. Después completarás tus datos y la verificación."
          layout="desktop-left"
        />

        <div className="mt-5 flex rounded-full border border-brand-green/15 bg-brand-white p-1" role="radiogroup" aria-label="Periodo de facturación">
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

        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <button
            type="button"
            role="radio"
            aria-checked={trialSelected}
            onClick={() => {
              setTrialSelected(true)
              setPlanTier('')
            }}
            className={`rounded-2xl border p-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green/40 ${trialSelected ? 'border-brand-green bg-brand-green/5 ring-2 ring-brand-green/25' : 'border-brand-yellow bg-brand-yellow/[0.07] hover:border-brand-green/35'}`}
          >
            <span className="flex items-start justify-between gap-2">
              <span className="text-xs font-bold uppercase tracking-[0.12em] text-brand-carmelita/80">{TRIAL_PLAN.name} gratis</span>
              <span className="rounded-full bg-brand-yellow px-2 py-0.5 text-[0.6rem] font-bold uppercase text-brand-green">15 días</span>
            </span>
            <span className="mt-3 block font-display text-2xl font-bold text-brand-green">Gratis</span>
            <span className="mt-2 block text-sm leading-relaxed text-brand-carmelita/85">{TRIAL_PLAN.description}</span>
            <span className="mt-3 flex flex-col gap-1">
              <span className="flex items-start gap-2 text-xs leading-relaxed text-brand-green"><span aria-hidden="true" className="font-bold">✓</span>Prueba las herramientas del plan Pro</span>
              <span className="flex items-start gap-2 text-xs leading-relaxed text-brand-green"><span aria-hidden="true" className="font-bold">✓</span>Sin pago para empezar</span>
            </span>
          </button>
          {Object.values(PLAN_TIERS).map((plan) => {
            const selected = planTier === plan.id
            const price = getPlanPrice(plan.id, billing)
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
                className={`rounded-2xl border p-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green/40 ${selected ? 'border-brand-green bg-brand-green/5 ring-2 ring-brand-green/25' : plan.recommended ? 'border-brand-yellow bg-brand-yellow/[0.07]' : 'border-brand-green/12 bg-brand-white hover:border-brand-green/35'}`}
              >
                <span className="flex items-start justify-between gap-2">
                  <span className="text-xs font-bold uppercase tracking-[0.12em] text-brand-carmelita/80">Plan {plan.name}</span>
                  {plan.recommended ? <span className="rounded-full bg-brand-yellow px-2 py-0.5 text-[0.6rem] font-bold uppercase text-brand-green">Recomendado</span> : null}
                </span>
                <span className="mt-3 block font-display text-2xl font-bold text-brand-green">
                  {formatPlanPriceLabel(price, formatPlanAmount)}<span className="ml-1 text-xs font-semibold text-brand-carmelita/80">/{price.label}</span>
                </span>
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

        <Button type="button" className="mt-5 w-full" disabled={!planTier && !trialSelected} onClick={continueToRegistration}>
          Continuar con {trialSelected ? 'la prueba gratis' : planTier ? `el plan ${PLAN_TIERS[planTier].name}` : 'el plan elegido'}
        </Button>
      </section>
    </AuthShell>
  )
}

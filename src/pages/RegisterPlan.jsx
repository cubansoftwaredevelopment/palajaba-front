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
  PLAN_FEATURES,
  PLAN_PRICES,
  PLAN_TAGLINE,
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
      className="mb-5 flex rounded-full border border-brand-green/15 bg-brand-white p-1 lg:mb-0"
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
        <span className="absolute -right-1 -top-2 rounded-full bg-brand-yellow px-1.5 py-0.5 text-[0.6rem] font-bold text-brand-green">
          -17%
        </span>
      </button>
    </div>
  )
}

export default function RegisterPlan() {
  const navigate = useNavigate()
  const [billing, setBilling] = useState('monthly')
  const price = PLAN_PRICES[billing]

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
          <div>
            <div className="lg:hidden">
              <BillingToggle billing={billing} onChange={setBilling} />
            </div>

            <AuthCard>
              <h2 className="mb-3 text-xs font-bold uppercase tracking-wide text-brand-green">
                Incluye
              </h2>
              <ul className="flex flex-col gap-2.5">
                {PLAN_FEATURES.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-yellow/25 text-brand-green">
                      <CheckIcon />
                    </span>
                    <span className="text-sm leading-relaxed text-brand-green">{feature}</span>
                  </li>
                ))}
              </ul>
            </AuthCard>
          </div>

          <aside className={`${authStickyAside} flex flex-col gap-4`}>
            <div className="hidden lg:block">
              <BillingToggle billing={billing} onChange={setBilling} />
            </div>

            <AuthCard>
              <div className="text-center lg:text-left">
                <p className="text-3xl font-bold text-brand-green lg:text-[2rem]">
                  {price.amount.toLocaleString('es')}
                  <span className="ml-1 text-base font-semibold text-brand-carmelita/80">
                    CUP/{price.label}
                  </span>
                </p>
                {billing === 'yearly' && (
                  <p className="mt-1.5 text-xs text-brand-carmelita/80">
                    Ahorra 2000 CUP por los mismos beneficios.
                  </p>
                )}
              </div>
            </AuthCard>

            <Button onClick={() => navigate('/registro/pago', { state: { billing } })}>
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

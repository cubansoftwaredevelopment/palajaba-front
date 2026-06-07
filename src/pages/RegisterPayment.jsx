import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import AuthCard from '../components/auth/AuthCard'
import AuthHeader from '../components/auth/AuthHeader'
import AuthShell from '../components/auth/AuthShell'
import { authPageIntro, authPaymentGrid } from '../components/auth/authStyles'
import RegisterProgress from '../components/auth/RegisterProgress'
import Button from '../components/Button'
import { PLAN_PRICES } from '../constants/plan'
import {
  PAYMENT_CARD_NUMBER,
  PAYMENT_PHONE,
  PAYMENT_QR_IMAGE,
} from '../constants/payment'

export default function RegisterPayment() {
  const navigate = useNavigate()
  const location = useLocation()
  const billing = location.state?.billing === 'yearly' ? 'yearly' : 'monthly'
  const price = PLAN_PRICES[billing]
  const [copied, setCopied] = useState(null)

  async function copyText(text, key) {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(key)
      setTimeout(() => setCopied(null), 2000)
    } catch {
      /* ignore */
    }
  }

  return (
    <AuthShell backTo="/registro" backLabel="Plan">
      <section className="animate-fade-in" aria-labelledby="payment-title">
        <div className={authPageIntro}>
          <AuthHeader
            eyebrow="Paso 2 · Pago"
            title="Realiza la transferencia"
            description={
              <>
                Transfiere{' '}
                <strong className="text-brand-green">
                  {price.amount.toLocaleString('es')} CUP
                </strong>{' '}
                para activar tu solicitud.
              </>
            }
            layout="desktop-left"
          />
          <RegisterProgress currentStep={2} />
        </div>

        <div className={authPaymentGrid}>
          <AuthCard className="flex justify-center lg:justify-start">
            <div className="rounded-xl border border-brand-green/10 bg-white p-3 shadow-sm">
              <img
                src={PAYMENT_QR_IMAGE}
                alt="Código QR para transferencia"
                width={192}
                height={192}
                className="block h-44 w-44 object-contain sm:h-48 sm:w-48 lg:h-52 lg:w-52"
              />
            </div>
          </AuthCard>

          <div className="flex flex-col gap-4">
            <AuthCard>
              <dl className="flex flex-col gap-3.5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <dt className="mb-0.5 text-[0.65rem] font-semibold uppercase tracking-wide text-brand-carmelita/80">
                      Número de tarjeta
                    </dt>
                    <dd className="font-mono text-base font-bold tracking-wider text-brand-green sm:text-lg">
                      {PAYMENT_CARD_NUMBER}
                    </dd>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyText(PAYMENT_CARD_NUMBER.replace(/\s/g, ''), 'card')}
                    className="shrink-0 rounded-lg px-2 py-1 text-xs font-semibold text-brand-green hover:bg-brand-yellow/20"
                  >
                    {copied === 'card' ? 'Copiado' : 'Copiar'}
                  </button>
                </div>
                <div className="flex items-start justify-between gap-2 border-t border-brand-green/8 pt-3.5">
                  <div>
                    <dt className="mb-0.5 text-[0.65rem] font-semibold uppercase tracking-wide text-brand-carmelita/80">
                      Teléfono a confirmar
                    </dt>
                    <dd className="text-base font-bold text-brand-green sm:text-lg">{PAYMENT_PHONE}</dd>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyText(PAYMENT_PHONE, 'phone')}
                    className="shrink-0 rounded-lg px-2 py-1 text-xs font-semibold text-brand-green hover:bg-brand-yellow/20"
                  >
                    {copied === 'phone' ? 'Copiado' : 'Copiar'}
                  </button>
                </div>
              </dl>
            </AuthCard>

            <p className="rounded-xl border border-brand-yellow/30 bg-brand-yellow/10 px-3.5 py-2.5 text-center text-sm text-brand-green lg:text-left">
              Cuando hayas transferido, confirma para completar tus datos de tienda.
            </p>

            <Button
              onClick={() => navigate('/registro/verificacion', { state: { billing } })}
            >
              Ya transferí
            </Button>
          </div>
        </div>
      </section>
    </AuthShell>
  )
}

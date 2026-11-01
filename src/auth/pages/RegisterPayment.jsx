import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import AuthCard from '../components/AuthCard'
import AuthHeader from '../components/AuthHeader'
import AuthShell from '../components/AuthShell'
import RegisterProgress from '../components/RegisterProgress'
import Button from '../../components/Button'
import { BILLING_LABELS } from '../../constants/admin'
import { usePlanPricing } from '../../lib/usePlanPricing'
import { getPlanTier, normalizeBillingPeriod, normalizePlanTier, formatPlanPriceLabel } from '../../subscriptions/constants.js'
import { createInitialSubscriptionQvaPayCheckout, fetchInitialSubscriptionQvaPayCheckout } from '../../subscriptions/api.js'
import { isSubscriptionCheckoutClosed, isSubscriptionCheckoutPaid, subscriptionCheckoutStatusMessage } from '../../subscriptions/qvapay.js'
import { getRegisterSteps } from '../constants.js'
import { PAYMENT_CARD_NUMBER, PAYMENT_PHONE, PAYMENT_QR_IMAGE } from '../../constants/payment.js'

export default function RegisterPayment() {
  const navigate = useNavigate()
  const location = useLocation()
  const planTier = normalizePlanTier(location.state?.planTier)
  const billing = normalizeBillingPeriod(location.state?.billing)
  const tier = getPlanTier(planTier)
  const { getPlanPrice, formatPlanAmount, cupPerUnit } = usePlanPricing()
  const price = getPlanPrice(planTier, billing)
  const usdEquivalent = price.amount != null && Number(cupPerUnit?.USD) > 0
    ? Number(price.amount) / Number(cupPerUnit.USD)
    : null
  const usdLabel = usdEquivalent == null
    ? '— USD'
    : `${usdEquivalent.toLocaleString('es', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD`
  const [checkout, setCheckout] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [paymentMethod, setPaymentMethod] = useState('cup')
  const [retryCount, setRetryCount] = useState(0)
  const creationRef = useRef(null)
  const checkoutPurchaseId = checkout?.purchase_id
  const checkoutStatus = checkout?.status

  useEffect(() => {
    if (paymentMethod !== 'qvapay') return undefined
    if (!['standard', 'pro', 'premium'].includes(location.state?.planTier)) {
      navigate('/registro/planes', { replace: true })
      return undefined
    }
    let stopped = false
    if (!creationRef.current) {
      creationRef.current = createInitialSubscriptionQvaPayCheckout({ planTier, billingPeriod: billing })
    }
    creationRef.current.then((result) => {
      if (!stopped) setCheckout(result)
    }).catch((err) => {
      if (!stopped) setError(err?.message || 'No pudimos crear la factura QvaPay.')
    }).finally(() => {
      if (!stopped) setLoading(false)
    })
    return () => { stopped = true }
  }, [billing, location.state?.planTier, navigate, paymentMethod, planTier, retryCount])

  useEffect(() => {
    if (paymentMethod !== 'qvapay' || !checkoutPurchaseId || isSubscriptionCheckoutClosed({ status: checkoutStatus })) return undefined
    let stopped = false
    const interval = window.setInterval(async () => {
      try {
        const result = await fetchInitialSubscriptionQvaPayCheckout(checkoutPurchaseId)
        if (!stopped) setCheckout(result)
      } catch {
        // Mantiene el último estado visible y vuelve a consultar.
      }
    }, 4000)
    return () => {
      stopped = true
      window.clearInterval(interval)
    }
  }, [checkoutPurchaseId, checkoutStatus, paymentMethod])

  function continueToDetails() {
    if (paymentMethod === 'cup') {
      navigate('/registro', {
        state: { kind: 'paid', planTier, billing, backTo: location.state?.backTo },
      })
      return
    }
    if (!isSubscriptionCheckoutPaid(checkout)) return
    navigate('/registro', {
      state: {
        kind: 'account',
        planTier,
        billing,
        qvapayPurchaseId: checkout.purchase_id,
        backTo: location.state?.backTo,
      },
    })
  }

  function retryInvoice() {
    creationRef.current = null
    setCheckout(null)
    setLoading(true)
    setError('')
    setRetryCount((count) => count + 1)
  }

  return (
    <AuthShell backTo="/registro/planes" backLabel="Plan" contentWidth="narrow">
      <section className="animate-fade-in" aria-labelledby="payment-title">
        <div className={"grid gap-4 sm:grid-cols-[minmax(0,1.2fr)_minmax(240px,0.8fr)] sm:items-center"}>
          <AuthHeader
            eyebrow="Crear cuenta"
            title="Paga tu plan"
            description={`Completa el pago de tu plan ${tier.name} para continuar con los datos de tu tienda.`}
            layout="desktop-left"
          />
          <RegisterProgress currentStep={2} steps={getRegisterSteps('paid')} className="mx-auto mb-4 w-full max-w-sm sm:mb-6" />
        </div>

        <div className="mx-auto flex w-full max-w-xl flex-col gap-4">
          <AuthCard>
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-brand-carmelita/80">Plan {tier.name} · {BILLING_LABELS[billing]}</p>
            <p className="mt-2 font-display text-3xl font-bold text-brand-green">
              {formatPlanPriceLabel(price, formatPlanAmount)}<span className="ml-1 text-sm font-semibold text-brand-carmelita/80">/{price.label}</span>
            </p>
            <p className="mt-1 text-sm font-semibold text-brand-green/80">≈ {usdLabel}/{price.label}</p>
            {paymentMethod === 'qvapay' && checkout?.invoice_amount_usd != null ? (
              <p className="mt-1 text-xs text-brand-carmelita/80">Importe exacto de la factura: {Number(checkout.invoice_amount_usd).toLocaleString('es', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD</p>
            ) : null}
            <p className="mt-2 text-sm leading-relaxed text-brand-carmelita/85">Escoge cómo pagar tu suscripción. Con QvaPay la tienda se activa al confirmarse el pago; por transferencia CUP, la solicitud sigue el proceso de confirmación actual.</p>
          </AuthCard>

          <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Método de pago de la suscripción">
            {[
              { id: 'cup', title: 'Transferencia en CUP', detail: 'Usar el proceso actual de transferencia y confirmación.' },
              { id: 'qvapay', title: 'Pagar por QvaPay', detail: 'Factura digital y activación automática al confirmar el pago.' },
            ].map((method) => (
              <button key={method.id} type="button" role="radio" aria-checked={paymentMethod === method.id} onClick={() => setPaymentMethod(method.id)} className={`rounded-2xl border p-4 text-left transition ${paymentMethod === method.id ? 'border-brand-green bg-brand-green/5 ring-2 ring-brand-green/20' : 'border-brand-green/15 bg-brand-white hover:border-brand-green/35'}`}>
                <span className="block font-semibold text-brand-green">{method.title}</span>
                <span className="mt-1 block text-xs leading-relaxed text-brand-carmelita/80">{method.detail}</span>
              </button>
            ))}
          </div>

          {paymentMethod === 'cup' ? (
            <div className="grid gap-4 sm:grid-cols-[auto_1fr]">
              <AuthCard className="flex items-center justify-center">
                <img src={PAYMENT_QR_IMAGE} alt="Código QR para transferencia en CUP" width={192} height={192} className="h-44 w-44 object-contain sm:h-48 sm:w-48" />
              </AuthCard>
              <AuthCard className="flex flex-col justify-between gap-4">
                <dl className="flex flex-col gap-3 text-sm">
                  <div className="flex items-start justify-between gap-3"><dt className="text-brand-carmelita/80">Número de tarjeta</dt><dd className="font-mono font-bold text-brand-green">{PAYMENT_CARD_NUMBER}</dd></div>
                  <div className="flex items-start justify-between gap-3 border-t border-brand-green/10 pt-3"><dt className="text-brand-carmelita/80">Teléfono a confirmar</dt><dd className="font-semibold text-brand-green">{PAYMENT_PHONE}</dd></div>
                </dl>
                <p className="text-sm leading-relaxed text-brand-carmelita/85">Transfiere el importe indicado y, en el siguiente paso, escribe el identificador de la transferencia para que podamos revisarla.</p>
                <Button type="button" onClick={continueToDetails}>Continuar con mis datos</Button>
              </AuthCard>
            </div>
          ) : (
            <AuthCard className="flex flex-col gap-3">
              {loading ? <p className="py-3 text-center text-sm text-brand-carmelita/80" role="status">Preparando factura QvaPay…</p> : null}
              {error ? <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700" role="alert">{error}</p> : null}
              {checkout?.payment_url && checkout.status === 'pending' ? (
                <a href={checkout.payment_url} target="_blank" rel="noreferrer" className="inline-flex min-h-12 items-center justify-center rounded-xl bg-brand-green px-4 py-3 text-center text-sm font-bold text-brand-white shadow-sm transition hover:bg-brand-green/90">Abrir factura QvaPay</a>
              ) : null}
              {checkout ? <p className={`text-center text-sm ${isSubscriptionCheckoutPaid(checkout) ? 'font-semibold text-brand-green' : 'text-brand-carmelita/80'}`} role="status">{subscriptionCheckoutStatusMessage(checkout)}</p> : null}
              <div className="flex w-full flex-row gap-3">
                {checkout && isSubscriptionCheckoutClosed(checkout) && !isSubscriptionCheckoutPaid(checkout) ? (
                  <Button type="button" className="min-w-0 flex-1 px-2 text-xs sm:text-sm" onClick={retryInvoice}>Solicitar otra factura</Button>
                ) : null}
                {!checkout?.purchase_id && !loading && error ? (
                  <Button type="button" className="min-w-0 flex-1 px-2 text-xs sm:text-sm" onClick={retryInvoice}>Reintentar</Button>
                ) : null}
                <Button type="button" className="min-w-0 flex-1 px-2 text-xs sm:text-sm" disabled={!isSubscriptionCheckoutPaid(checkout)} onClick={continueToDetails}>Continuar con mis datos</Button>
              </div>
            </AuthCard>
          )}
        </div>
      </section>
    </AuthShell>
  )
}

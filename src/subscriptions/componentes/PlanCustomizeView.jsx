import { useEffect, useMemo, useRef, useState } from 'react'
import AuthHeader from '../../auth/componentes/AuthHeader.jsx'
import AuthShell from '../../auth/componentes/AuthShell.jsx'
import Button from '../../shared/componentes/Button.jsx'
import { formatPlanAmount } from '../utils/constants.js'
import { PLAN_PLUGINS, pluginPeriodUsd, pluginUnitUsd } from '../utils/planPlugins.js'
import { usePlanPricing } from '../utils/usePlanPricing.js'
import { isSubscriptionCheckoutPaid, subscriptionCheckoutStatusMessage } from '../qvapay.js'
import { PAYMENT_CARD_NUMBER, PAYMENT_PHONE, PAYMENT_QR_IMAGE } from '../utils/payment.js'
import BillingPeriodTabs from './BillingPeriodTabs.jsx'
import CountingAmount from './CountingAmount.jsx'

function moneyUsd(value) {
  return `${Number(value || 0).toLocaleString('es', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD`
}

function cupFromUsd(usd, rate) {
  if (!(rate > 0)) return null
  return Math.round(Number(usd || 0) * rate)
}

function moneyCup(usd, rate) {
  const amount = cupFromUsd(usd, rate)
  if (amount == null) return '—'
  return formatPlanAmount(amount, 'CUP')
}

export default function PlanCustomizeView({
  backTo = '/registro/planes',
  onBack,
  eyebrow = 'Crear cuenta',
  title = 'Personalización de plan',
  description = 'Elige las funciones y revisa cada precio en USD y CUP.',
  progress = null,
  initialBilling = 'monthly',
  billingLocked = false,
  cupButtonLabel = 'Continuar a tus datos',
  paidButtonLabel = 'Ya pagué, continuar',
  confirmCheckout = null,
  onPay,
  onRefresh,
  onContinue,
  showError = () => {},
  statusMessage = '',
  ownedPluginIds = [],
  ownedQuantities = {},
  unlimitedPluginIds = [],
  planName = '',
}) {
  const { pluginPrices, cupPerUnit, qvapayPlanDiscountPercent } = usePlanPricing()
  const [billing, setBilling] = useState(initialBilling)
  const [basket, setBasket] = useState({})
  const [checkingOut, setCheckingOut] = useState(false)
  const [awaitingConfirm, setAwaitingConfirm] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState('qvapay')
  const [transferId, setTransferId] = useState('')
  const [checkout, setCheckout] = useState(null)
  const [loading, setLoading] = useState(false)
  const checkoutRef = useRef(null)

  function ownedCount(id) {
    const value = Number(ownedQuantities?.[id] || 0)
    return Number.isFinite(value) && value > 0 ? value : 0
  }

  const lines = useMemo(() => PLAN_PLUGINS.map((plugin) => {
    const extra = Number(basket[plugin.id] || 0)
    const owned = plugin.quantity ? Math.max(0, Number(ownedQuantities?.[plugin.id] || 0)) : 0
    return {
      ...plugin,
      count: extra,
      shown: plugin.quantity ? owned + extra : extra,
      owned,
      baseUsd: pluginUnitUsd(pluginPrices, plugin.id),
    }
  }), [basket, ownedQuantities, pluginPrices])

  const chosen = lines.filter((line) => line.count > 0)
  const totalUsd = chosen.reduce((sum, line) => sum + pluginPeriodUsd(pluginPrices, line.id, billing, line.count), 0)
  const rate = Number(cupPerUnit?.USD) || 0
  const qvapayUsd = qvapayPlanDiscountPercent > 0
    ? Math.round(totalUsd * (100 - qvapayPlanDiscountPercent)) / 100
    : totalUsd

  useEffect(() => {
    setBilling(initialBilling)
  }, [initialBilling])

  useEffect(() => {
    if (!checkingOut) return
    const node = checkoutRef.current
    if (!node) return
    const scroller = node.closest('.page-scroll')
    if (!scroller) {
      node.scrollIntoView({ behavior: 'smooth', block: 'start' })
      return
    }
    const top = node.getBoundingClientRect().top - scroller.getBoundingClientRect().top + scroller.scrollTop
    scroller.scrollTo({ top: Math.max(0, top - 16), behavior: 'smooth' })
  }, [checkingOut])

  function ownsPlugin(id) {
    return ownedPluginIds.includes(id)
  }

  function customersReady(source) {
    return ownsPlugin('customers') || Number(source?.customers || 0) > 0
  }

  function isUnlimited(id) {
    return unlimitedPluginIds.includes(id)
  }

  function setQuantity(plugin, next) {
    if (isUnlimited(plugin.id)) return
    if (!plugin.quantity && (ownsPlugin(plugin.id) || ownedCount(plugin.id) > 0)) return
    const owned = plugin.quantity ? ownedCount(plugin.id) : 0
    const shown = plugin.quantity ? Math.max(owned, next) : (next > 0 ? 1 : 0)
    const quantity = plugin.quantity ? shown - owned : shown
    if (plugin.id === 'customer_notices' && quantity > 0 && !customersReady(basket)) {
      showError('Agrega Clientes antes de elegir Avisos a clientes.')
      return
    }
    setBasket((current) => {
      const nextBasket = { ...current, [plugin.id]: quantity }
      if (plugin.id === 'customers' && quantity === 0 && !ownsPlugin('customers')) {
        nextBasket.customer_notices = 0
      }
      return nextBasket
    })
    setCheckout(null)
  }

  function openCheckout() {
    setAwaitingConfirm(false)
    setCheckingOut(true)
  }

  async function pay() {
    if (!chosen.length) {
      showError('Agrega al menos una función a la jaba.')
      return
    }
    if (paymentMethod === 'cup' && !transferId.trim()) {
      showError('Escribe el ID de la transferencia.')
      return
    }
    setLoading(true)
    showError('')
    try {
      const plugins = Object.fromEntries(chosen.map((line) => [line.id, line.count]))
      if (paymentMethod === 'qvapay' && checkout?.payment_url && !isSubscriptionCheckoutPaid(checkout)) {
        window.open(checkout.payment_url, '_blank', 'noopener,noreferrer')
        return
      }
      if (paymentMethod === 'qvapay' && isSubscriptionCheckoutPaid(checkout)) {
        onContinue?.(checkout, 'qvapay', billing)
        return
      }
      const result = await onPay({
        billing,
        plugins,
        paymentMethod,
        transferId: transferId.trim(),
        checkout,
      })
      setCheckout(result)
      if (paymentMethod === 'cup') {
        setBasket({})
        setTransferId('')
        setCheckingOut(false)
        onContinue?.(result, 'cup', billing)
        return
      }
      if (result?.payment_url) window.open(result.payment_url, '_blank', 'noopener,noreferrer')
    } catch (err) {
      showError(err?.message || 'No pudimos preparar el pago.')
    } finally {
      setLoading(false)
    }
  }

  async function refreshInvoice() {
    if (!checkout?.purchase_id || !onRefresh) return
    try {
      const result = await onRefresh(checkout.purchase_id)
      setCheckout((current) => ({ ...current, ...result }))
      if (isSubscriptionCheckoutPaid(result)) {
        setBasket({})
        setCheckingOut(false)
        onContinue?.(result, 'qvapay', billing)
      }
    } catch (err) {
      showError(err?.message || 'No pudimos consultar la factura.')
    }
  }

  return (
    <AuthShell backTo={backTo} onBack={onBack} backLabel="Volver" contentWidth="plans">
      <section className="animate-fade-in">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(250px,0.8fr)] lg:items-center">
          <AuthHeader eyebrow={eyebrow} title={title} description={description} layout="desktop-left" />
          {progress}
        </div>
        <div className="mt-2 max-w-md">
          <BillingPeriodTabs
            value={billing}
            onChange={(period) => {
              if (billingLocked) return
              setBilling(period)
              setCheckout(null)
            }}
          />
        </div>
        <div className="mt-5 grid min-w-0 items-start gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.8fr)]">
          <ul className="flex min-w-0 snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain pb-1 touch-pan-x [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:flex-col lg:overflow-visible lg:pb-0">
            {lines.map((plugin) => (
              <li key={plugin.id} className="flex w-[78%] max-w-[18rem] shrink-0 snap-start flex-row items-center justify-between gap-3 rounded-2xl border border-brand-green/12 bg-brand-white p-4 lg:w-auto lg:max-w-none lg:shrink">
                <div className="min-w-0">
                  <p className="font-semibold text-brand-green">{plugin.label}</p>
                  {isUnlimited(plugin.id) ? (
                    <p className="text-xs font-semibold uppercase tracking-wide text-brand-green/80">Plan {planName}</p>
                  ) : (
                    <>
                      <p className="text-sm text-brand-carmelita/80">{moneyUsd(plugin.baseUsd)}{plugin.quantity ? ' por unidad' : ''}</p>
                      <p className="text-xs font-semibold text-brand-carmelita/60">{moneyCup(plugin.baseUsd, rate)}{plugin.quantity ? ' por unidad' : ''}</p>
                      {plugin.owned > 0 ? (
                        <p className="text-xs font-semibold uppercase tracking-wide text-brand-green/80">Plan {planName}</p>
                      ) : null}
                    </>
                  )}
                  {plugin.id === 'customer_notices' && !customersReady(basket) ? (
                    <p className="mt-1 text-xs font-semibold text-brand-carmelita/70">Requiere Clientes</p>
                  ) : null}
                </div>
                {isUnlimited(plugin.id) ? (
                  <span className="ml-auto shrink-0 text-sm font-semibold text-brand-green">Ilimitado</span>
                ) : plugin.quantity ? (
                  <div className="ml-auto flex shrink-0 items-center gap-2">
                    <button
                      type="button"
                      className={`h-9 w-9 rounded-full border font-bold ${plugin.shown <= plugin.owned ? 'cursor-not-allowed border-zinc-200 text-zinc-300' : 'border-brand-green/20 text-brand-green'}`}
                      onClick={() => setQuantity(plugin, plugin.shown - 1)}
                      disabled={plugin.shown <= plugin.owned}
                      aria-label={`Quitar ${plugin.label}`}
                    >
                      −
                    </button>
                    <span className="w-6 text-center font-semibold tabular-nums text-brand-green">{plugin.shown}</span>
                    <button type="button" className="h-9 w-9 rounded-full bg-brand-green font-bold text-brand-white" onClick={() => setQuantity(plugin, plugin.shown + 1)} aria-label={`Agregar ${plugin.label}`}>+</button>
                  </div>
                ) : (
                  <button
                    type="button"
                    disabled={ownsPlugin(plugin.id)}
                    className={`ml-auto shrink-0 rounded-full px-4 py-2 text-sm font-semibold ${
                      ownsPlugin(plugin.id)
                        ? 'cursor-not-allowed bg-zinc-200 text-zinc-400'
                        : plugin.count
                          ? 'bg-brand-green/10 text-brand-green'
                          : 'bg-brand-green text-brand-white'
                    }`}
                    onClick={() => setQuantity(plugin, plugin.count ? 0 : 1)}
                  >
                    {ownsPlugin(plugin.id) || !plugin.count ? 'Agregar' : 'Quitar'}
                  </button>
                )}
              </li>
            ))}
          </ul>
          <aside className="rounded-2xl border border-brand-green/15 bg-brand-white p-4 lg:sticky lg:top-4">
            <h2 className="font-display text-xl font-bold text-brand-green">Jaba</h2>
            {chosen.length ? (
              <ul className="mt-3 flex flex-col gap-2">
                {chosen.map((line) => {
                  const lineUsd = pluginPeriodUsd(pluginPrices, line.id, billing, line.count)
                  const lineCup = cupFromUsd(lineUsd, rate)
                  return (
                    <li key={line.id} className="flex items-start justify-between gap-3 text-sm">
                      <span className="text-brand-carmelita">{line.label}{line.quantity ? ` × ${line.count}` : ''}</span>
                      <span className="text-right">
                        <span className="block font-semibold text-brand-green">
                          <CountingAmount value={lineUsd} currency="USD" fractionDigits={2} fromZero />
                        </span>
                        <span className="block text-xs font-semibold text-brand-carmelita/70">
                          {lineCup == null ? '—' : <CountingAmount value={lineCup} currency="CUP" fractionDigits={0} fromZero />}
                        </span>
                      </span>
                    </li>
                  )
                })}
              </ul>
            ) : <p className="mt-3 text-sm text-brand-carmelita/75">Todavía no agregas funciones.</p>}
            <div className="mt-4">
              <p className="text-sm font-semibold text-brand-green">
                Total <CountingAmount value={totalUsd} currency="USD" fractionDigits={2} />
              </p>
              <p className="text-xs font-semibold text-brand-carmelita/70">
                {cupFromUsd(totalUsd, rate) == null ? '—' : <CountingAmount value={cupFromUsd(totalUsd, rate)} currency="CUP" fractionDigits={0} />}
              </p>
            </div>
            {statusMessage ? <p className="mt-3 text-sm font-semibold text-brand-green">{statusMessage}</p> : null}
            <Button
              type="button"
              className="mt-4 w-full"
              disabled={!chosen.length}
              onClick={() => {
                showError('')
                if (confirmCheckout) setAwaitingConfirm(true)
                else setCheckingOut(true)
              }}
            >
              Ir a pagar
            </Button>
            {checkingOut ? (
              <div ref={checkoutRef} className="mt-4 flex flex-col gap-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  {[
                    { id: 'qvapay', title: 'Factura QvaPay' },
                    { id: 'cup', title: 'Transferencia en CUP' },
                  ].map((method) => (
                    <button key={method.id} type="button" onClick={() => { setPaymentMethod(method.id); setCheckout(null) }} className={`rounded-2xl border p-4 text-left font-semibold ${paymentMethod === method.id ? 'border-brand-green bg-brand-green/5 ring-2 ring-brand-green/20' : 'border-brand-green/15 bg-brand-white'}`}>
                      {method.title}
                    </button>
                  ))}
                </div>
                {paymentMethod === 'cup' ? (
                  <div className="flex flex-col gap-3">
                    <img src={PAYMENT_QR_IMAGE} alt="Código QR para transferencia en CUP" width={192} height={192} className="h-44 w-44 object-contain" />
                    <p className="text-sm text-brand-carmelita/80">Tarjeta {PAYMENT_CARD_NUMBER}</p>
                    <p className="text-sm text-brand-carmelita/80">Teléfono {PAYMENT_PHONE}</p>
                    <label htmlFor="custom-transfer-id" className="text-sm font-semibold text-brand-green">ID de la transferencia</label>
                    <input id="custom-transfer-id" value={transferId} onChange={(event) => setTransferId(event.target.value)} className="w-full rounded-xl border border-brand-green/20 px-3 py-3 text-sm text-brand-green outline-none" placeholder="Ej. 1234567890" />
                    <Button type="button" disabled={loading} onClick={pay}>{loading ? 'Guardando…' : cupButtonLabel}</Button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {qvapayPlanDiscountPercent > 0 ? (
                      <div>
                        <p className="text-sm font-semibold text-brand-green">
                          Descuento QvaPay {Number(qvapayPlanDiscountPercent).toLocaleString('es', { maximumFractionDigits: 2 })}%
                        </p>
                        <p className="mt-1 text-xs font-semibold text-brand-carmelita/55 line-through">
                          <CountingAmount value={totalUsd} currency="USD" fractionDigits={2} />
                        </p>
                        <p className="text-sm font-semibold text-brand-green">
                          <CountingAmount value={qvapayUsd} currency="USD" fractionDigits={2} />
                        </p>
                      </div>
                    ) : null}
                    <Button type="button" disabled={loading || !chosen.length} onClick={pay}>{loading ? 'Creando factura…' : checkout?.payment_url ? 'Abrir factura otra vez' : 'Crear factura QvaPay'}</Button>
                    {checkout ? <p className="text-sm text-brand-carmelita/80">{subscriptionCheckoutStatusMessage(checkout)}</p> : null}
                    {checkout?.purchase_id && !isSubscriptionCheckoutPaid(checkout) ? (
                      <Button type="button" onClick={refreshInvoice}>{paidButtonLabel}</Button>
                    ) : null}
                  </div>
                )}
              </div>
            ) : null}
          </aside>
        </div>
      </section>
      {awaitingConfirm && confirmCheckout ? confirmCheckout({ proceed: openCheckout, cancel: () => setAwaitingConfirm(false) }) : null}
    </AuthShell>
  )
}

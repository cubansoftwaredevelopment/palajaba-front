import { useEffect, useMemo, useState } from 'react'
import { ORDER_STATUS_LABELS } from '../../constants/orderStatus'
import { formatOrderDateTime } from '../../lib/dates'
import { convertBetweenCurrencies } from '../../lib/displayPrice'
import { loadExchangeRates, getCupPerUnit } from '../../lib/exchangeRates'
import { formatPrice, parseCupInput } from '../../lib/money'
import SellerModalPortal from './SellerModalPortal'
import {
  sellerAlertError,
  sellerAlertSuccess,
  sellerBtnDanger,
  sellerBtnPrimary,
  sellerBtnSecondary,
  sellerHint,
  sellerIconBtn,
  sellerIconBtnDanger,
  sellerInput,
  sellerLabel,
  sellerModalOverlay,
  sellerModalSheet,
  sellerModalTitle,
} from './sellerStyles'

const PAYMENT_CURRENCIES = ['CUP', 'USD', 'EUR', 'MLC']

function DetailRow({ label, children }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-brand-green/8 py-3 last:border-b-0">
      <dt className={`shrink-0 ${sellerLabel}`}>{label}</dt>
      <dd className="min-w-0 text-right text-sm font-medium text-brand-green">{children}</dd>
    </div>
  )
}

function calcPaymentTotal(order, items, paymentCurrency, deliveryPreview, cupPerUnit) {
  if (!paymentCurrency) return null

  let total = 0
  for (const item of items) {
    total += convertBetweenCurrencies(
      item.unit_price * item.quantity,
      item.currency,
      paymentCurrency,
      cupPerUnit,
    )
  }

  const deliveryPrice = deliveryPreview?.price ?? order.delivery_price
  const deliveryCurrency = deliveryPreview?.currency ?? order.delivery_currency ?? 'CUP'

  if (order.delivery_requested && deliveryPrice != null) {
    total += convertBetweenCurrencies(deliveryPrice, deliveryCurrency, paymentCurrency, cupPerUnit)
  }

  return total
}

export default function SellerOrderDetailModal({
  order,
  saving,
  cancelling,
  downloading,
  error,
  onClose,
  onSave,
  onCancel,
  onDownloadInvoice,
}) {
  const [editableItems, setEditableItems] = useState(order.items)
  const [deliveryPrice, setDeliveryPrice] = useState(
    order.delivery_price != null ? String(Math.round(order.delivery_price)) : '',
  )
  const [deliveryCurrency, setDeliveryCurrency] = useState(order.delivery_currency ?? 'CUP')
  const [paymentCurrency, setPaymentCurrency] = useState(order.payment_currency ?? '')
  const [localError, setLocalError] = useState('')
  const [confirmCancel, setConfirmCancel] = useState(false)
  const [cupPerUnit, setCupPerUnit] = useState(getCupPerUnit)

  useEffect(() => {
    loadExchangeRates()
      .then(() => setCupPerUnit(getCupPerUnit()))
      .catch(() => {})
  }, [])

  useEffect(() => {
    setEditableItems(order.items)
    setDeliveryPrice(order.delivery_price != null ? String(Math.round(order.delivery_price)) : '')
    setDeliveryCurrency(order.delivery_currency ?? 'CUP')
    setPaymentCurrency(order.payment_currency ?? '')
    setLocalError('')
    setConfirmCancel(false)
  }, [order])

  useEffect(() => {
    function onKeyDown(event) {
      if (event.key === 'Escape') onClose()
    }

    document.addEventListener('keydown', onKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = ''
    }
  }, [onClose])

  const isPending = order.status === 'pending_confirmation'
  const canEditItems = isPending
  const resolvedPaymentCurrency = paymentCurrency || order.payment_currency || null

  const itemsDirty = useMemo(() => {
    if (order.items.length !== editableItems.length) return true
    return editableItems.some((item, index) => {
      const original = order.items[index]
      return (
        item.product_id !== original.product_id
        || item.quantity !== original.quantity
      )
    })
  }, [editableItems, order.items])

  const paymentDirty = paymentCurrency !== (order.payment_currency ?? '')
  const hasPendingChanges = itemsDirty || paymentDirty

  const deliveryPreview = useMemo(() => {
    if (!order.delivery_requested || !isPending) return null
    const parsed = parseCupInput(deliveryPrice)
    if (parsed == null) return null
    return { price: parsed, currency: deliveryCurrency }
  }, [order.delivery_requested, isPending, deliveryPrice, deliveryCurrency])

  const paymentTotal = useMemo(
    () => calcPaymentTotal(order, editableItems, resolvedPaymentCurrency, deliveryPreview, cupPerUnit),
    [order, editableItems, resolvedPaymentCurrency, deliveryPreview, cupPerUnit],
  )

  function updateItemQuantity(productId, delta) {
    setEditableItems((current) =>
      current.map((item) => {
        if (item.product_id !== productId) return item
        const nextQuantity = Math.min(99, Math.max(1, item.quantity + delta))
        return { ...item, quantity: nextQuantity, line_total: item.unit_price * nextQuantity }
      }),
    )
    setLocalError('')
  }

  function removeItem(productId) {
    if (editableItems.length <= 1) {
      setLocalError('El pedido debe tener al menos un producto.')
      return
    }
    setEditableItems((current) => current.filter((item) => item.product_id !== productId))
    setLocalError('')
  }

  function buildItemsPayload() {
    return editableItems.map((item) => ({
      product_id: item.product_id,
      name: item.name,
      quantity: item.quantity,
      unit_price: item.unit_price,
      currency: item.currency,
    }))
  }

  function handleSaveChanges() {
    if (editableItems.length === 0) {
      setLocalError('El pedido debe tener al menos un producto.')
      return
    }

    const payload = {}
    if (itemsDirty) payload.items = buildItemsPayload()
    if (paymentDirty && paymentCurrency) payload.payment_currency = paymentCurrency

    if (!Object.keys(payload).length) return

    setLocalError('')
    onSave(payload)
  }

  function handleComplete() {
    const payload = { status: 'completed' }
    setLocalError('')

    if (!resolvedPaymentCurrency) {
      setLocalError('Selecciona la moneda de pago antes de marcar el pedido como realizado.')
      return
    }

    if (paymentDirty || !order.payment_currency) {
      payload.payment_currency = resolvedPaymentCurrency
    }

    if (itemsDirty) {
      payload.items = buildItemsPayload()
    }

    if (order.delivery_requested) {
      const parsed = parseCupInput(deliveryPrice)
      if (parsed == null) {
        setLocalError('Indica un precio válido para el domicilio.')
        return
      }
      payload.delivery_price = parsed
      payload.delivery_currency = deliveryCurrency
    }

    onSave(payload)
  }

  function handleDownload(type) {
    if (!resolvedPaymentCurrency) {
      setLocalError('Selecciona y guarda la moneda de pago antes de generar la factura.')
      return
    }

    if (hasPendingChanges) {
      setLocalError('Guarda los cambios del pedido antes de generar la factura.')
      return
    }

    setLocalError('')
    onDownloadInvoice(type)
  }

  return (
    <SellerModalPortal>
      <div
        className={sellerModalOverlay}
        role="presentation"
        onMouseDown={(event) => {
          if (event.target === event.currentTarget) onClose()
        }}
      >
        <div
          role="dialog"
          aria-modal="true"
          className={`${sellerModalSheet} h-[min(92dvh,760px)]`}
        >
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-brand-green/8 px-5 py-4">
          <div>
            <h2 className={sellerModalTitle}>Pedido #{order.id.slice(-6).toUpperCase()}</h2>
            <p className="mt-0.5 text-xs text-brand-carmelita/80">{formatOrderDateTime(order.created_at)}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full text-brand-green active:bg-brand-green/8"
            aria-label="Cerrar"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.08em] text-brand-carmelita/75">
            {ORDER_STATUS_LABELS[order.status]}
          </p>

          <div className="rounded-2xl border border-brand-green/10 bg-brand-green/[0.02] px-4">
            {canEditItems ? (
              <ul className="divide-y divide-brand-green/8">
                {editableItems.map((item) => (
                  <li key={item.product_id} className="py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-brand-green">{item.name}</p>
                        <p className="mt-0.5 text-xs text-brand-carmelita/85">
                          {formatPrice(item.unit_price, item.currency)} c/u
                        </p>
                        {resolvedPaymentCurrency && resolvedPaymentCurrency !== item.currency ? (
                          <p className="mt-0.5 text-xs text-brand-carmelita/70">
                            ≈ {formatPrice(
                              convertBetweenCurrencies(
                                item.unit_price * item.quantity,
                                item.currency,
                                resolvedPaymentCurrency,
                                cupPerUnit,
                              ),
                              resolvedPaymentCurrency,
                            )}
                          </p>
                        ) : null}
                      </div>
                      <div className="flex shrink-0 items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => updateItemQuantity(item.product_id, -1)}
                          disabled={item.quantity <= 1}
                          className={sellerIconBtn}
                          aria-label={`Menos ${item.name}`}
                        >
                          −
                        </button>
                        <span className="min-w-[1.5rem] text-center text-sm font-bold text-brand-green">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateItemQuantity(item.product_id, 1)}
                          disabled={item.quantity >= 99}
                          className={sellerIconBtn}
                          aria-label={`Más ${item.name}`}
                        >
                          +
                        </button>
                        <button
                          type="button"
                          onClick={() => removeItem(item.product_id)}
                          className={sellerIconBtnDanger}
                          aria-label={`Quitar ${item.name}`}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                            <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14Z" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <dl>
                {order.items.map((item) => (
                  <DetailRow key={item.product_id} label={`${item.name} x${item.quantity}`}>
                    {formatPrice(item.line_total, item.currency)}
                  </DetailRow>
                ))}
              </dl>
            )}
          </div>

          {canEditItems ? (
            <p className={`mt-2 ${sellerHint}`}>
              Ajusta cantidades o quita productos si el cliente cambió de opinión.
            </p>
          ) : null}

          <div className="mt-4">
            <label htmlFor="payment-currency" className={sellerLabel}>
              Moneda de pago
            </label>
            <select
              id="payment-currency"
              value={paymentCurrency}
              onChange={(event) => {
                setPaymentCurrency(event.target.value)
                setLocalError('')
              }}
              disabled={!isPending}
              className={sellerInput}
            >
              <option value="">Seleccionar…</option>
              {PAYMENT_CURRENCIES.map((currency) => (
                <option key={currency} value={currency}>
                  {currency}
                </option>
              ))}
            </select>
            {order.payment_currency && !paymentDirty ? (
              <p className={`mt-1.5 ${sellerHint}`}>
                El comprador pidió en {order.payment_currency}; los precios del pedido ya están en esa moneda.
              </p>
            ) : null}
            {paymentTotal != null ? (
              <p className={`mt-2 ${sellerAlertSuccess}`}>
                Total en {resolvedPaymentCurrency}: {formatPrice(paymentTotal, resolvedPaymentCurrency)}
              </p>
            ) : null}
          </div>

          {order.buyer_zone ? (
            <p className="mt-3 text-xs text-brand-carmelita/85">
              Zona del comprador: {order.buyer_zone.municipality_name}, {order.buyer_zone.province_name}
            </p>
          ) : null}

          {order.delivery_requested && order.delivery ? (
            <div className="mt-4 rounded-2xl border border-brand-green/10 bg-brand-yellow/10 px-4 py-3">
              <p className="text-sm font-bold text-brand-green">Entrega a domicilio</p>
              <dl className="mt-2 space-y-1 text-xs text-brand-carmelita/90">
                <div>
                  <span className="font-semibold text-brand-green">Recibe:</span> {order.delivery.recipient_name}
                </div>
                <div>
                  <span className="font-semibold text-brand-green">Dirección:</span> {order.delivery.address}
                </div>
                <div>
                  <span className="font-semibold text-brand-green">Contacto:</span> {order.delivery.phone_primary}
                  {order.delivery.phone_secondary ? `, ${order.delivery.phone_secondary}` : ''}
                </div>
                {order.delivery.notes ? (
                  <div>
                    <span className="font-semibold text-brand-green">Detalles:</span> {order.delivery.notes}
                  </div>
                ) : null}
              </dl>
            </div>
          ) : null}

          {order.delivery_requested && isPending ? (
            <div className="mt-4 grid grid-cols-[1fr_auto] gap-2">
              <div>
                <label htmlFor="delivery-price" className={sellerLabel}>
                  Precio del domicilio
                </label>
                <input
                  id="delivery-price"
                  type="text"
                  inputMode="numeric"
                  value={deliveryPrice}
                  onChange={(event) => setDeliveryPrice(event.target.value)}
                  className={sellerInput}
                  placeholder="Ej. 500"
                />
              </div>
              <div>
                <label htmlFor="delivery-currency" className={sellerLabel}>
                  Moneda
                </label>
                <select
                  id="delivery-currency"
                  value={deliveryCurrency}
                  onChange={(event) => setDeliveryCurrency(event.target.value)}
                  className={sellerInput}
                >
                  <option value="CUP">CUP</option>
                  <option value="USD">USD</option>
                  <option value="MLC">MLC</option>
                </select>
              </div>
              <p className={`col-span-2 ${sellerHint}`}>
                Agrega el costo del domicilio antes de marcar el pedido como realizado.
              </p>
            </div>
          ) : null}

          {order.delivery_requested && !isPending && order.delivery_price != null ? (
            <p className={`mt-4 ${sellerAlertSuccess}`}>
              Domicilio: {formatPrice(order.delivery_price, order.delivery_currency ?? 'CUP')}
            </p>
          ) : null}

          <div
            className={`mt-4 grid grid-cols-1 gap-2 ${order.delivery_requested ? 'sm:grid-cols-2' : ''}`}
          >
            <button
              type="button"
              onClick={() => handleDownload('store')}
              disabled={Boolean(downloading) || saving}
              className={sellerBtnSecondary}
            >
              {downloading === 'store' ? 'Generando…' : 'Factura tienda'}
            </button>
            {order.delivery_requested ? (
              <button
                type="button"
                onClick={() => handleDownload('transporter')}
                disabled={Boolean(downloading) || saving}
                className={sellerBtnSecondary}
              >
                {downloading === 'transporter' ? 'Generando…' : 'Hoja transportista'}
              </button>
            ) : null}
          </div>
          {order.delivery_requested ? (
            <p className={`mt-2 ${sellerHint}`}>
              La hoja para el transportista incluye dirección, productos y total a cobrar.
            </p>
          ) : null}

          {isPending ? (
            <div className="mt-5 rounded-2xl border border-dashed border-brand-green/18 bg-gradient-to-br from-brand-green/[0.03] to-brand-white px-4 py-4">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-yellow/25 text-brand-carmelita">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
                    <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
                    <path d="M3 6h18" />
                    <path d="M16 10a4 4 0 0 1-8 0" />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-brand-green">¿La compra no se concretó?</p>
                  <p className="mt-1 text-xs leading-relaxed text-brand-carmelita/85">
                    Si el cliente no confirmó por WhatsApp, puedes quitar el pedido de tu bandeja.
                  </p>
                  <button
                    type="button"
                    onClick={() => setConfirmCancel(true)}
                    disabled={saving || cancelling}
                    className={`mt-3 ${sellerBtnSecondary} !border-brand-carmelita/20 !text-brand-carmelita active:!bg-brand-carmelita/8`}
                  >
                    Cancelar pedido
                  </button>
                </div>
              </div>
            </div>
          ) : null}

          {localError || error ? (
            <p className="mt-4 rounded-xl border border-brand-carmelita/25 bg-brand-carmelita/10 px-3 py-2 text-sm text-brand-carmelita">
              {localError || error}
            </p>
          ) : null}
        </div>

        <div className="shrink-0 flex flex-col gap-2 border-t border-brand-green/8 px-5 py-4 pb-[max(1rem,var(--safe-bottom))]">
          {isPending && hasPendingChanges ? (
            <button
              type="button"
              onClick={handleSaveChanges}
              disabled={saving}
              className={sellerBtnSecondary}
            >
              {saving ? 'Guardando…' : 'Guardar cambios'}
            </button>
          ) : null}
          {isPending ? (
            <button type="button" onClick={handleComplete} disabled={saving || cancelling} className={sellerBtnPrimary}>
              {saving ? 'Guardando…' : 'Marcar realizada'}
            </button>
          ) : (
            <span className={`flex items-center justify-center rounded-xl px-3 py-2.5 text-center text-xs font-semibold ${sellerAlertSuccess}`}>
              Pedido cerrado
            </span>
          )}
          <button type="button" onClick={onClose} disabled={cancelling} className={sellerBtnSecondary}>
            Cerrar
          </button>
        </div>

        {confirmCancel ? (
          <div
            className="absolute inset-0 z-10 flex items-end justify-center bg-brand-green/25 p-4 backdrop-blur-[3px] sm:items-center"
            role="presentation"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget && !cancelling) setConfirmCancel(false)
            }}
          >
            <div
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="cancel-order-title"
              className="w-full max-w-sm animate-fade-in rounded-3xl border border-brand-green/12 bg-brand-white p-5 shadow-[0_20px_50px_rgba(89,128,44,0.22)]"
              onMouseDown={(event) => event.stopPropagation()}
            >
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-yellow/25 text-brand-carmelita">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
                  <path d="M3 6h18" />
                  <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                  <path d="M10 11v6M14 11v6" />
                </svg>
              </div>
              <h3 id="cancel-order-title" className="text-center font-display text-xl font-bold text-brand-green">
                ¿Eliminar pedido?
              </h3>
              <p className="mt-2 text-center text-sm leading-relaxed text-brand-carmelita/90">
                Se quitará el pedido{' '}
                <span className="font-semibold text-brand-green">#{order.id.slice(-6).toUpperCase()}</span>{' '}
                de tu bandeja. Úsalo solo si la compra no se realizó.
              </p>
              {(localError || error) && confirmCancel ? (
                <p className={`mt-3 ${sellerAlertError}`} role="alert">
                  {localError || error}
                </p>
              ) : null}
              <div className="mt-5 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmCancel(false)}
                  disabled={cancelling}
                  className={sellerBtnSecondary}
                >
                  Volver
                </button>
                <button
                  type="button"
                  onClick={onCancel}
                  disabled={cancelling}
                  className={sellerBtnDanger}
                >
                  {cancelling ? 'Eliminando…' : 'Eliminar'}
                </button>
              </div>
            </div>
          </div>
        ) : null}
        </div>
      </div>
    </SellerModalPortal>
  )
}

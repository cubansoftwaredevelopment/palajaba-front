import { useEffect, useMemo, useState } from 'react'

import { fetchSellerCatalog } from '../../lib/api'
import { getSellerToken } from '../../lib/sellerAuth'
import { formatPrice } from '../../lib/money'
import {
  buildManualOrderPayload,
  createManualOrderLineItem,
  filterProductsForManualOrder,
  flattenCatalogProducts,
  getProductSearchStatus,
  inferManualOrderPaymentCurrency,
  PAYMENT_CURRENCIES,
  validateManualOrderDraft,
} from '../../lib/sellerManualOrder'
import SellerModalPortal from './SellerModalPortal'
import {
  sellerAlertError,
  sellerBtnPrimary,
  sellerBtnSecondary,
  sellerHint,
  sellerIconBtn,
  sellerLabel,
  sellerModalBody,
  sellerModalFooter,
  sellerModalInput,
  sellerModalOverlay,
  sellerModalSheet,
  sellerModalTitle,
  sellerSection,
} from './sellerStyles'

function QuantityStepper({ value, onChange, max = 99 }) {
  return (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        className={sellerIconBtn}
        onClick={() => onChange(Math.max(1, value - 1))}
        disabled={value <= 1}
        aria-label="Disminuir cantidad"
      >
        −
      </button>
      <span className="min-w-[1.5rem] text-center text-sm font-bold text-brand-green">{value}</span>
      <button
        type="button"
        className={sellerIconBtn}
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        aria-label="Aumentar cantidad"
      >
        +
      </button>
    </div>
  )
}

export default function SellerManualOrderModal({ onClose, onCreated }) {
  const [catalogLoading, setCatalogLoading] = useState(true)
  const [catalogError, setCatalogError] = useState('')
  const [products, setProducts] = useState([])
  const [lineItems, setLineItems] = useState([])
  const [paymentCurrency, setPaymentCurrency] = useState('')
  const [withDelivery, setWithDelivery] = useState(false)
  const [delivery, setDelivery] = useState({
    recipient_name: '',
    address: '',
    phone_primary: '',
    phone_secondary: '',
    notes: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [productSearch, setProductSearch] = useState('')

  useEffect(() => {
    let cancelled = false

    async function loadCatalog() {
      setCatalogLoading(true)
      setCatalogError('')
      try {
        const token = getSellerToken()
        const data = await fetchSellerCatalog(token)
        if (!cancelled) {
          setProducts(flattenCatalogProducts(data))
        }
      } catch {
        if (!cancelled) {
          setProducts([])
          setCatalogError('No pudimos cargar tu catálogo.')
        }
      } finally {
        if (!cancelled) setCatalogLoading(false)
      }
    }

    loadCatalog()
    return () => {
      cancelled = true
    }
  }, [])

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

  const productsById = useMemo(
    () => Object.fromEntries(products.map((product) => [product.id, product])),
    [products],
  )

  const availableProducts = useMemo(
    () => products.filter((product) => !lineItems.some((item) => item.product_id === product.id)),
    [lineItems, products],
  )

  const filteredProducts = useMemo(
    () => filterProductsForManualOrder(availableProducts, productSearch),
    [availableProducts, productSearch],
  )

  const productSearchStatus = useMemo(
    () => getProductSearchStatus(availableProducts, productSearch),
    [availableProducts, productSearch],
  )

  const productPickerDisabled = catalogLoading || Boolean(catalogError)

  function handleAddProduct(productId) {
    const product = productsById[productId]
    if (!product) return
    const nextItem = createManualOrderLineItem(product)
    setLineItems((current) => [...current, nextItem])
    setPaymentCurrency((current) => current || inferManualOrderPaymentCurrency([...lineItems, nextItem]))
  }

  function handleRemoveItem(productId) {
    setLineItems((current) => current.filter((item) => item.product_id !== productId))
  }

  function handleQuantityChange(productId, quantity) {
    setLineItems((current) =>
      current.map((item) =>
        item.product_id === productId ? { ...item, quantity } : item,
      ),
    )
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')

    const validationError = validateManualOrderDraft(lineItems, productsById)
    if (validationError) {
      setError(validationError)
      return
    }

    if (withDelivery) {
      if (!delivery.recipient_name.trim() || !delivery.address.trim() || !delivery.phone_primary.trim()) {
        setError('Completa nombre, dirección y teléfono del domicilio.')
        return
      }
    }

    const payload = buildManualOrderPayload({
      lineItems,
      paymentCurrency: paymentCurrency || inferManualOrderPaymentCurrency(lineItems) || null,
      delivery: withDelivery
        ? {
            recipient_name: delivery.recipient_name.trim(),
            address: delivery.address.trim(),
            phone_primary: delivery.phone_primary.trim(),
            phone_secondary: delivery.phone_secondary?.trim() || null,
            notes: delivery.notes?.trim() || null,
          }
        : null,
    })

    setSubmitting(true)
    try {
      await onCreated(payload)
      onClose()
    } catch (err) {
      setError(err?.message || 'No pudimos registrar el pedido.')
    } finally {
      setSubmitting(false)
    }
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
          aria-labelledby="manual-order-title"
          className={`${sellerModalSheet} h-[min(92dvh,760px)]`}
          onMouseDown={(event) => event.stopPropagation()}
        >
          <div className="flex shrink-0 items-start justify-between gap-3 border-b border-brand-green/8 px-5 py-4">
            <div className="min-w-0">
              <h2 id="manual-order-title" className={sellerModalTitle}>
                Registrar venta manual
              </h2>
              <p className={`mt-1 ${sellerHint}`}>
                Ventas fuera de la plataforma con la misma estructura de un pedido normal.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-brand-green active:bg-brand-green/8"
              aria-label="Cerrar"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form className="flex min-h-0 flex-1 flex-col" onSubmit={handleSubmit}>
            <div className={`${sellerModalBody} space-y-4`}>
              <div className={`${sellerSection} space-y-2`}>
                <label htmlFor="manual-order-product-search" className={sellerLabel}>
                  Buscar producto
                </label>
                <input
                  id="manual-order-product-search"
                  type="search"
                  className={sellerModalInput}
                  placeholder="Nombre o categoría…"
                  value={productSearch}
                  disabled={productPickerDisabled}
                  onChange={(event) => setProductSearch(event.target.value)}
                  autoComplete="off"
                />
                {catalogLoading ? <p className={sellerHint}>Cargando catálogo…</p> : null}
                {catalogError ? <p className={sellerAlertError}>{catalogError}</p> : null}
                {!catalogLoading && !catalogError && productSearchStatus.message ? (
                  <p
                    className={
                      productSearchStatus.type === 'no-results'
                        ? sellerAlertError
                        : sellerHint
                    }
                  >
                    {productSearchStatus.message}
                  </p>
                ) : null}
                {!catalogLoading && !catalogError ? (
                  <ul className="max-h-52 space-y-1.5 overflow-y-auto overscroll-contain rounded-xl border border-brand-green/10 bg-brand-green/[0.02] p-1.5">
                    {filteredProducts.map((product) => (
                      <li key={product.id}>
                        <button
                          type="button"
                          className="flex w-full items-start justify-between gap-3 rounded-lg px-3 py-2.5 text-left transition-colors active:bg-brand-yellow/15"
                          onClick={() => handleAddProduct(product.id)}
                        >
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-semibold text-brand-green">
                              {product.name}
                            </span>
                            <span className="mt-0.5 block text-xs text-brand-carmelita/80">
                              {product.category_name}
                              {product.stock_quantity != null ? ` · Stock: ${product.stock_quantity}` : ''}
                            </span>
                          </span>
                          <span className="shrink-0 text-xs font-semibold text-brand-green">
                            {formatPrice(product.base_price, product.base_currency)}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>

              {lineItems.length > 0 ? (
                <div className={`${sellerSection} space-y-3`}>
                  <p className={sellerLabel}>Productos del pedido</p>
                  {lineItems.map((item) => (
                    <div
                      key={item.product_id}
                      className="rounded-xl border border-brand-green/10 bg-brand-green/[0.02] p-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-brand-green">{item.name}</p>
                          <p className="mt-0.5 text-xs text-brand-carmelita/80">
                            {formatPrice(item.unit_price, item.currency)}
                            {item.stock_quantity != null ? ` · Stock: ${item.stock_quantity}` : ''}
                          </p>
                        </div>
                        <button
                          type="button"
                          className="shrink-0 text-xs font-semibold text-[#c0392b]"
                          onClick={() => handleRemoveItem(item.product_id)}
                        >
                          Quitar
                        </button>
                      </div>
                      <div className="mt-3 flex items-center justify-between">
                        <span className="text-xs text-brand-carmelita/80">Cantidad</span>
                        <QuantityStepper
                          value={item.quantity}
                          max={item.stock_quantity ?? 99}
                          onChange={(quantity) => handleQuantityChange(item.product_id, quantity)}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="rounded-2xl border border-brand-yellow/25 bg-brand-yellow/15 px-4 py-3 text-center text-sm text-brand-carmelita/90">
                  Agrega al menos un producto para registrar la venta.
                </p>
              )}

              <div className={`${sellerSection} space-y-2`}>
                <label htmlFor="manual-order-payment-currency" className={sellerLabel}>
                  Moneda de pago
                </label>
                <select
                  id="manual-order-payment-currency"
                  className={sellerModalInput}
                  value={paymentCurrency}
                  onChange={(event) => setPaymentCurrency(event.target.value)}
                >
                  <option value="">Inferir según productos</option>
                  {PAYMENT_CURRENCIES.map((currency) => (
                    <option key={currency} value={currency}>
                      {currency}
                    </option>
                  ))}
                </select>
              </div>

              <div className={`${sellerSection} space-y-3`}>
                <label className="flex items-center gap-2 text-sm text-brand-carmelita">
                  <input
                    id="manual-order-with-delivery"
                    type="checkbox"
                    checked={withDelivery}
                    onChange={(event) => setWithDelivery(event.target.checked)}
                  />
                  Incluir datos de domicilio
                </label>

                {withDelivery ? (
                  <div className="grid gap-3">
                    <div>
                      <label htmlFor="manual-order-recipient" className={sellerLabel}>
                        Nombre del cliente
                      </label>
                      <input
                        id="manual-order-recipient"
                        className={`mt-1.5 ${sellerModalInput}`}
                        value={delivery.recipient_name}
                        onChange={(event) =>
                          setDelivery((current) => ({ ...current, recipient_name: event.target.value }))
                        }
                      />
                    </div>
                    <div>
                      <label htmlFor="manual-order-address" className={sellerLabel}>
                        Dirección
                      </label>
                      <input
                        id="manual-order-address"
                        className={`mt-1.5 ${sellerModalInput}`}
                        value={delivery.address}
                        onChange={(event) =>
                          setDelivery((current) => ({ ...current, address: event.target.value }))
                        }
                      />
                    </div>
                    <div>
                      <label htmlFor="manual-order-phone" className={sellerLabel}>
                        Teléfono principal
                      </label>
                      <input
                        id="manual-order-phone"
                        className={`mt-1.5 ${sellerModalInput}`}
                        value={delivery.phone_primary}
                        onChange={(event) =>
                          setDelivery((current) => ({ ...current, phone_primary: event.target.value }))
                        }
                      />
                    </div>
                  </div>
                ) : null}
              </div>

              {error ? (
                <p className={sellerAlertError} role="alert">
                  {error}
                </p>
              ) : null}
            </div>

            <div className={`${sellerModalFooter} grid grid-cols-2 gap-2`}>
              <button type="button" className={sellerBtnSecondary} onClick={onClose}>
                Cancelar
              </button>
              <button
                type="submit"
                className={sellerBtnPrimary}
                disabled={submitting || lineItems.length === 0}
              >
                {submitting ? 'Guardando…' : 'Registrar pedido'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </SellerModalPortal>
  )
}

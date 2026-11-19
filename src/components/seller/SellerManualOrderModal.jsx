import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'

import { searchSellerOrderedProducts } from '../../products/api.js'
import { getSellerToken } from '../../lib/sellerAuth'
import { getUserFacingMessage } from '../../lib/userFacingError'
import { SELLER_PRODUCTS_REFRESH_EVENT } from '../../lib/sellerProductsRefresh'
import { formatPrice } from '../../lib/money'
import { productDiscountPercent, productSaleAmount } from '../../lib/displayPrice'
import {
  buildManualOrderPayload,
  createManualOrderLineItem,
  PAYMENT_CURRENCIES,
  validateManualOrderDraft,
} from '../../lib/sellerManualOrder'
import SubscriptionDatePicker from '../SubscriptionDatePicker'
import { formatDateForApi, startOfDay } from '../../lib/dates'
import SellerModalPortal from './SellerModalPortal'
import SellerMotionSheet, { useSellerSheet } from '../../motion/SellerMotionSheet'
import SellerSelect from './SellerSelect'
import SearchBar from '../../buyer/components/SearchBar'
import Checkbox from '../ui/Checkbox'
import { useFormErrorToast } from '../ui/useFormErrorToast'
import {
  sellerBtnPrimary,
  sellerBtnSecondary,
  sellerHint,
  sellerIconBtn,
  sellerLabel,
  sellerModalBody,
  sellerModalFooter,
  sellerModalInput,
  sellerModalSheet,
  sellerModalTitle,
  sellerSection,
} from './sellerStyles'

const PRODUCT_SEARCH_HINTS = [
  'buscar por nombre',
  'buscar por categoría',
]

function useAnimatedNumber(target, duration = 460) {
  const [display, setDisplay] = useState(target)
  const displayRef = useRef(target)

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const from = displayRef.current
    const to = Number(target) || 0
    if (reduced || Math.abs(from - to) < 0.001) {
      displayRef.current = to
      setDisplay(to)
      return undefined
    }
    const start = performance.now()
    let frame = 0
    const tick = (now) => {
      const progress = Math.min(1, (now - start) / duration)
      const eased = 1 - (1 - progress) ** 3
      const next = from + (to - from) * eased
      displayRef.current = next
      setDisplay(next)
      if (progress < 1) frame = requestAnimationFrame(tick)
      else {
        displayRef.current = to
        setDisplay(to)
      }
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [duration, target])

  return display
}

function AnimatedCount({ value }) {
  const animated = useAnimatedNumber(value)
  return <span className="tabular-nums">{Math.round(animated)}</span>
}

function AnimatedPrice({ amount, currency }) {
  const animated = useAnimatedNumber(amount)
  return <span className="tabular-nums">{formatPrice(animated, currency)}</span>
}

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

export default function SellerManualOrderModal({ onClose: requestClose, onCreated }) {
  const navigate = useNavigate()
  const { dismiss: onClose, closing, sheetProps } = useSellerSheet(requestClose)
  const [searchLoading, setSearchLoading] = useState(true)
  const [searchError, setSearchError] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [hasOrderedProducts, setHasOrderedProducts] = useState(false)
  const [lineItems, setLineItems] = useState([])
  const [withDelivery, setWithDelivery] = useState(false)
  const [delivery, setDelivery] = useState({
    recipient_name: '',
    address: '',
    phone_primary: '',
    phone_secondary: '',
    notes: '',
  })
  const [deliveryCurrency, setDeliveryCurrency] = useState('CUP')
  const [deliveryCost, setDeliveryCost] = useState('')
  const [includeSaleDate, setIncludeSaleDate] = useState(false)
  const [saleDate, setSaleDate] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const { showError, toastNode } = useFormErrorToast({ aboveNav: true, layerClassName: '!z-[260]' })
  const [productSearch, setProductSearch] = useState('')
  const [catalogRevision, setCatalogRevision] = useState(0)

  useEffect(() => {
    let cancelled = false
    const query = productSearch.trim()
    if (!query) {
      setSuggestions([])
      setSearchError('')
    }
    const handle = setTimeout(async () => {
      if (query) {
        setSearchLoading(true)
        setSearchError('')
      }
      try {
        const data = await searchSellerOrderedProducts(getSellerToken(), query)
        if (cancelled) return
        setHasOrderedProducts(Boolean(data?.has_ordered_products))
        if (!query) return
        setSuggestions(Array.isArray(data?.products) ? data.products : [])
      } catch {
        if (cancelled) return
        if (!query) return
        setSuggestions([])
        setSearchError('No pudimos buscar productos.')
      } finally {
        if (!cancelled) setSearchLoading(false)
      }
    }, query ? 250 : 0)

    return () => {
      cancelled = true
      clearTimeout(handle)
    }
  }, [catalogRevision, productSearch])

  useEffect(() => {
    const refresh = () => setCatalogRevision((revision) => revision + 1)
    window.addEventListener(SELLER_PRODUCTS_REFRESH_EVENT, refresh)
    return () => window.removeEventListener(SELLER_PRODUCTS_REFRESH_EVENT, refresh)
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
    () => Object.fromEntries(suggestions.map((product) => [product.id, product])),
    [suggestions],
  )

  const visibleSuggestions = useMemo(
    () => suggestions.filter((product) => !lineItems.some((item) => item.product_id === product.id)),
    [lineItems, suggestions],
  )

  const productQuery = productSearch.trim()
  const unitCount = lineItems.reduce((sum, item) => sum + item.quantity, 0)
  const totalsByCurrency = useMemo(() => {
    const totals = new Map()
    for (const item of lineItems) {
      const currency = String(item.currency || '').toUpperCase()
      const amount = Number(item.unit_price) * Number(item.quantity)
      totals.set(currency, (totals.get(currency) || 0) + amount)
    }
    return [...totals.entries()]
  }, [lineItems])
  const reducedMotion = useReducedMotion()

  function handleAddProduct(productId) {
    const product = productsById[productId]
    if (!product) return
    const nextItem = createManualOrderLineItem(product)
    setLineItems((current) => [...current, nextItem])
    setProductSearch('')
    setSuggestions([])
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
    showError('')

    const validationError = validateManualOrderDraft(lineItems, productsById)
    if (validationError) {
      showError(validationError)
      return
    }

    if (includeSaleDate && !saleDate) {
      showError('Elige la fecha de venta o desactiva esa opción.')
      return
    }

    if (withDelivery) {
      if (!delivery.recipient_name.trim() || !delivery.address.trim() || !delivery.phone_primary.trim()) {
        showError('Completa nombre, dirección y teléfono del domicilio.')
        return
      }
      if (delivery.phone_primary.trim().length < 8) {
        showError('Ingresa un teléfono de contacto con al menos 8 caracteres.')
        return
      }
      const cost = Number(String(deliveryCost).trim().replace(',', '.'))
      if (!deliveryCurrency || !PAYMENT_CURRENCIES.includes(deliveryCurrency)) {
        showError('Elige la moneda del domicilio.')
        return
      }
      if (!Number.isFinite(cost) || cost < 0) {
        showError('Indica el costo del domicilio.')
        return
      }
    }

    const payload = buildManualOrderPayload({
      lineItems,
      soldAt: includeSaleDate ? formatDateForApi(saleDate) : null,
      deliveryPrice: withDelivery ? Number(String(deliveryCost).trim().replace(',', '.')) : null,
      deliveryCurrency: withDelivery ? deliveryCurrency : null,
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
      showError(getUserFacingMessage(err, 'No pudimos registrar el pedido.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <SellerModalPortal>
      <SellerMotionSheet
        onClose={onClose}
        closing={closing}
        sheetProps={sheetProps}
        labelledBy="manual-order-title"
        panelClassName={`${sellerModalSheet} h-[min(92dvh,760px)]`}
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
              <div className={`${sellerSection} space-y-3`}>
                <p className={sellerLabel}>Productos del pedido</p>
                <SearchBar
                  id="manual-order-product-search"
                  value={productSearch}
                  onChange={(event) => setProductSearch(event.target.value)}
                  onClear={() => {
                    setProductSearch('')
                    setSuggestions([])
                    setSearchError('')
                  }}
                  label="Buscar producto"
                  phrases={PRODUCT_SEARCH_HINTS}
                />
                {productQuery ? (
                  <ul
                    className="max-h-52 overflow-y-auto rounded-2xl border border-brand-green/12 bg-brand-white py-1 shadow-[0_12px_32px_rgba(89,128,44,0.16)]"
                    aria-label="Sugerencias de productos"
                  >
                    {searchLoading ? <li className="px-4 py-3 text-sm text-brand-carmelita">Buscando…</li> : null}
                    {!searchLoading && searchError ? <li className="px-4 py-3 text-sm text-brand-carmelita">{searchError}</li> : null}
                    {!searchLoading && !searchError && !visibleSuggestions.length ? (
                      <li className="px-4 py-3 text-sm text-brand-carmelita">
                        {suggestions.length ? 'Esos productos ya están en el pedido.' : 'Sin coincidencias.'}
                      </li>
                    ) : null}
                    {!searchLoading && !searchError
                      ? visibleSuggestions.map((product) => (
                        <li key={product.id}>
                          <button
                            type="button"
                            className="flex w-full items-start justify-between gap-3 px-4 py-2.5 text-left touch-manipulation active:bg-brand-yellow/15"
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
                              {formatPrice(
                                productSaleAmount(product),
                                product.base_currency,
                              )}
                              {productDiscountPercent(product) ? (
                                <span className="ml-1 font-bold">
                                  -{productDiscountPercent(product)}%
                                </span>
                              ) : null}
                            </span>
                          </button>
                        </li>
                      ))
                      : null}
                  </ul>
                ) : null}
                <AnimatePresence initial={false}>
                  {lineItems.map((item) => (
                    <motion.div
                      key={item.product_id}
                      layout
                      initial={reducedMotion ? false : { opacity: 0, y: 10, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -8, scale: 0.98 }}
                      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
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
                      <div className="mt-3 flex items-center justify-between gap-3">
                        <span className="text-xs text-brand-carmelita/80">
                          Cantidad · <AnimatedPrice amount={item.unit_price * item.quantity} currency={item.currency} />
                        </span>
                        <QuantityStepper
                          value={item.quantity}
                          max={item.stock_quantity ?? 99}
                          onChange={(quantity) => handleQuantityChange(item.product_id, quantity)}
                        />
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {lineItems.length ? (
                  <div className="flex items-center justify-between gap-3 border-t border-brand-green/10 pt-3 text-sm">
                    <span className="font-semibold text-brand-carmelita">
                      <AnimatedCount value={unitCount} /> {unitCount === 1 ? 'producto' : 'productos'}
                    </span>
                    <span className="text-right font-bold text-brand-green">
                      {totalsByCurrency.map(([currency, amount], index) => (
                        <span key={currency}>
                          {index ? ' · ' : ''}
                          <AnimatedPrice amount={amount} currency={currency} />
                        </span>
                      ))}
                    </span>
                  </div>
                ) : null}
              </div>

              {!searchLoading && !searchError && !hasOrderedProducts ? (
                <div className="rounded-2xl border border-brand-yellow/25 bg-brand-yellow/15 px-4 py-4 text-center">
                  <p className="text-sm text-brand-carmelita/90">
                    Agrega al menos un producto para registrar la venta.
                  </p>
                  <button
                    type="button"
                    className={`${sellerBtnPrimary} mt-3`}
                    onClick={() => {
                      onClose()
                      navigate('/tienda/catalogo')
                    }}
                  >
                    Ir al catálogo
                  </button>
                </div>
              ) : null}

              <div className={`${sellerSection} space-y-3`}>
                <label className="flex items-center gap-2.5 text-sm text-brand-carmelita">
                  <Checkbox
                    id="manual-order-sale-date"
                    checked={includeSaleDate}
                    onChange={(event) => {
                      const next = event.target.checked
                      setIncludeSaleDate(next)
                      if (next) setSaleDate((current) => current ?? startOfDay(new Date()))
                    }}
                  />
                  Agregar fecha de venta
                </label>
                {includeSaleDate ? (
                  <SubscriptionDatePicker
                    value={saleDate}
                    onChange={(next) => next && setSaleDate(next)}
                    minDate={new Date(2015, 0, 1)}
                    maxDate={startOfDay(new Date())}
                    caption="Fecha de venta"
                  />
                ) : (
                  <p className={sellerHint}>Si no la indicas, el pedido queda con la fecha de hoy.</p>
                )}
              </div>

              <div className={`${sellerSection} space-y-3`}>
                <label className="flex items-center gap-2.5 text-sm text-brand-carmelita">
                  <Checkbox
                    id="manual-order-with-delivery"
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
                    <div className="grid grid-cols-[minmax(0,1fr)_7.5rem] gap-3">
                      <div>
                        <label htmlFor="manual-order-delivery-cost" className={sellerLabel}>
                          Costo del domicilio
                        </label>
                        <input
                          id="manual-order-delivery-cost"
                          inputMode="decimal"
                          className={`mt-1.5 ${sellerModalInput}`}
                          value={deliveryCost}
                          placeholder="0"
                          onChange={(event) => setDeliveryCost(event.target.value)}
                        />
                      </div>
                      <div>
                        <label htmlFor="manual-order-delivery-currency" className={sellerLabel}>
                          Moneda
                        </label>
                        <div className="mt-1.5">
                          <SellerSelect
                            id="manual-order-delivery-currency"
                            ariaLabel="Moneda del domicilio"
                            modal
                            value={deliveryCurrency}
                            onChange={setDeliveryCurrency}
                            options={PAYMENT_CURRENCIES.map((currency) => ({ value: currency, label: currency }))}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
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
      </SellerMotionSheet>
      {toastNode}
    </SellerModalPortal>
  )
}

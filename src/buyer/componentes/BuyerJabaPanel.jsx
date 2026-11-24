import { useEffect, useId, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion, PresenceContext, useReducedMotion } from 'framer-motion'
import Logo from '../../shared/componentes/Logo.jsx'
import { jabaItemMotion, jabaStoreMotion, qtyTick, useSheetExitMs } from '../../motion/presets'
import BuyerMotionFrame from '../../motion/BuyerMotionFrame'
import BuyerModalPortal from './BuyerModalPortal.jsx'
import { useDismissibleModal } from './useOrderModalPresence.js'
import { useDisplayedLocation } from '../context/context.js'
import { buildJabaShareMessage, buildJabaShareUrl } from '../utils/buyerShare.js'
import BuyerShareSheet, { BuyerShareButton } from './BuyerShareSheet.jsx'
import { useBuyerDisplayCurrency } from '../context/context.js'
import { useBuyerJaba } from '../context/context.js'
import BuyerShell from './BuyerShell.jsx'
import BuyerJabaSuggestions from './BuyerJabaSuggestions.jsx'
import LoadingState from '../../shared/componentes/LoadingState.jsx'
import { allItemsOfferDelivery, resolveStorePhone } from '../utils/buyerJaba.js'
import { productStockLabel } from '../../products/utils/marketplaceProduct.js'
import { resolveDisplayPrice } from '../../shared/utils/displayPrice.js'
import { formatPrice } from '../../shared/utils/money.js'
import { resolveMediaUrl } from '../../shared/utils/media.js'
import {
  buyerJabaCheckoutActions,
  buyerProductDetailModal,
  buyerProductDetailOverlay,
  buyerProductDetailStickyBar,
  buyerJabaIconBtn,
  buyerJabaItemImage,
  buyerJabaItemRow,
  buyerJabaPanelBody,
  buyerJabaPanelHeader,
  buyerJabaPanelTitle,
  buyerJabaPrimaryBtn,
  buyerJabaQtyBtn,
  buyerJabaSecondaryBtn,
  buyerJabaShippingNote,
  buyerJabaStickySummary,
  buyerJabaStickySummaryText,
  buyerJabaStoreAccordionBtn,
  buyerJabaStoreChip,
  buyerJabaStoreChips,
  buyerJabaStoreSection,
  buyerJabaStoreTitle,
} from './buyerStyles.js'

function TrashIcon({ className = '' }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M3 6h18" />
      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
      <path d="M10 11v6M14 11v6" />
    </svg>
  )
}

function ChevronIcon({ expanded }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className={`shrink-0 text-brand-green transition-transform ${expanded ? 'rotate-180' : ''}`}
      aria-hidden
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  )
}

function storeSubtotals(items, displayCurrency, cupPerUnit) {
  const subtotalByCurrency = {}

  for (const item of items) {
    const display = resolveDisplayPrice(item, displayCurrency, cupPerUnit)
    const key = display.currency
    subtotalByCurrency[key] = (subtotalByCurrency[key] ?? 0) + display.amount * (item.quantity ?? 1)
  }

  return Object.entries(subtotalByCurrency).map(([currency, amount]) => ({ currency, amount }))
}

function CountingMoney({ amount, currency }) {
  const reduced = useReducedMotion()
  const whole = String(currency || '').toUpperCase() === 'CUP'
  const [value, setValue] = useState(amount)
  const valueRef = useRef(amount)

  useEffect(() => {
    const from = valueRef.current
    const to = Number(amount)
    if (!Number.isFinite(to)) return undefined
    if (reduced || Math.abs(to - from) < (whole ? 0.5 : 0.005)) {
      valueRef.current = to
      setValue(to)
      return undefined
    }

    const start = performance.now()
    const span = Math.abs(to - from)
    const duration = Math.min(1200, Math.max(520, span * (whole ? 6 : 36)))
    let frame = 0

    function tick(now) {
      const progress = Math.min(1, (now - start) / duration)
      const eased = 1 - (1 - progress) ** 3
      const raw = from + (to - from) * eased
      const next = whole ? Math.round(raw) : Math.round(raw * 100) / 100
      valueRef.current = next
      setValue(next)
      if (progress < 1) {
        frame = requestAnimationFrame(tick)
        return
      }
      valueRef.current = to
      setValue(to)
    }

    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [amount, reduced, whole])

  return formatPrice(value, currency)
}

function MoneyTotal({ items, displayCurrency, cupPerUnit }) {
  const parts = storeSubtotals(items, displayCurrency, cupPerUnit)
  return parts.map((part, index) => (
    <span key={part.currency}>
      {index > 0 ? ' + ' : null}
      <CountingMoney amount={part.amount} currency={part.currency} />
    </span>
  ))
}

function JabaQty({ qty }) {
  const reduced = useReducedMotion()
  const prevQty = useRef(qty)
  const dir = qty >= prevQty.current ? 1 : -1

  useEffect(() => {
    prevQty.current = qty
  }, [qty])

  if (reduced) {
    return <span className="min-w-6 text-center text-sm font-bold text-brand-green">{qty}</span>
  }

  return (
    <span className="inline-grid min-w-6 overflow-hidden text-center">
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={qty}
          className="col-start-1 row-start-1 text-sm font-bold text-brand-green"
          initial={{ y: dir > 0 ? 14 : -14, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: dir > 0 ? -14 : 14, opacity: 0 }}
          transition={qtyTick}
        >
          {qty}
        </motion.span>
      </AnimatePresence>
    </span>
  )
}

function ClearStoreModal({ title, message, confirmLabel, onClose: requestClose, onConfirm }) {
  const exitMs = useSheetExitMs()
  const { dismiss, closing, sheetProps } = useDismissibleModal(requestClose, exitMs, { motion: true })

  useEffect(() => {
    function onKeyDown(event) {
      if (event.key === 'Escape') dismiss()
    }
    document.addEventListener('keydown', onKeyDown)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [dismiss])

  return (
    <BuyerModalPortal>
      <BuyerMotionFrame
        variant="detail"
        closing={closing}
        sheetProps={sheetProps}
        overlayClassName={`${buyerProductDetailOverlay} !z-[140]`}
        panelClassName={buyerProductDetailModal}
        overlayProps={{
          role: 'presentation',
          onMouseDown: (event) => {
            if (event.target === event.currentTarget) dismiss()
          },
        }}
        panelProps={{ role: 'dialog', 'aria-modal': true, 'aria-labelledby': 'clear-store-title' }}
      >
        <div className="shrink-0 px-5 pt-3">
          <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-brand-green/15 sm:hidden" aria-hidden="true" />
          <div className="flex items-center justify-between gap-3">
            <h2 id="clear-store-title" className="font-display text-lg font-bold text-brand-green">{title}</h2>
            <button
              type="button"
              onClick={dismiss}
              className="flex h-10 w-10 items-center justify-center rounded-full text-brand-carmelita touch-manipulation active:bg-brand-green/8"
              aria-label="Cerrar"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        <div className="px-5 pb-4 pt-3">
          <p className="text-sm leading-relaxed text-brand-carmelita">{message}</p>
        </div>
        <div className={buyerProductDetailStickyBar}>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={dismiss} className={buyerJabaSecondaryBtn}>
              Cancelar
            </button>
            <button type="button" onClick={onConfirm} className={buyerJabaPrimaryBtn}>
              {confirmLabel}
            </button>
          </div>
        </div>
      </BuyerMotionFrame>
    </BuyerModalPortal>
  )
}

function StoreGroup({
  group,
  expanded,
  onToggle,
  displayCurrency,
  cupPerUnit,
  syncingContacts,
  checkoutSubmitting,
  onRequestPickup,
  onRequestDelivery,
  onAskClearStore,
  onAskRemove,
  onSetQuantity,
}) {
  const panelId = useId()
  const storePhone = group.store_phone ?? resolveStorePhone(group.items)
  const canCheckout = Boolean(storePhone) && !syncingContacts && !checkoutSubmitting
  const deliveryAvailable = canCheckout && allItemsOfferDelivery(group.items)

  function handleClearStore(event) {
    event.preventDefault()
    event.stopPropagation()
    onAskClearStore(group)
  }

  const reduced = useReducedMotion()
  const lineMotion = reduced
    ? { initial: false, animate: { opacity: 1 }, exit: { opacity: 0, transition: { duration: 0 } } }
    : jabaItemMotion

  return (
    <div>
      <div className="flex items-stretch gap-0.5">
        <button
          type="button"
          className={buyerJabaStoreAccordionBtn}
          aria-expanded={expanded}
          aria-controls={panelId}
          onClick={onToggle}
        >
          <div className="min-w-0 flex-1">
            <h3 className={buyerJabaStoreTitle}>{group.store_name}</h3>
            <p className="mt-0.5 text-xs font-medium text-brand-carmelita">
              {group.itemCount} {group.itemCount === 1 ? 'producto' : 'productos'}
              <span className="text-brand-green"> · <MoneyTotal items={group.items} displayCurrency={displayCurrency} cupPerUnit={cupPerUnit} /></span>
            </p>
          </div>
          <ChevronIcon expanded={expanded} />
        </button>
        <button
          type="button"
          onClick={handleClearStore}
          className={`${buyerJabaIconBtn} mt-1 mr-1`}
          aria-label={`Vaciar productos de ${group.store_name}`}
          title="Vaciar tienda"
        >
          <TrashIcon />
        </button>
      </div>

      {expanded ? (
        <div id={panelId} className="border-t border-brand-green/8 px-3.5 pb-3.5">
          <ul className="mt-1">
            <AnimatePresence mode="popLayout" initial={false}>
            {group.items.map((item) => {
              const imageSrc = resolveMediaUrl(item.image_url)
              const display = resolveDisplayPrice(item, displayCurrency, cupPerUnit)
              const qty = item.quantity ?? 1

              return (
                <motion.li layout key={item.id} className={buyerJabaItemRow} {...lineMotion}>
                  {imageSrc ? (
                    <img src={imageSrc} alt="" className={buyerJabaItemImage} loading="lazy" />
                  ) : (
                    <div
                      className={`${buyerJabaItemImage} flex items-center justify-center text-[0.55rem] font-semibold text-brand-carmelita`}
                    >
                      Sin foto
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <p className="font-display line-clamp-2 text-sm font-semibold leading-snug text-brand-green">
                      {item.name}
                    </p>
                    <p className="mt-0.5 text-xs font-bold text-brand-green">{display.label}</p>
                    <p className="mt-0.5 text-[0.68rem] font-semibold text-brand-carmelita">
                      Stock: {productStockLabel(item)}
                    </p>

                    <div className="mt-2 flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          if (qty <= 1) onAskRemove(item)
                          else onSetQuantity(item.id, qty - 1)
                        }}
                        className={buyerJabaQtyBtn}
                        aria-label={`Quitar uno de ${item.name}`}
                      >
                        −
                      </button>
                      <JabaQty qty={qty} />
                      <button
                        type="button"
                        onClick={() => onSetQuantity(item.id, qty + 1)}
                        disabled={qty >= (item.stock_quantity ?? 100)}
                        className={`${buyerJabaQtyBtn} disabled:opacity-40`}
                        aria-label={`Agregar uno de ${item.name}`}
                      >
                        +
                      </button>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.preventDefault()
                          event.stopPropagation()
                          onAskRemove(item)
                        }}
                        className={`${buyerJabaIconBtn} jaba-remove-btn ml-auto`}
                        aria-label={`Quitar ${item.name} de la jaba`}
                        title="Quitar producto"
                      >
                        <TrashIcon />
                      </button>
                    </div>
                  </div>
                </motion.li>
              )
            })}
            </AnimatePresence>
          </ul>

          <p className="mt-2 text-xs font-semibold text-brand-carmelita">
            Subtotal: <span className="text-brand-green"><MoneyTotal items={group.items} displayCurrency={displayCurrency} cupPerUnit={cupPerUnit} /></span>
          </p>
          <p className={buyerJabaShippingNote}>
            El costo de entrega se coordina directamente con la tienda
          </p>

          <div className={buyerJabaCheckoutActions}>
            {deliveryAvailable ? (
              <>
                <button
                  type="button"
                  onClick={() => onRequestDelivery(group.store_id)}
                  disabled={!canCheckout}
                  className={buyerJabaPrimaryBtn}
                >
                  Pedir a domicilio
                </button>
                <button
                  type="button"
                  onClick={() => onRequestPickup(group.store_id)}
                  disabled={!canCheckout}
                  className={buyerJabaSecondaryBtn}
                >
                  {checkoutSubmitting ? 'Registrando pedido…' : 'Recoger en la tienda'}
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => onRequestPickup(group.store_id)}
                disabled={!canCheckout}
                className={`${buyerJabaPrimaryBtn} col-span-2`}
              >
                {checkoutSubmitting ? 'Registrando pedido…' : 'Recoger en la tienda'}
              </button>
            )}
          </div>

          {syncingContacts ? (
            <LoadingState
              variant="compact"
              size="xs"
              message="Buscando teléfono de la tienda…"
              className="mt-2 !py-0"
            />
          ) : null}

          {!syncingContacts && !canCheckout ? (
            <p className="mt-2 text-center text-xs text-brand-carmelita">
              Esta tienda no tiene teléfono disponible para pedidos.
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

export default function BuyerCartPage() {
  const titleId = useId()
  const navigate = useNavigate()
  const routeLocation = useLocation()
  const sectionRefs = useRef({})
  const {
    items,
    groups,
    count,
    syncingContacts,
    checkoutSubmittingStoreId,
    requestPickupCheckout,
    requestDeliveryCheckout,
    clearStore,
    removeProduct,
    setQuantity,
  } = useBuyerJaba()
  const { currency: displayCurrency, cupPerUnit } = useBuyerDisplayCurrency()
  const location = useDisplayedLocation()
  const [shareOpen, setShareOpen] = useState(false)
  const [pendingRemoval, setPendingRemoval] = useState(null)
  const [expandedIds, setExpandedIds] = useState(() => new Set())
  const hadItemsRef = useRef(count > 0)
  const justEmptied = hadItemsRef.current && count === 0
  const reduced = useReducedMotion()
  const storeMotion = reduced
    ? { initial: false, animate: { opacity: 1 }, exit: { opacity: 0, transition: { duration: 0 } } }
    : jabaStoreMotion

  const storeIdsKey = groups.map((group) => group.store_id).join('|')
  const showStoreChips = groups.length >= 3

  useEffect(() => {
    const ids = storeIdsKey ? storeIdsKey.split('|') : []
    setExpandedIds((prev) => {
      if (!prev.size) {
        return new Set(ids.length <= 2 ? ids : ids.slice(0, 1))
      }

      const next = new Set([...prev].filter((id) => ids.includes(id)))
      for (const id of ids) {
        if (!next.has(id) && ids.length <= 2) next.add(id)
      }
      if (!next.size && ids[0]) next.add(ids[0])
      return next
    })
  }, [storeIdsKey])

  useEffect(() => {
    hadItemsRef.current = count > 0
  }, [count])

  function goBack() {
    if (routeLocation.key === 'default') navigate('/comprar')
    else navigate(-1)
  }

  function toggleStore(storeId) {
    setExpandedIds((current) => {
      const next = new Set(current)
      if (next.has(storeId)) next.delete(storeId)
      else next.add(storeId)
      return next
    })
  }

  function jumpToStore(storeId) {
    setExpandedIds((current) => new Set(current).add(storeId))
    requestAnimationFrame(() => {
      sectionRefs.current[storeId]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }

  const summaryLabel =
    count > 0
      ? `${groups.length} ${groups.length === 1 ? 'tienda' : 'tiendas'} · ${count} ${count === 1 ? 'producto' : 'productos'}`
      : 'Agrega productos con Pa\' La Jaba'

  return (
    <>
    <BuyerShell
      headerStart={(
        <div className="flex min-w-0 items-center gap-1">
          <button
            type="button"
            onClick={goBack}
            aria-label="Volver"
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-brand-green touch-manipulation active:bg-brand-green/8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green/25"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <Logo className="h-9 w-9 shrink-0 sm:h-10 sm:w-10" />
        </div>
      )}
    >
        <div className={`${buyerJabaPanelHeader} !px-0`}>
          <div className="min-w-0 flex-1 pr-2">
            <h1 id={titleId} className={buyerJabaPanelTitle}>
              Tu Jaba
            </h1>
          </div>
          {items.length > 0 && location?.province?.id && location?.municipality?.id ? (
            <BuyerShareButton
              iconOnly
              label="Compartir tu jaba"
              onClick={() => setShareOpen(true)}
              className={buyerJabaIconBtn}
            />
          ) : null}
        </div>

        <div className={`${buyerJabaStickySummary} !px-0`}>
          <p className={buyerJabaStickySummaryText}>{summaryLabel}</p>
          {showStoreChips ? (
            <div className={`${buyerJabaStoreChips} mt-2`} role="navigation" aria-label="Ir a tienda">
              {groups.map((group) => (
                <button
                  key={group.store_id}
                  type="button"
                  className={buyerJabaStoreChip}
                  onClick={() => jumpToStore(group.store_id)}
                >
                  {group.store_name}
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div className={`${buyerJabaPanelBody} !overflow-visible !px-0 !pb-[calc(5.5rem+var(--safe-bottom))]`}>
          <PresenceContext.Provider value={null}>
          <AnimatePresence mode="wait" initial={false}>
          {groups.length === 0 ? (
              <motion.div
                key="jaba-empty"
                className="rounded-2xl border border-brand-yellow/25 bg-brand-yellow/10 px-4 py-8 text-center"
                initial={justEmptied && !reduced ? { opacity: 0, y: 36, scale: 0.92 } : false}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={reduced ? { duration: 0 } : { type: 'spring', stiffness: 280, damping: 22 }}
              >
                <motion.img
                  src="/images/welcome/jabi.png"
                  alt="Jabi"
                  className="mx-auto h-36 w-36 object-contain"
                  initial={justEmptied && !reduced ? { opacity: 0, scale: 0.4, rotate: -12 } : false}
                  animate={{ opacity: 1, scale: 1, rotate: 0 }}
                  transition={reduced ? { duration: 0 } : { type: 'spring', stiffness: 320, damping: 16, delay: 0.05 }}
                />
                <p className="mt-3 font-display text-base font-bold text-brand-green">Tu jaba está vacía</p>
                <p className="mt-2 text-sm leading-relaxed text-brand-carmelita">
                  Toca <span className="font-semibold text-brand-green">Pa&apos; La Jaba</span> en un producto para
                  guardarlo aquí. Cada tienda se pide por separado por WhatsApp.
                </p>
                <Link to="/comprar" className={`${buyerJabaPrimaryBtn} mt-5`}>
                  Seguir comprando
                </Link>
              </motion.div>
          ) : (
            <motion.div
              key="jaba-list"
              className="flex flex-col gap-3"
              exit={reduced ? { opacity: 1 } : { opacity: 0, y: -16, scale: 0.98 }}
              transition={reduced ? { duration: 0 } : { duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            >
              <AnimatePresence mode="popLayout" initial={false}>
              {groups.map((group) => (
                <motion.section
                  layout
                  key={group.store_id}
                  id={`jaba-store-${group.store_id}`}
                  className={buyerJabaStoreSection}
                  ref={(node) => {
                    sectionRefs.current[group.store_id] = node
                  }}
                  {...storeMotion}
                >
                <StoreGroup
                  group={group}
                  expanded={expandedIds.has(group.store_id)}
                  onToggle={() => toggleStore(group.store_id)}
                  displayCurrency={displayCurrency}
                  cupPerUnit={cupPerUnit}
                  syncingContacts={syncingContacts}
                  checkoutSubmitting={checkoutSubmittingStoreId === group.store_id}
                  onRequestPickup={requestPickupCheckout}
                  onRequestDelivery={requestDeliveryCheckout}
                  onAskClearStore={(store) => setPendingRemoval({
                    kind: 'store',
                    id: store.store_id,
                    title: 'Vaciar tienda',
                    message: `Se quitarán los productos de ${store.store_name}. Esta acción no se puede deshacer.`,
                    confirmLabel: 'Vaciar',
                  })}
                  onAskRemove={(item) => setPendingRemoval({
                    kind: 'product',
                    id: item.id,
                    title: 'Quitar producto',
                    message: `Se quitará ${item.name} de tu jaba. Esta acción no se puede deshacer.`,
                    confirmLabel: 'Quitar',
                  })}
                  onSetQuantity={setQuantity}
                />
                </motion.section>
              ))}
              </AnimatePresence>
            </motion.div>
          )}
          </AnimatePresence>
          </PresenceContext.Provider>
          <BuyerJabaSuggestions />
        </div>
    </BuyerShell>
    {pendingRemoval ? (
      <ClearStoreModal
        title={pendingRemoval.title}
        message={pendingRemoval.message}
        confirmLabel={pendingRemoval.confirmLabel}
        onClose={() => setPendingRemoval(null)}
        onConfirm={() => {
          const current = pendingRemoval
          setPendingRemoval(null)
          if (current.kind === 'store') clearStore(current.id)
          else removeProduct(current.id)
        }}
      />
    ) : null}
    {shareOpen && location?.province?.id ? (
        <BuyerShareSheet
          title="Compartir tu jaba"
          message={buildJabaShareMessage(items, location)}
          url={buildJabaShareUrl(items, location)}
          onClose={() => setShareOpen(false)}
        />
      ) : null}
    </>
  )
}

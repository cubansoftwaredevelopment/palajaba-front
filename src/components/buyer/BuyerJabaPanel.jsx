import { useEffect, useId, useRef, useState } from 'react'
import { useBuyerDisplayCurrency } from '../../context/BuyerDisplayCurrencyContext'
import { useBuyerJaba } from '../../context/BuyerJabaContext'
import LoadingState from '../ui/LoadingState'
import { allItemsOfferDelivery, resolveStorePhone } from '../../lib/buyerJaba'
import { resolveDisplayPrice } from '../../lib/displayPrice'
import { formatPrice } from '../../lib/money'
import { resolveMediaUrl } from '../../lib/media'
import {
  buyerJabaCheckoutActions,
  buyerJabaIconBtn,
  buyerJabaItemImage,
  buyerJabaItemRow,
  buyerJabaOverlay,
  buyerJabaPanel,
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
} from './buyerStyles'

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

function formatStoreSubtotal(items, displayCurrency, cupPerUnit) {
  const subtotalByCurrency = {}

  for (const item of items) {
    const display = resolveDisplayPrice(item, displayCurrency, cupPerUnit)
    const key = display.currency
    subtotalByCurrency[key] = (subtotalByCurrency[key] ?? 0) + display.amount * (item.quantity ?? 1)
  }

  return Object.entries(subtotalByCurrency)
    .map(([currency, amount]) => formatPrice(amount, currency))
    .join(' + ')
}

function StoreGroup({
  group,
  expanded,
  onToggle,
  sectionRef,
  displayCurrency,
  cupPerUnit,
  syncingContacts,
  checkoutSubmitting,
  onRequestPickup,
  onRequestDelivery,
  onClearStore,
  onRemove,
  onSetQuantity,
}) {
  const panelId = useId()
  const subtotalLabel = formatStoreSubtotal(group.items, displayCurrency, cupPerUnit)
  const storePhone = group.store_phone ?? resolveStorePhone(group.items)
  const canCheckout = Boolean(storePhone) && !syncingContacts && !checkoutSubmitting
  const deliveryAvailable = canCheckout && allItemsOfferDelivery(group.items)

  function handleClearStore(event) {
    event.stopPropagation()
    const confirmed = window.confirm(
      `¿Vaciar los productos de ${group.store_name}? Esta acción no se puede deshacer.`,
    )
    if (confirmed) onClearStore(group.store_id)
  }

  return (
    <section
      ref={sectionRef}
      id={`jaba-store-${group.store_id}`}
      className={buyerJabaStoreSection}
    >
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
              <span className="text-brand-green"> · {subtotalLabel}</span>
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
            {group.items.map((item) => {
              const imageSrc = resolveMediaUrl(item.image_url)
              const display = resolveDisplayPrice(item, displayCurrency, cupPerUnit)
              const qty = item.quantity ?? 1

              return (
                <li key={item.id} className={buyerJabaItemRow}>
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

                    <div className="mt-2 flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => onSetQuantity(item.id, qty - 1)}
                        className={buyerJabaQtyBtn}
                        aria-label={`Quitar uno de ${item.name}`}
                      >
                        −
                      </button>
                      <span className="min-w-6 text-center text-sm font-bold text-brand-green">{qty}</span>
                      <button
                        type="button"
                        onClick={() => onSetQuantity(item.id, qty + 1)}
                        className={buyerJabaQtyBtn}
                        aria-label={`Agregar uno de ${item.name}`}
                      >
                        +
                      </button>
                      <button
                        type="button"
                        onClick={() => onRemove(item.id)}
                        className={`${buyerJabaIconBtn} ml-auto`}
                        aria-label={`Quitar ${item.name} de la jaba`}
                        title="Quitar producto"
                      >
                        <TrashIcon />
                      </button>
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>

          <p className="mt-2 text-xs font-semibold text-brand-carmelita">
            Subtotal: <span className="text-brand-green">{subtotalLabel}</span>
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
                className={buyerJabaPrimaryBtn}
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
    </section>
  )
}

export default function BuyerJabaPanel() {
  const titleId = useId()
  const sectionRefs = useRef({})
  const {
    open,
    closePanel,
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
  const [expandedIds, setExpandedIds] = useState(() => new Set())

  const storeIdsKey = groups.map((group) => group.store_id).join('|')
  const showStoreChips = groups.length >= 3

  useEffect(() => {
    if (!open) {
      setExpandedIds(new Set())
      return
    }

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
  }, [open, storeIdsKey])

  useEffect(() => {
    if (!open) return undefined

    function handleKeyDown(event) {
      if (event.key === 'Escape') closePanel()
    }

    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = ''
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open, closePanel])

  if (!open) return null

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
      <button type="button" className={buyerJabaOverlay} aria-label="Cerrar tu jaba" onClick={closePanel} />

      <div role="dialog" aria-modal="true" aria-labelledby={titleId} className={buyerJabaPanel}>
        <div className={buyerJabaPanelHeader}>
          <div className="min-w-0 flex-1 pr-2">
            <h2 id={titleId} className={buyerJabaPanelTitle}>
              Tu Jaba
            </h2>
          </div>
          <button
            type="button"
            onClick={closePanel}
            className={buyerJabaIconBtn}
            aria-label="Cerrar"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className={buyerJabaStickySummary}>
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

        <div className={buyerJabaPanelBody}>
          {groups.length === 0 ? (
            <div className="rounded-2xl border border-brand-yellow/25 bg-brand-yellow/10 px-4 py-8 text-center">
              <p className="font-display text-base font-bold text-brand-green">Tu jaba está vacía</p>
              <p className="mt-2 text-sm leading-relaxed text-brand-carmelita">
                Toca <span className="font-semibold text-brand-green">Pa&apos; La Jaba</span> en un producto para
                guardarlo aquí. Cada tienda se pide por separado por WhatsApp.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {groups.map((group) => (
                <StoreGroup
                  key={group.store_id}
                  group={group}
                  expanded={expandedIds.has(group.store_id)}
                  onToggle={() => toggleStore(group.store_id)}
                  sectionRef={(node) => {
                    sectionRefs.current[group.store_id] = node
                  }}
                  displayCurrency={displayCurrency}
                  cupPerUnit={cupPerUnit}
                  syncingContacts={syncingContacts}
                  checkoutSubmitting={checkoutSubmittingStoreId === group.store_id}
                  onRequestPickup={requestPickupCheckout}
                  onRequestDelivery={requestDeliveryCheckout}
                  onClearStore={clearStore}
                  onRemove={removeProduct}
                  onSetQuantity={setQuantity}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

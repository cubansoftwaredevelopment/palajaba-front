import { useEffect, useId } from 'react'
import { useBuyerDisplayCurrency } from '../../context/BuyerDisplayCurrencyContext'
import { useBuyerJaba } from '../../context/BuyerJabaContext'
import { allItemsOfferDelivery, resolveStorePhone } from '../../lib/buyerJaba'
import { resolveDisplayPrice } from '../../lib/displayPrice'
import BuyerCurrencySelector from './BuyerCurrencySelector'
import { formatPrice } from '../../lib/money'
import { resolveMediaUrl } from '../../lib/media'
import {
  buyerJabaItemImage,
  buyerJabaItemRow,
  buyerJabaOverlay,
  buyerJabaPanel,
  buyerJabaPanelBody,
  buyerJabaPanelHeader,
  buyerJabaPanelTitle,
  buyerJabaQtyBtn,
  buyerJabaStoreSection,
  buyerJabaStoreTitle,
  buyerJabaCheckoutActions,
  buyerJabaDeliveryBtn,
  buyerJabaWhatsAppBtn,
} from './buyerStyles'

function WhatsAppIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  )
}

function StoreGroup({
  group,
  displayCurrency,
  syncingContacts,
  onCheckout,
  onRequestDelivery,
  onClearStore,
  onRemove,
  onSetQuantity,
}) {
  const subtotalByCurrency = {}

  for (const item of group.items) {
    const display = resolveDisplayPrice(item, displayCurrency)
    const key = display.currency
    subtotalByCurrency[key] = (subtotalByCurrency[key] ?? 0) + display.amount * (item.quantity ?? 1)
  }

  const subtotalLabel = Object.entries(subtotalByCurrency)
    .map(([currency, amount]) => formatPrice(amount, currency))
    .join(' + ')

  const storePhone = group.store_phone ?? resolveStorePhone(group.items)
  const canCheckout = Boolean(storePhone) && !syncingContacts
  const deliveryAvailable = canCheckout && allItemsOfferDelivery(group.items)

  return (
    <section className={buyerJabaStoreSection}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className={buyerJabaStoreTitle}>{group.store_name}</h3>
          <p className="mt-0.5 text-xs font-medium text-brand-carmelita/75">
            {group.itemCount} {group.itemCount === 1 ? 'producto' : 'productos'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => onClearStore(group.store_id)}
          className="shrink-0 text-xs font-semibold text-brand-carmelita/80 underline-offset-2 active:text-brand-green lg:hover:text-brand-green lg:hover:underline"
        >
          Vaciar
        </button>
      </div>

      <ul className="mt-2">
        {group.items.map((item) => {
          const imageSrc = resolveMediaUrl(item.image_url)
          const display = resolveDisplayPrice(item, displayCurrency)
          const qty = item.quantity ?? 1

          return (
            <li key={item.id} className={buyerJabaItemRow}>
              {imageSrc ? (
                <img src={imageSrc} alt="" className={buyerJabaItemImage} loading="lazy" />
              ) : (
                <div className={`${buyerJabaItemImage} flex items-center justify-center text-[0.55rem] font-semibold text-brand-carmelita/45`}>
                  Sin foto
                </div>
              )}

              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 text-sm font-semibold leading-snug text-brand-green">{item.name}</p>
                <p className="mt-0.5 text-xs font-bold text-brand-green">{display.label}</p>

                <div className="mt-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onSetQuantity(item.id, qty - 1)}
                    className={buyerJabaQtyBtn}
                    aria-label={`Quitar uno de ${item.name}`}
                  >
                    −
                  </button>
                  <span className="min-w-5 text-center text-sm font-bold text-brand-green">{qty}</span>
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
                    className="ml-auto text-xs font-semibold text-brand-carmelita/80 underline-offset-2 active:text-brand-green lg:hover:text-brand-green lg:hover:underline"
                  >
                    Quitar
                  </button>
                </div>
              </div>
            </li>
          )
        })}
      </ul>

      <p className="mt-2 text-xs font-semibold text-brand-carmelita/85">
        Subtotal: <span className="text-brand-green">{subtotalLabel}</span>
      </p>

      {deliveryAvailable ? (
        <div className={buyerJabaCheckoutActions}>
          <button
            type="button"
            onClick={() => onRequestDelivery(group.store_id)}
            className={buyerJabaDeliveryBtn}
          >
            Pedir a domicilio
          </button>
          <button
            type="button"
            onClick={() => onCheckout(group.store_id)}
            className={buyerJabaWhatsAppBtn}
          >
            <WhatsAppIcon />
            Coordinar por WhatsApp
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => onCheckout(group.store_id)}
          disabled={!canCheckout}
          className={buyerJabaWhatsAppBtn}
        >
          <WhatsAppIcon />
          Pedir por WhatsApp
        </button>
      )}

      {syncingContacts ? (
        <p className="mt-2 text-center text-[0.65rem] text-brand-carmelita/75">
          Buscando teléfono de la tienda…
        </p>
      ) : null}

      {!syncingContacts && !canCheckout ? (
        <p className="mt-2 text-center text-[0.65rem] text-brand-carmelita/75">
          Esta tienda no tiene teléfono disponible para pedidos.
        </p>
      ) : null}
    </section>
  )
}

export default function BuyerJabaPanel() {
  const titleId = useId()
  const {
    open,
    closePanel,
    groups,
    count,
    syncingContacts,
    checkoutStore,
    requestDeliveryCheckout,
    clearStore,
    removeProduct,
    setQuantity,
  } = useBuyerJaba()
  const { currency: displayCurrency } = useBuyerDisplayCurrency()

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

  return (
    <>
      <button type="button" className={buyerJabaOverlay} aria-label="Cerrar tu jaba" onClick={closePanel} />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={buyerJabaPanel}
      >
        <div className={buyerJabaPanelHeader}>
          <div className="min-w-0 flex-1 pr-3">
            <h2 id={titleId} className={buyerJabaPanelTitle}>
              Tu Jaba
            </h2>
            <p className="text-xs font-medium text-brand-carmelita/80">
              {count > 0
                ? `${count} ${count === 1 ? 'producto' : 'productos'} · ${groups.length} ${groups.length === 1 ? 'tienda' : 'tiendas'}`
                : 'Agrega productos con Pa\' La Jaba'}
            </p>
          </div>
          <BuyerCurrencySelector panelZIndex={110} />
          <button
            type="button"
            onClick={closePanel}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-brand-green transition-colors active:bg-brand-green/8 lg:hover:bg-brand-green/8"
            aria-label="Cerrar"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className={buyerJabaPanelBody}>
          {groups.length === 0 ? (
            <div className="rounded-2xl border border-brand-yellow/25 bg-brand-yellow/10 px-4 py-8 text-center">
              <p className="font-display text-base font-bold text-brand-green">Tu jaba está vacía</p>
              <p className="mt-2 text-sm leading-relaxed text-brand-carmelita/85">
                Toca <span className="font-semibold text-brand-green">Pa&apos; La Jaba</span> en un producto para guardarlo aquí.
                Cada tienda se pide por separado por WhatsApp.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {groups.map((group) => (
                <StoreGroup
                  key={group.store_id}
                  group={group}
                  displayCurrency={displayCurrency}
                  syncingContacts={syncingContacts}
                  onCheckout={checkoutStore}
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

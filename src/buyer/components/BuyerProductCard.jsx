import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useLocation, useNavigate } from 'react-router-dom'
import { useBuyerJaba } from '../context.js'
import { useBuyerDisplayCurrency } from '../context.js'
import { useDisplayedLocation } from '../context.js'
import { JABA_CHANGE_EVENT } from '../../lib/buyerJaba'
import {
  BUYER_PRODUCT_CARD_ACTIONS,
  resolveBuyerProductStorePath,
} from '../../lib/buyerProductCardView'
import { productDiscountPercent, resolveDisplayPrices } from '../../lib/displayPrice'
import { resolveMediaUrl } from '../../lib/media'
import { isProductPurchasable, isProductSoldOut } from '../../lib/marketplaceProduct'
import BuyerProductDetailModal from './BuyerProductDetailModal'
import BuyerShareSheet, { BuyerShareButton } from './BuyerShareSheet'
import { buildProductShareMessage, buildProductShareUrl } from '../../lib/buyerShare'
import BuyerProductImage from './BuyerProductImage'
import BuyerProductPrices from './BuyerProductPrices'
import BuyerProductSoldOutOverlay from './BuyerProductSoldOutOverlay'
import QvaPayProductBadge from './QvaPayProductBadge'
import { isCustomerAuthenticated, getCustomerProfile, getCustomerToken, updateCustomerProfile, CUSTOMER_AUTH_CHANGE_EVENT } from '../../lib/customerAuth'
import { addCustomerFavorite, removeCustomerFavorite } from '../api.js'
import {
  buyerProductActions,
  buyerProductBody,
  buyerProductBtnBuy,
  buyerProductBtnJaba,
  buyerProductBtnJabaActive,
  buyerProductCard,
  buyerProductCardCompact,
  buyerProductImageWrap,
  buyerProductName,
  buyerProductDiscountBadge,
  buyerProductPrice,
  buyerProductStore,
} from './buyerStyles'

function JabaBagIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      aria-hidden="true"
      className="shrink-0"
    >
      <path d="M6 8h12l-1 12H7L6 8z" strokeLinejoin="round" />
      <path d="M9 8V7a3 3 0 0 1 6 0v1" strokeLinecap="round" />
      <path d="M10 12h4" strokeLinecap="round" />
    </svg>
  )
}

export default function BuyerProductCard({ product, compact = false, onFavoriteChange, buyWarning = '', allowBuyAfterWarning = false }) {
  const navigate = useNavigate()
  const route = useLocation()
  const { currencies: displayCurrencies, cupPerUnit } = useBuyerDisplayCurrency()
  const location = useDisplayedLocation()
  const { isInJaba: checkInJaba, addProduct, buyProduct } = useBuyerJaba()
  const imageSrc = resolveMediaUrl(product.image_url, { width: 400 })
  const displayPrices = resolveDisplayPrices(product, displayCurrencies, cupPerUnit)
  const discountPercent = productDiscountPercent(product)
  const [buyPulse, setBuyPulse] = useState(false)
  const [jabaPulse, setJabaPulse] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [buyWarningOpen, setBuyWarningOpen] = useState(false)
  const [warningAction, setWarningAction] = useState('buy')
  const [inJaba, setInJaba] = useState(() => checkInJaba(product.id))
  const [favorite, setFavorite] = useState(() => getCustomerProfile()?.favorite_product_ids?.includes(product.id) ?? false)

  const storePath = resolveBuyerProductStorePath(product.store)

  useEffect(() => {
    function syncJabaState() {
      setInJaba(checkInJaba(product.id))
    }

    window.addEventListener(JABA_CHANGE_EVENT, syncJabaState)
    return () => window.removeEventListener(JABA_CHANGE_EVENT, syncJabaState)
  }, [checkInJaba, product.id])

  useEffect(() => {
    const syncFavorite = (event) => setFavorite((event.detail?.favorite_product_ids ?? []).includes(product.id))
    window.addEventListener(CUSTOMER_AUTH_CHANGE_EVENT, syncFavorite)
    return () => window.removeEventListener(CUSTOMER_AUTH_CHANGE_EVENT, syncFavorite)
  }, [product.id])

  async function handleFavorite(event) {
    event.stopPropagation()
    if (!isCustomerAuthenticated()) {
      try { sessionStorage.setItem('pala_jaba_pending_favorite', product.id) } catch { /* ignore */ }
      navigate('/login', { state: { accountType: 'customer', backTo: `${route.pathname}${route.search}${route.hash}` } })
      return
    }
    try {
      const result = favorite
        ? await removeCustomerFavorite(getCustomerToken(), product.id)
        : await addCustomerFavorite(getCustomerToken(), product.id)
      updateCustomerProfile(result)
      setFavorite(!favorite)
      onFavoriteChange?.(!favorite, result)
    } catch {
      window.alert('No pudimos actualizar tus favoritos. Inténtalo de nuevo.')
    }
  }

  function pulse(setter) {
    setter(true)
    window.setTimeout(() => setter(false), 450)
  }

  async function handleBuy(event, acknowledged = false) {
    event?.stopPropagation?.()
    if (buyWarning && !acknowledged) {
      setWarningAction('buy')
      setBuyWarningOpen(true)
      return false
    }
    const checkoutProduct = acknowledged && product.pickup_required
      ? { ...product, offers_delivery: false }
      : product
    const success = await buyProduct(checkoutProduct)
    if (!success) return
    pulse(setBuyPulse)
    setDetailOpen(false)
  }

  function handleAddToJaba(event, acknowledged = false) {
    event?.stopPropagation?.()
    if (buyWarning && !acknowledged) {
      setWarningAction('add')
      setBuyWarningOpen(true)
      return
    }
    const jabaProduct = acknowledged && product.pickup_required
      ? { ...product, offers_delivery: false }
      : product
    addProduct(jabaProduct)
    setInJaba(true)
    pulse(setJabaPulse)
  }

  function openDetail() {
    setDetailOpen(true)
  }

  const canPurchase = isProductPurchasable(product)
  const soldOut = isProductSoldOut(product)
  const jabaBtnClass = inJaba ? buyerProductBtnJabaActive : buyerProductBtnJaba

  return (
    <>
      <article className={compact ? buyerProductCardCompact : buyerProductCard}>
        {location?.province?.id && location?.municipality?.id ? (
          <BuyerShareButton
            iconOnly
            label={`Compartir ${product.name}`}
            onClick={(event) => {
              event.stopPropagation()
              setShareOpen(true)
            }}
            className="absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-brand-white/90 text-brand-green shadow-[0_2px_8px_rgba(28,33,24,0.16)] touch-manipulation active:bg-brand-white"
          />
        ) : null}
        <div
          className={
            soldOut
              ? 'flex min-h-0 flex-1 flex-col grayscale'
              : 'flex min-h-0 flex-1 flex-col'
          }
        >
          <div className={buyerProductImageWrap}>
            <button type="button" onClick={openDetail} className="absolute inset-0 h-full w-full touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-green/25" aria-label={`Ver detalles de ${product.name}${soldOut ? ' (agotado)' : ''}`}>
              <BuyerProductImage src={imageSrc} />
              {discountPercent ? (
                <span className={buyerProductDiscountBadge}>-{discountPercent}%</span>
              ) : null}
            </button>
            {product.store?.qvapay_enabled ? (
              <QvaPayProductBadge className="absolute bottom-2 left-2 z-10" />
            ) : null}
            <button type="button" onClick={handleFavorite} className="absolute bottom-2 right-2 z-10 grid h-9 w-9 place-items-center rounded-full bg-brand-white/95 text-brand-carmelita shadow-[0_2px_8px_rgba(28,33,24,0.2)]" aria-label={favorite ? 'Quitar de guardados' : 'Guardar oferta'} title={favorite ? 'Quitar de guardados' : 'Guardar oferta'}>
              <svg width="19" height="19" viewBox="0 0 24 24" fill={favorite ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 4.75A1.75 1.75 0 0 1 7.75 3h8.5A1.75 1.75 0 0 1 18 4.75V21l-6-4-6 4V4.75Z" /></svg>
            </button>
          </div>

          <button type="button" onClick={openDetail} className={`${buyerProductBody} w-full text-left touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-green/25`} aria-label={`Ver detalles de ${product.name}${soldOut ? ' (agotado)' : ''}`}>
              <h3 className={buyerProductName}>{product.name}</h3>
              <BuyerProductPrices
                prices={displayPrices}
                priceClassName={`${buyerProductPrice} !mt-0`}
              />
          </button>

          {product.store?.store_name && storePath ? (
            <div className="shrink-0 px-2 pb-1">
              <Link
                to={storePath}
                onClick={(event) => event.stopPropagation()}
                className={buyerProductStore}
                aria-label={`Ver tienda ${product.store.store_name}`}
              >
                {product.store.store_name}
              </Link>
            </div>
          ) : product.store?.store_name ? (
            <p className={`${buyerProductStore} shrink-0 px-2 pb-1 no-underline`}>
              {product.store.store_name}
            </p>
          ) : null}

          {canPurchase ? (
            <div
              className={`${buyerProductActions} px-2 pb-2`}
              data-action-layout={BUYER_PRODUCT_CARD_ACTIONS.layout}
            >
              <button
                type="button"
                onClick={handleBuy}
                data-action={BUYER_PRODUCT_CARD_ACTIONS.primary}
                className={`${buyerProductBtnBuy} ${buyPulse ? 'animate-[pulse_0.45s_ease-out]' : ''}`}
              >
                Comprar
              </button>
              <button
                type="button"
                onClick={handleAddToJaba}
                data-action={BUYER_PRODUCT_CARD_ACTIONS.secondary}
                className={`${jabaBtnClass} ${jabaPulse ? 'animate-[pulse_0.45s_ease-out]' : ''}`}
                aria-label={inJaba ? `${product.name} en tu jaba` : `Agregar ${product.name} a la jaba`}
              >
                <JabaBagIcon />
                <span>Pa&apos; La Jaba</span>
              </button>
            </div>
          ) : null}
        </div>

        {soldOut ? <BuyerProductSoldOutOverlay fullCard /> : null}
      </article>

      {detailOpen ? (
        <BuyerProductDetailModal
          product={product}
          inJaba={inJaba}
          favorite={favorite}
          onFavorite={handleFavorite}
          onClose={() => setDetailOpen(false)}
          onBuy={handleBuy}
          onAddToJaba={handleAddToJaba}
        />
      ) : null}
      {shareOpen && location?.province?.id ? (
        <BuyerShareSheet
          title="Compartir producto"
          message={buildProductShareMessage(product, location)}
          url={buildProductShareUrl(product.id, location)}
          onClose={() => setShareOpen(false)}
        />
      ) : null}
      {buyWarningOpen ? (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/45 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setBuyWarningOpen(false) }}>
          <section role="alertdialog" aria-modal="true" aria-labelledby={`favorite-buy-warning-${product.id}`} className="w-full max-w-sm rounded-3xl bg-brand-white p-5 text-brand-carmelita shadow-2xl">
            <h2 id={`favorite-buy-warning-${product.id}`} className="font-display text-lg font-bold text-brand-green">Aviso sobre tu municipio</h2>
            <p className="mt-2 text-sm leading-relaxed">{buyWarning}</p>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setBuyWarningOpen(false)} className="min-h-10 rounded-xl border border-brand-green/20 px-4 text-sm font-semibold">Entendido</button>
              {allowBuyAfterWarning ? <button type="button" onClick={() => { setBuyWarningOpen(false); if (warningAction === 'add') handleAddToJaba(undefined, true); else void handleBuy(undefined, true) }} className="min-h-10 rounded-xl bg-brand-green px-4 text-sm font-bold text-white">Continuar</button> : <button type="button" onClick={() => { setBuyWarningOpen(false); navigate('/comprar/municipio') }} className="min-h-10 rounded-xl bg-brand-green px-4 text-sm font-bold text-white">Cambiar municipio</button>}
            </div>
          </section>
        </div>
      ) : null}
    </>
  )
}

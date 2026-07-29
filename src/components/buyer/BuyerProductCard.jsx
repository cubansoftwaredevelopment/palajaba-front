import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useBuyerJaba } from '../../context/BuyerJabaContext'
import { useBuyerDisplayCurrency } from '../../context/BuyerDisplayCurrencyContext'
import { JABA_CHANGE_EVENT } from '../../lib/buyerJaba'
import {
  BUYER_PRODUCT_CARD_ACTIONS,
  resolveBuyerProductStorePath,
} from '../../lib/buyerProductCardView'
import { resolveDisplayPrice } from '../../lib/displayPrice'
import { resolveMediaUrl } from '../../lib/media'
import { isProductPurchasable, isProductSoldOut } from '../../lib/marketplaceProduct'
import BuyerProductDetailModal from './BuyerProductDetailModal'
import BuyerProductImage from './BuyerProductImage'
import BuyerProductSoldOutOverlay from './BuyerProductSoldOutOverlay'
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

export default function BuyerProductCard({ product, compact = false }) {
  const { currency: displayCurrency, cupPerUnit } = useBuyerDisplayCurrency()
  const { isInJaba: checkInJaba, addProduct, buyProduct } = useBuyerJaba()
  const imageSrc = resolveMediaUrl(product.image_url)
  const displayPrice = resolveDisplayPrice(product, displayCurrency, cupPerUnit)
  const [buyPulse, setBuyPulse] = useState(false)
  const [jabaPulse, setJabaPulse] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [inJaba, setInJaba] = useState(() => checkInJaba(product.id))

  const storePath = resolveBuyerProductStorePath(product.store)

  useEffect(() => {
    function syncJabaState() {
      setInJaba(checkInJaba(product.id))
    }

    window.addEventListener(JABA_CHANGE_EVENT, syncJabaState)
    return () => window.removeEventListener(JABA_CHANGE_EVENT, syncJabaState)
  }, [checkInJaba, product.id])

  function pulse(setter) {
    setter(true)
    window.setTimeout(() => setter(false), 450)
  }

  async function handleBuy(event) {
    event?.stopPropagation?.()
    const success = await buyProduct(product)
    if (!success) return
    pulse(setBuyPulse)
    setDetailOpen(false)
  }

  function handleAddToJaba(event) {
    event?.stopPropagation?.()
    addProduct(product)
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
        <div className={soldOut ? 'flex min-h-0 flex-1 flex-col grayscale' : 'flex min-h-0 flex-1 flex-col'}>
          <button
            type="button"
            onClick={openDetail}
            className="flex min-h-0 w-full flex-1 flex-col text-left touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-green/25"
            aria-label={`Ver detalles de ${product.name}${soldOut ? ' (agotado)' : ''}`}
          >
            <div className={buyerProductImageWrap}>
              <BuyerProductImage src={imageSrc} />
            </div>

            <div className={buyerProductBody}>
              <h3 className={buyerProductName}>{product.name}</h3>
              <p className={buyerProductPrice}>{displayPrice.label}</p>
            </div>
          </button>

          {product.store?.store_name && storePath ? (
            <div className="px-2 pb-1">
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
            <p className={`${buyerProductStore} px-2 pb-1 no-underline`}>{product.store.store_name}</p>
          ) : null}

          {canPurchase ? (
            <div className={`${buyerProductActions} px-2 pb-2`} data-action-layout={BUYER_PRODUCT_CARD_ACTIONS.layout}>
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
                <span>{inJaba ? 'En Tu Jaba' : "Pa' La Jaba"}</span>
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
          onClose={() => setDetailOpen(false)}
          onBuy={handleBuy}
          onAddToJaba={handleAddToJaba}
        />
      ) : null}
    </>
  )
}

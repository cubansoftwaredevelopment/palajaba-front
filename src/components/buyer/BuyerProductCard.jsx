import { useEffect, useState } from 'react'
import { useBuyerJaba } from '../../context/BuyerJabaContext'
import { useBuyerDisplayCurrency } from '../../context/BuyerDisplayCurrencyContext'
import { JABA_CHANGE_EVENT, isInJaba } from '../../lib/buyerJaba'
import { resolveDisplayPrice } from '../../lib/displayPrice'
import { resolveMediaUrl } from '../../lib/media'
import { isProductPurchasable, isProductSoldOut, getProductPickupDisplay } from '../../lib/marketplaceProduct'
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
  buyerProductPickupHint,
  buyerProductPickupRibbon,
  buyerProductPrice,
  buyerProductStore,
} from './buyerStyles'

export default function BuyerProductCard({ product, compact = false }) {
  const { currency: displayCurrency, cupPerUnit } = useBuyerDisplayCurrency()
  const { isInJaba: checkInJaba, addProduct, buyProduct } = useBuyerJaba()
  const imageSrc = resolveMediaUrl(product.image_url)
  const displayPrice = resolveDisplayPrice(product, displayCurrency, cupPerUnit)
  const [buyPulse, setBuyPulse] = useState(false)
  const [jabaPulse, setJabaPulse] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [inJaba, setInJaba] = useState(() => checkInJaba(product.id))

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
  const pickup = getProductPickupDisplay(product)

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
            {pickup.requiresPickup ? (
              <span className={buyerProductPickupRibbon}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                  <path d="M12 21s7-4.35 7-10a7 7 0 10-14 0c0 5.65 7 10 7 10z" />
                  <path d="M12 11v4" />
                  <circle cx="12" cy="8.5" r="0.75" fill="currentColor" stroke="none" />
                </svg>
                Sin domicilio
              </span>
            ) : null}
          </div>

          <div className={buyerProductBody}>
            <p className={buyerProductPrice}>{displayPrice.label}</p>
            <h3 className={buyerProductName}>{product.name}</h3>
            {pickup.requiresPickup ? (
              <p className={buyerProductPickupHint}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="shrink-0" aria-hidden="true">
                  <path d="M5 12h14" />
                  <path d="M12 5l7 7-7 7" />
                </svg>
                {pickup.municipalityName
                  ? `Recoger en ${pickup.municipalityName}`
                  : 'Recogida en tienda'}
              </p>
            ) : null}
            <p className={buyerProductStore}>{product.store.store_name}</p>
          </div>
        </button>

        {canPurchase ? (
          <div className={`${buyerProductActions} px-2 pb-2`}>
            <button
              type="button"
              onClick={handleBuy}
              className={`${buyerProductBtnBuy} ${buyPulse ? 'animate-[pulse_0.45s_ease-out]' : ''}`}
            >
              Comprar
            </button>
            <button
              type="button"
              onClick={handleAddToJaba}
              className={`${inJaba ? buyerProductBtnJabaActive : buyerProductBtnJaba} ${jabaPulse ? 'animate-[pulse_0.45s_ease-out]' : ''}`}
              aria-label={inJaba ? `${product.name} en tu jaba` : `Agregar ${product.name} a la jaba`}
            >
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


import { useEffect, useState } from 'react'
import { useBuyerJaba } from '../../context/BuyerJabaContext'
import { useBuyerDisplayCurrency } from '../../context/BuyerDisplayCurrencyContext'
import { JABA_CHANGE_EVENT, isInJaba } from '../../lib/buyerJaba'
import { resolveDisplayPrice } from '../../lib/displayPrice'
import { resolveMediaUrl } from '../../lib/media'
import BuyerProductDetailModal from './BuyerProductDetailModal'
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

export default function BuyerProductCard({ product, compact = false }) {
  const { currency: displayCurrency } = useBuyerDisplayCurrency()
  const { isInJaba: checkInJaba, addProduct, buyProduct } = useBuyerJaba()
  const imageSrc = resolveMediaUrl(product.image_url)
  const displayPrice = resolveDisplayPrice(product, displayCurrency)
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

  function handleBuy(event) {
    event?.stopPropagation?.()
    buyProduct(product)
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

  const canPurchase = !product.view_only

  return (
    <>
      <article className={compact ? buyerProductCardCompact : buyerProductCard}>
        <button
          type="button"
          onClick={openDetail}
          className="flex min-h-0 w-full flex-1 flex-col text-left touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-green/25"
          aria-label={`Ver detalles de ${product.name}`}
        >
          <div className={buyerProductImageWrap}>
            {imageSrc ? (
              <img src={imageSrc} alt="" className="h-full w-full object-cover" loading="lazy" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-[0.65rem] font-semibold text-brand-carmelita/45">
                Sin foto
              </div>
            )}
          </div>

          <div className={buyerProductBody}>
            <p className={buyerProductPrice}>{displayPrice.label}</p>
            <h3 className={buyerProductName}>{product.name}</h3>
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
              {!inJaba ? <JabaBagIcon className="h-3 w-3 sm:h-3.5 sm:w-3.5" alt="" /> : null}
              <span>{inJaba ? 'En Tu Jaba' : "Pa' La Jaba"}</span>
            </button>
          </div>
        ) : null}
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


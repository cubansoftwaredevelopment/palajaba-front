import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { storeNameToSlug, storePublicPath } from '../../lib/storeSlug'

import { useBuyerDisplayCurrency } from '../../context/BuyerDisplayCurrencyContext'

import { resolveDisplayPrice } from '../../lib/displayPrice'

import { formatPrice } from '../../lib/money'

import { resolveMediaUrl } from '../../lib/media'
import { recordProductPopularity } from '../../lib/productPopularity'

import BuyerModalPortal from './BuyerModalPortal'
import JabaBagIcon from './JabaBagIcon'

import {

  buyerProductBtnBuy,

  buyerProductBtnJaba,

  buyerProductBtnJabaActive,

  buyerProductDetailBody,

  buyerProductDetailHero,

  buyerProductDetailHeroImage,

  buyerProductDetailModal,

  buyerProductDetailName,

  buyerProductDetailOverlay,

  buyerProductDetailPrice,

  buyerProductDetailSectionTitle,

  buyerProductDetailSpecCard,

  buyerProductDetailSpecGrid,

  buyerProductDetailSpecLabel,

  buyerProductDetailSpecValue,

  buyerProductDetailStickyBar,

  buyerStoreStripAvatar,

  buyerStoreStripLabel,

  buyerStoreStripLink,

  buyerStoreStripName,

} from './buyerStyles'



const DESCRIPTION_PREVIEW_LENGTH = 160



function StoreStrip({ store }) {

  const photoSrc = resolveMediaUrl(store.profile_photo_url)

  const initials = store.store_name?.trim().slice(0, 2).toUpperCase() || '?'
  const storeSlug = store.store_slug || storeNameToSlug(store.store_name)



  return (

    <Link
      to={storePublicPath(storeSlug)}
      className={buyerStoreStripLink}
      aria-label={`Ver tienda ${store.store_name}`}
    >

      <div className={buyerStoreStripAvatar}>

        {photoSrc ? (

          <img src={photoSrc} alt="" className="h-full w-full object-cover" />

        ) : (

          <span>{initials}</span>

        )}

      </div>

      <div className="min-w-0 flex-1">

        <p className={buyerStoreStripLabel}>Vendido por</p>

        <p className={buyerStoreStripName}>{store.store_name}</p>

      </div>

      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="shrink-0 text-brand-carmelita/60"
        aria-hidden="true"
      >
        <path d="M9 18l6-6-6-6" />
      </svg>

    </Link>

  )

}



function SpecCard({ label, children }) {

  return (

    <div className={buyerProductDetailSpecCard}>

      <p className={buyerProductDetailSpecLabel}>{label}</p>

      <p className={buyerProductDetailSpecValue}>{children}</p>

    </div>

  )

}



export default function BuyerProductDetailModal({

  product,

  inJaba,

  onClose,

  onBuy,

  onAddToJaba,

}) {

  const { currency: displayCurrency } = useBuyerDisplayCurrency()

  const imageSrc = resolveMediaUrl(product.image_url)

  const displayPrice = resolveDisplayPrice(product, displayCurrency)

  const [descriptionExpanded, setDescriptionExpanded] = useState(false)



  const acceptedCurrencies = useMemo(

    () => [

      product.base_currency,

      ...(product.accepted_currencies ?? []).filter((currency) => currency !== product.base_currency),

    ],

    [product.accepted_currencies, product.base_currency],

  )



  const canPurchase = !product.view_only

  const description = product.description?.trim() ?? ''

  const hasLongDescription = description.length > DESCRIPTION_PREVIEW_LENGTH

  const descriptionPreview = hasLongDescription && !descriptionExpanded

    ? `${description.slice(0, DESCRIPTION_PREVIEW_LENGTH).trimEnd()}…`

    : description



  useEffect(() => {
    recordProductPopularity(product.id, 'view')

    function onKeyDown(event) {
      if (event.key === 'Escape') onClose()
    }

    document.addEventListener('keydown', onKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = ''
    }
  }, [onClose, product.id])



  return (

    <BuyerModalPortal>

      <div

        className={buyerProductDetailOverlay}

        role="presentation"

        onMouseDown={(event) => {

          if (event.target === event.currentTarget) onClose()

        }}

      >

        <div

          role="dialog"

          aria-modal="true"

          aria-labelledby="buyer-product-detail-title"

          className={`${buyerProductDetailModal} h-[min(92dvh,44rem)]`}

        >

          <div className="shrink-0 px-5 pt-3">

            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-brand-green/15 sm:hidden" aria-hidden="true" />

            <div className="flex items-center justify-between gap-3">

              <span className="rounded-full bg-brand-green/8 px-2.5 py-1 text-[0.62rem] font-bold uppercase tracking-[0.06em] text-brand-green">

                {product.category_name}

              </span>

              <button

                type="button"

                onClick={onClose}

                className="flex h-10 w-10 items-center justify-center rounded-full text-brand-carmelita touch-manipulation active:bg-brand-green/8"

                aria-label="Cerrar"

              >

                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>

                  <path d="M18 6 6 18M6 6l12 12" />

                </svg>

              </button>

            </div>

          </div>



          <div className={buyerProductDetailBody}>

            <div className={buyerProductDetailHero}>

              <div className={buyerProductDetailHeroImage}>

                {imageSrc ? (

                  <img src={imageSrc} alt="" className="h-full w-full object-cover" />

                ) : (

                  <div className="flex h-full items-center justify-center text-sm font-semibold text-brand-carmelita/60">

                    Sin foto

                  </div>

                )}

              </div>

            </div>



            <div className="px-5 pt-4">

              <p className={buyerProductDetailPrice}>{displayPrice.label}</p>

              {displayPrice.converted ? (

                <p className="mt-1 text-xs font-medium text-brand-carmelita/75">

                  Precio en tienda: {formatPrice(product.base_price, product.base_currency)}

                </p>

              ) : null}



              <h2 id="buyer-product-detail-title" className={buyerProductDetailName}>

                {product.name}

              </h2>



              {product.view_only ? (

                <p className="mt-2 inline-flex rounded-full bg-brand-yellow/18 px-2.5 py-1 text-[0.65rem] font-bold text-brand-carmelita">

                  Solo consulta — sin compra directa

                </p>

              ) : null}

            </div>



            <div className="mt-4 px-5">

              <StoreStrip store={product.store} />

            </div>



            <div className="mt-5 px-5">

              <h3 className={buyerProductDetailSectionTitle}>Detalles</h3>

              <div className={buyerProductDetailSpecGrid}>

                <SpecCard label="Entrega">

                  {product.offers_delivery ? 'A domicilio disponible' : 'Recogida en tienda'}

                </SpecCard>

                <SpecCard label="Monedas">{acceptedCurrencies.join(' · ')}</SpecCard>

              </div>

            </div>



            <div className="mt-5 px-5 pb-2">

              <h3 className={buyerProductDetailSectionTitle}>Descripción</h3>

              {description ? (

                <div className="rounded-2xl border border-brand-green/10 bg-brand-green/[0.02] px-4 py-3.5">

                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-brand-carmelita/90">

                    {descriptionPreview}

                  </p>

                  {hasLongDescription ? (

                    <button

                      type="button"

                      onClick={() => setDescriptionExpanded((current) => !current)}

                      className="mt-2 text-sm font-semibold text-brand-green underline-offset-2 hover:underline"

                    >

                      {descriptionExpanded ? 'Ver menos' : 'Leer más'}

                    </button>

                  ) : null}

                </div>

              ) : (

                <p className="rounded-2xl border border-dashed border-brand-green/15 bg-brand-green/[0.02] px-4 py-3.5 text-sm italic text-brand-carmelita/65">

                  La tienda aún no agregó una descripción para este producto.

                </p>

              )}

            </div>

          </div>



          {canPurchase ? (

            <div className={buyerProductDetailStickyBar}>

              <div className="grid grid-cols-2 gap-2">

                <button type="button" onClick={onBuy} className={`${buyerProductBtnBuy} !min-h-11 !text-sm`}>

                  Comprar

                </button>

                <button

                  type="button"

                  onClick={onAddToJaba}

                  className={`${inJaba ? buyerProductBtnJabaActive : buyerProductBtnJaba} !min-h-11 !text-sm`}

                >

                  {!inJaba ? <JabaBagIcon className="h-3.5 w-3.5" alt="" /> : null}

                  <span>{inJaba ? 'En Tu Jaba' : "Pa' La Jaba"}</span>

                </button>

              </div>

            </div>

          ) : (

            <div className="shrink-0 border-t border-brand-green/8 bg-brand-white/95 px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur-sm">

              <p className="rounded-xl border border-brand-yellow/25 bg-brand-yellow/12 px-3 py-2.5 text-center text-sm font-medium text-brand-green">

                Este producto es solo para consulta. Escríbele a la tienda por WhatsApp para más información.

              </p>

            </div>

          )}

        </div>

      </div>

    </BuyerModalPortal>

  )

}



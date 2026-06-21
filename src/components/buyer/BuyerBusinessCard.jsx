import { Link } from 'react-router-dom'
import { resolveMediaUrl } from '../../lib/media'
import { getBusinessPickupDisplay } from '../../lib/marketplaceBusiness'
import { storePublicPath } from '../../lib/storeSlug'
import {
  buyerBusinessCard,
  buyerBusinessCardBody,
  buyerBusinessCardCatalogBtn,
  buyerBusinessCardImage,
  buyerBusinessCardImageFallback,
  buyerBusinessCardImageWrap,
  buyerBusinessCardLocation,
  buyerBusinessCardMunicipality,
  buyerBusinessCardName,
  buyerBusinessCardProductCount,
  buyerBusinessCardProvince,
  buyerProductPickupHint,
  buyerProductPickupRibbon,
} from './buyerStyles'

function formatPublishedProducts(count) {
  if (count === 0) return 'Sin productos publicados'
  if (count === 1) return '1 producto publicado'
  return `${count} productos publicados`
}

export default function BuyerBusinessCard({ business }) {
  const store = business.store
  const photoSrc = resolveMediaUrl(store.profile_photo_url)
  const initials = store.store_name?.trim().slice(0, 2).toUpperCase() || '?'
  const area = business.business_area
  const catalogPath = storePublicPath(store.store_slug)
  const pickup = getBusinessPickupDisplay(business)

  return (
    <article className={buyerBusinessCard}>
      <div className={buyerBusinessCardImageWrap}>
        {photoSrc ? (
          <img src={photoSrc} alt="" className={buyerBusinessCardImage} loading="lazy" decoding="async" />
        ) : (
          <div className={buyerBusinessCardImageFallback} aria-hidden>
            {initials}
          </div>
        )}
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

      <div className={buyerBusinessCardBody}>
        <h2 className={buyerBusinessCardName}>{store.store_name}</h2>

        {area ? (
          <div className={buyerBusinessCardLocation}>
            <p className={buyerBusinessCardMunicipality}>{area.municipality_name}</p>
            <p className={buyerBusinessCardProvince}>{area.province_name}</p>
          </div>
        ) : null}

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

        <p className={buyerBusinessCardProductCount}>
          {formatPublishedProducts(business.published_product_count ?? 0)}
        </p>

        <Link to={catalogPath} className={buyerBusinessCardCatalogBtn}>
          Ver catálogo
        </Link>
      </div>
    </article>
  )
}

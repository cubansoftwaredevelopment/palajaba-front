import { useEffect, useState } from 'react'
import SellerLocationPreview from '../seller/SellerLocationPreview'
import { resolveMediaUrl } from '../../lib/media'
import BuyerModalPortal from './BuyerModalPortal'
import {
  buyerContextChip,
  buyerStoreMapModal,
  buyerStoreMapModalBody,
  buyerStoreMapModalHeader,
  buyerStoreMapOverlay,
  buyerStorePageAvatar,
  buyerStorePageBio,
  buyerStorePageHeader,
  buyerStorePageMapBtn,
  buyerStorePageMeta,
  buyerStorePageMetaLabel,
  buyerStorePageMetaValue,
  buyerStorePageName,
  buyerStorePageSectionTitle,
  buyerStorePageSocialLink,
} from './buyerStyles'

function socialUrl(value, platform) {
  const trimmed = value?.trim()
  if (!trimmed) return null
  if (/^https?:\/\//i.test(trimmed)) return trimmed

  const handle = trimmed.replace(/^@/, '')
  if (platform === 'instagram') return `https://instagram.com/${handle}`
  return `https://facebook.com/${handle}`
}

function formatArea(area) {
  if (!area) return null
  return `${area.municipality_name}, ${area.province_name}`
}

export default function BuyerStoreProfileHeader({ catalog }) {
  const store = catalog.store
  const photoSrc = resolveMediaUrl(store.profile_photo_url)
  const initials = store.store_name?.trim().slice(0, 2).toUpperCase() || '?'
  const biography = catalog.biography?.trim()
  const businessArea = formatArea(catalog.business_area)
  const instagram = socialUrl(catalog.social_instagram, 'instagram')
  const facebook = socialUrl(catalog.social_facebook, 'facebook')
  const hasMap = Boolean(catalog.business_location)
  const [mapOpen, setMapOpen] = useState(false)

  useEffect(() => {
    if (!mapOpen) return undefined

    function onKeyDown(event) {
      if (event.key === 'Escape') setMapOpen(false)
    }

    document.addEventListener('keydown', onKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = ''
    }
  }, [mapOpen])

  return (
    <>
      <section className={buyerStorePageHeader}>
        <div className="flex items-center gap-4">
          <div className={buyerStorePageAvatar}>
            {photoSrc ? (
              <img src={photoSrc} alt="" className="h-full w-full object-cover" />
            ) : (
              <span>{initials}</span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[0.62rem] font-semibold uppercase tracking-[0.08em] text-brand-carmelita/70">
              Tienda
            </p>
            <h1 className={buyerStorePageName}>{store.store_name}</h1>
            {store.phone ? (
              <a href={`tel:${store.phone}`} className="mt-1 inline-block text-sm font-semibold text-brand-green">
                {store.phone}
              </a>
            ) : null}
          </div>
        </div>

        {catalog.offers_delivery != null ? (
          <div className="mt-4 flex flex-wrap gap-2">
            <span className={buyerContextChip}>
              {catalog.offers_delivery ? 'Hace domicilio' : 'Solo recogida en tienda'}
            </span>
          </div>
        ) : null}

        {biography ? <p className={buyerStorePageBio}>{biography}</p> : null}

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {businessArea ? (
            <div className={`${buyerStorePageMeta} ${hasMap ? 'sm:col-span-2' : ''}`}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 flex-1">
                  <p className={buyerStorePageMetaLabel}>Ubicación</p>
                  <p className={buyerStorePageMetaValue}>{businessArea}</p>
                </div>
                {hasMap ? (
                  <button type="button" onClick={() => setMapOpen(true)} className={buyerStorePageMapBtn}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                      <path d="M12 21s7-4.5 7-11a7 7 0 1 0-14 0c0 6.5 7 11 7 11Z" />
                      <circle cx="12" cy="10" r="2.5" />
                    </svg>
                    Ver mapa
                  </button>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>

        {instagram || facebook ? (
          <div className="mt-4">
            <p className={buyerStorePageSectionTitle}>Redes</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {instagram ? (
                <a href={instagram} target="_blank" rel="noreferrer" className={buyerStorePageSocialLink}>
                  Instagram
                </a>
              ) : null}
              {facebook ? (
                <a href={facebook} target="_blank" rel="noreferrer" className={buyerStorePageSocialLink}>
                  Facebook
                </a>
              ) : null}
            </div>
          </div>
        ) : null}
      </section>

      {mapOpen && catalog.business_location ? (
        <BuyerModalPortal>
          <div
            className={buyerStoreMapOverlay}
            role="presentation"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) setMapOpen(false)
            }}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="buyer-store-map-title"
              className={buyerStoreMapModal}
            >
              <div className={buyerStoreMapModalHeader}>
                <h2 id="buyer-store-map-title" className="font-display text-base font-bold text-brand-green">
                  Ubicación en mapa
                </h2>
                <button
                  type="button"
                  onClick={() => setMapOpen(false)}
                  className="flex h-10 w-10 items-center justify-center rounded-full text-brand-carmelita touch-manipulation active:bg-brand-green/8"
                  aria-label="Cerrar mapa"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                    <path d="M18 6 6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className={buyerStoreMapModalBody}>
                <SellerLocationPreview location={catalog.business_location} interactive />
              </div>
            </div>
          </div>
        </BuyerModalPortal>
      ) : null}
    </>
  )
}

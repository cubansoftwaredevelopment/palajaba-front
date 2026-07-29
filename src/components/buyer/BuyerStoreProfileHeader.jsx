import { useEffect, useState } from 'react'
import SellerLocationPreview from '../seller/SellerLocationPreview'
import { resolveMediaUrl } from '../../lib/media'
import { buildWhatsAppContactUrl } from '../../lib/whatsappOrder'
import BuyerModalPortal from './BuyerModalPortal'
import BuyerStoreBio from './BuyerStoreBio'
import {
  buyerStoreMapModal,
  buyerStoreMapModalBody,
  buyerStoreMapModalHeader,
  buyerStoreMapOverlay,
  buyerStorePageActions,
  buyerStorePageAvatar,
  buyerStorePageDeliveryBadge,
  buyerStorePageHeader,
  buyerStorePageMapBtn,
  buyerStorePageMeta,
  buyerStorePageMetaLabel,
  buyerStorePageMetaValue,
  buyerStorePageName,
  buyerStorePageSecondaryBtn,
  buyerStorePageSocialLink,
  buyerStorePageWhatsAppBtn,
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

function DeliveryIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
      className="shrink-0"
    >
      <path d="M3 7h11v10H3z" strokeLinejoin="round" />
      <path d="M14 10h4l3 3v4h-7v-7z" strokeLinejoin="round" />
      <circle cx="7" cy="18" r="1.75" />
      <circle cx="17.5" cy="18" r="1.75" />
    </svg>
  )
}

function MapPinIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M12 21s7-4.5 7-11a7 7 0 1 0-14 0c0 6.5 7 11 7 11Z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  )
}

function WhatsAppIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden className="shrink-0">
      <path d="M12.04 2C6.58 2 2.15 6.4 2.15 11.82c0 1.96.52 3.8 1.44 5.4L2 22l4.95-1.55a9.9 9.9 0 0 0 5.09 1.38h.01c5.46 0 9.89-4.4 9.89-9.82S17.5 2 12.04 2zm5.78 13.95c-.24.67-1.4 1.23-1.93 1.3-.5.08-1.13.11-1.82-.11-.42-.14-.96-.31-1.66-.61-2.92-1.26-4.82-4.2-4.97-4.4-.14-.19-1.18-1.57-1.18-3 0-1.42.74-2.12 1-2.41.26-.29.57-.36.76-.36h.55c.18 0 .41-.07.64.49.24.58.81 2 .88 2.14.07.15.12.32.02.51-.1.19-.15.32-.3.49-.15.17-.31.38-.44.51-.15.15-.3.31-.13.6.17.29.76 1.25 1.63 2.02 1.12.99 2.06 1.3 2.35 1.45.29.15.46.12.63-.07.17-.19.73-.85.93-1.14.19-.29.39-.24.66-.14.26.1 1.67.79 1.96.93.29.15.48.22.55.34.07.12.07.7-.17 1.37z" />
    </svg>
  )
}

function InstagramIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  )
}

function FacebookIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M14 9h3V6h-3c-2.2 0-4 1.8-4 4v2H8v3h2v7h3v-7h2.6l.4-3H13v-2c0-.6.4-1 1-1z" />
    </svg>
  )
}

export default function BuyerStoreProfileHeader({ catalog }) {
  const store = catalog.store
  const photoSrc = resolveMediaUrl(store.profile_photo_url)
  const initials = store.store_name?.trim().slice(0, 2).toUpperCase() || '?'
  const businessArea = formatArea(catalog.business_area)
  const instagram = socialUrl(catalog.social_instagram, 'instagram')
  const facebook = socialUrl(catalog.social_facebook, 'facebook')
  const whatsapp = buildWhatsAppContactUrl(store.phone)
  const hasMap = Boolean(catalog.business_location)
  const hasActions = Boolean(whatsapp || hasMap || instagram || facebook)
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
            <p className="text-[0.62rem] font-semibold uppercase tracking-[0.08em] text-zinc-500">
              {catalog.gestor ? 'Catálogo de gestor' : 'Tienda'}
            </p>
            <h1 className={buyerStorePageName}>{store.store_name}</h1>
            {catalog.offers_delivery != null ? (
              <span className={buyerStorePageDeliveryBadge}>
                <DeliveryIcon />
                {catalog.offers_delivery ? 'Hace domicilio' : 'Solo recogida en tienda'}
              </span>
            ) : null}
            {catalog.gestor?.username ? (
              <p className="mt-1 text-sm text-zinc-600">Ofrecido por @{catalog.gestor.username}</p>
            ) : null}
          </div>
        </div>

        <BuyerStoreBio biography={catalog.biography} storeSlug={store.store_slug} />

        {businessArea ? (
          <div className={`${buyerStorePageMeta} border-t border-zinc-200/90`}>
            <p className={buyerStorePageMetaLabel}>Ubicación</p>
            <p className={buyerStorePageMetaValue}>{businessArea}</p>
          </div>
        ) : null}

        {hasActions ? (
          <div className={buyerStorePageActions}>
            {whatsapp ? (
              <a
                href={whatsapp}
                target="_blank"
                rel="noreferrer"
                className={buyerStorePageWhatsAppBtn}
              >
                <WhatsAppIcon />
                WhatsApp
              </a>
            ) : null}
            {hasMap ? (
              <button
                type="button"
                onClick={() => setMapOpen(true)}
                className={buyerStorePageMapBtn}
                aria-label="Ver mapa"
              >
                <MapPinIcon />
                <span className="hidden sm:inline">Ver mapa</span>
              </button>
            ) : null}
            {instagram ? (
              <a
                href={instagram}
                target="_blank"
                rel="noreferrer"
                className={buyerStorePageSocialLink}
                aria-label="Instagram"
              >
                <InstagramIcon />
                <span className="hidden sm:inline">Instagram</span>
              </a>
            ) : null}
            {facebook ? (
              <a
                href={facebook}
                target="_blank"
                rel="noreferrer"
                className={buyerStorePageSecondaryBtn}
                aria-label="Facebook"
              >
                <FacebookIcon />
                <span className="hidden sm:inline">Facebook</span>
              </a>
            ) : null}
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

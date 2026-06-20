import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { addSellerMapTiles, sellerMapMarkerIcon, SELLER_MAP_LOCATION_ZOOM, SELLER_MAP_PREVIEW_ZOOM } from '../../lib/sellerMap'

export default function SellerLocationPreview({
  location,
  interactive = false,
  mapClassName = '',
}) {
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)

  useEffect(() => {
    if (!mapRef.current || !location) return

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove()
      mapInstanceRef.current = null
    }

    const center = [location.lat, location.lng]
    const map = L.map(mapRef.current, {
      zoomControl: interactive,
      attributionControl: interactive,
      scrollWheelZoom: interactive,
      doubleClickZoom: interactive,
      dragging: interactive,
      touchZoom: interactive,
      boxZoom: interactive,
      keyboard: interactive,
    }).setView(
      center,
      interactive ? SELLER_MAP_LOCATION_ZOOM : SELLER_MAP_PREVIEW_ZOOM,
    )

    addSellerMapTiles(map)
    L.marker(center, { icon: sellerMapMarkerIcon }).addTo(map)

    mapInstanceRef.current = map
    const timer = setTimeout(() => map.invalidateSize(), interactive ? 150 : 80)

    return () => {
      clearTimeout(timer)
      map.remove()
      mapInstanceRef.current = null
    }
  }, [interactive, location?.lat, location?.lng])

  if (!location) return null

  const mapHeightClass = interactive
    ? mapClassName || 'h-full min-h-[52dvh]'
    : mapClassName || 'h-44 w-full sm:h-52'

  return (
    <div
      className={`seller-location-preview relative isolate z-0 overflow-hidden rounded-2xl border border-brand-green/12 bg-brand-green/[0.03] shadow-[0_4px_20px_rgba(89,128,44,0.1)] ${
        interactive ? 'seller-location-preview--interactive flex min-h-0 flex-1 flex-col' : ''
      }`}
    >
      <div className={`relative overflow-hidden ${interactive ? 'min-h-0 flex-1' : ''}`}>
        <div
          ref={mapRef}
          className={`relative z-0 w-full ${mapHeightClass}`}
          role="img"
          aria-label={
            location.label
              ? `Mapa: ${location.label}`
              : 'Mapa con la ubicación de tu negocio'
          }
        />
        {!interactive ? (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-16 bg-gradient-to-t from-brand-white/90 to-transparent" />
        ) : null}
      </div>
      <div className="relative z-10 flex items-center gap-2 border-t border-brand-green/8 bg-brand-white/80 px-3 py-2.5 backdrop-blur-sm">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-green/10 text-brand-green">
          <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
            <path
              fillRule="evenodd"
              d="M9.69 18.933l.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 00.281-.14c.186-.096.446-.24.757-.433.62-.384 1.445-.966 2.274-1.765C15.302 14.988 17 12.493 17 9A7 7 0 103 9c0 3.492 1.698 5.988 3.355 7.584a13.731 13.731 0 002.273 1.765 11.842 11.842 0 00.976.544l.017.007.006.003zM10 11.25a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5z"
              clipRule="evenodd"
            />
          </svg>
        </span>
        <p className="min-w-0 flex-1 truncate text-sm font-medium text-brand-green">
          {location.label || 'Ubicación marcada en el mapa'}
        </p>
        {interactive ? (
          <span className="hidden shrink-0 text-[0.62rem] font-semibold uppercase tracking-[0.06em] text-brand-carmelita/70 sm:inline">
            Arrastra · Zoom
          </span>
        ) : null}
      </div>
    </div>
  )
}

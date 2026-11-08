import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { addSellerMapTiles, buyerMapMarkerIcon, sellerMapMarkerIcon, SELLER_MAP_LOCATION_ZOOM, SELLER_MAP_PREVIEW_ZOOM } from '../../lib/sellerMap'

export default function SellerLocationPreview({
  location,
  interactive = false,
  viewOnly = false,
  banner = false,
  mapClassName = '',
  viewer = null,
  mapControl = null,
}) {
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)

  useEffect(() => {
    if (!mapRef.current || !location) return

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove()
      mapInstanceRef.current = null
    }

    const canExplore = interactive || viewOnly
    const center = [location.lat, location.lng]
    const map = L.map(mapRef.current, {
      zoomControl: canExplore,
      attributionControl: interactive,
      scrollWheelZoom: canExplore,
      doubleClickZoom: canExplore,
      dragging: canExplore,
      touchZoom: canExplore,
      boxZoom: interactive,
      keyboard: canExplore,
    }).setView(
      center,
      canExplore ? SELLER_MAP_LOCATION_ZOOM : SELLER_MAP_PREVIEW_ZOOM,
    )

    addSellerMapTiles(map)
    L.marker(center, { icon: sellerMapMarkerIcon }).addTo(map)

    const viewerLat = Number(viewer?.lat)
    const viewerLng = Number(viewer?.lng)
    const hasViewer = Number.isFinite(viewerLat) && Number.isFinite(viewerLng)
    const bounds = hasViewer ? L.latLngBounds([center, [viewerLat, viewerLng]]) : null
    if (hasViewer) {
      L.marker([viewerLat, viewerLng], { icon: buyerMapMarkerIcon, title: 'Tu ubicación' }).addTo(map)
    }

    const fitMap = (shouldFrame) => {
      map.invalidateSize()
      if (!shouldFrame || !bounds) return
      map.fitBounds(bounds, {
        padding: [32, 32],
        maxZoom: canExplore ? SELLER_MAP_LOCATION_ZOOM : SELLER_MAP_PREVIEW_ZOOM,
      })
    }

    mapInstanceRef.current = map
    const timer = setTimeout(() => fitMap(true), canExplore ? 150 : 80)
    const lateTimer = setTimeout(() => fitMap(true), 320)
    const observer = new ResizeObserver(() => fitMap(!canExplore))
    observer.observe(mapRef.current)

    return () => {
      observer.disconnect()
      clearTimeout(timer)
      clearTimeout(lateTimer)
      map.remove()
      mapInstanceRef.current = null
    }
  }, [banner, interactive, viewOnly, location?.lat, location?.lng, viewer?.lat, viewer?.lng])

  if (!location) return null

  if (banner) {
    return (
      <div className="seller-location-preview pointer-events-none absolute inset-0 overflow-hidden bg-brand-green/10">
        <div ref={mapRef} className="absolute inset-0 h-full w-full" role="presentation" />
      </div>
    )
  }

  const fills = interactive || viewOnly
  const mapHeightClass = fills
    ? mapClassName || 'h-full min-h-[52dvh]'
    : mapClassName || 'h-44 w-full sm:h-52'

  return (
    <div
      className={`seller-location-preview relative isolate z-0 overflow-hidden rounded-2xl border border-brand-green/12 bg-brand-green/[0.03] shadow-[0_4px_20px_rgba(89,128,44,0.1)] ${
        fills ? 'seller-location-preview--interactive flex h-full min-h-0 flex-1 flex-col' : ''
      }`}
    >
      <div className={`relative overflow-hidden ${fills ? 'min-h-0 flex-1' : ''}`}>
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
        {mapControl}
        {!interactive ? (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-16 bg-gradient-to-t from-brand-white/90 to-transparent" />
        ) : null}
      </div>
      <div className="relative z-10 flex items-center gap-2 border-t border-brand-green/8 bg-brand-white/80 px-3 py-2.5 backdrop-blur-sm">
        {viewOnly ? (
          <span className="shrink-0 text-[0.62rem] font-semibold uppercase tracking-[0.06em] text-brand-carmelita/70">
            Solo lectura
          </span>
        ) : interactive ? (
          <span className="hidden shrink-0 text-[0.62rem] font-semibold uppercase tracking-[0.06em] text-brand-carmelita/70 sm:inline">
            Arrastra · Zoom
          </span>
        ) : null}
      </div>
    </div>
  )
}

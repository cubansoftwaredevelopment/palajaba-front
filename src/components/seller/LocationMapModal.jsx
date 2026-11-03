import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import {
  addSellerMapTiles,
  getCurrentMapPosition,
  SELLER_MAP_DEFAULT_CENTER,
  SELLER_MAP_DEFAULT_ZOOM,
  SELLER_MAP_LOCATION_ZOOM,
  sellerMapMarkerIcon,
} from '../../lib/sellerMap'
import { useDismissibleModal } from '../../buyer/components/useOrderModalPresence'
import SellerModalPortal from './SellerModalPortal'

const mapControlButton =
  'grid h-8 w-8 place-items-center rounded-full border border-brand-green/15 bg-white text-brand-green shadow-sm touch-manipulation active:bg-brand-green/8 disabled:opacity-50'

export default function LocationMapModal({ initialLocation, onConfirm, onClose: requestClose }) {
  const { dismiss: onClose, motionClass } = useDismissibleModal(requestClose)
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const markerRef = useRef(null)
  const selectedRef = useRef(
    initialLocation
      ? { lat: initialLocation.lat, lng: initialLocation.lng, label: initialLocation.label ?? '' }
      : null,
  )
  const [hasPoint, setHasPoint] = useState(Boolean(initialLocation))
  const [expanded, setExpanded] = useState(false)
  const [locating, setLocating] = useState(false)
  const [locationError, setLocationError] = useState('')
  const placeMarkerRef = useRef(null)

  placeMarkerRef.current = (lat, lng) => {
    const map = mapInstanceRef.current
    if (!map) return
    selectedRef.current = {
      lat,
      lng,
      label: selectedRef.current?.label ?? '',
    }
    setHasPoint(true)
    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng])
    } else {
      markerRef.current = L.marker([lat, lng], { icon: sellerMapMarkerIcon }).addTo(map)
    }
  }

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return

    const start = initialLocation
      ? [initialLocation.lat, initialLocation.lng]
      : SELLER_MAP_DEFAULT_CENTER

    const zoom = initialLocation ? SELLER_MAP_LOCATION_ZOOM : SELLER_MAP_DEFAULT_ZOOM
    const map = L.map(mapRef.current, { zoomControl: true }).setView(start, zoom)
    addSellerMapTiles(map)

    if (initialLocation) {
      placeMarkerRef.current(initialLocation.lat, initialLocation.lng)
    } else {
      getCurrentMapPosition()
        .then(({ lat, lng }) => {
          map.setView([lat, lng], SELLER_MAP_LOCATION_ZOOM)
          placeMarkerRef.current(lat, lng)
        })
        .catch(() => {})
    }

    map.on('click', (event) => {
      const { lat, lng } = event.latlng
      placeMarkerRef.current(lat, lng)
    })

    mapInstanceRef.current = map
    setTimeout(() => map.invalidateSize(), 100)

    return () => {
      map.remove()
      mapInstanceRef.current = null
      markerRef.current = null
    }
  }, [initialLocation])

  useEffect(() => {
    const timeout = window.setTimeout(() => mapInstanceRef.current?.invalidateSize(), 120)
    return () => window.clearTimeout(timeout)
  }, [expanded])

  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = ''
    }
  }, [onClose])

  function handleConfirm() {
    if (!selectedRef.current) return
    onConfirm(selectedRef.current)
  }

  async function useMyLocation() {
    setLocating(true)
    setLocationError('')
    try {
      const { lat, lng } = await getCurrentMapPosition()
      mapInstanceRef.current?.setView([lat, lng], SELLER_MAP_LOCATION_ZOOM)
      placeMarkerRef.current?.(lat, lng)
    } catch (error) {
      setLocationError(error instanceof Error ? error.message : 'No se pudo obtener tu ubicación.')
    } finally {
      setLocating(false)
    }
  }

  return (
    <SellerModalPortal>
      <div
        className={`fixed inset-0 flex bg-black/40 ${expanded ? '' : 'items-end justify-center sm:items-center sm:p-4'} ${motionClass}`}
        style={{ zIndex: 500 }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="map-modal-title"
        onClick={onClose}
      >
        <div
          className={`flex w-full min-w-0 flex-col overflow-hidden bg-brand-white ${expanded ? 'h-dvh max-h-dvh rounded-none' : 'h-[min(88dvh,760px)] max-w-5xl rounded-t-2xl border border-brand-green/12 shadow-xl sm:rounded-2xl'}`}
          onClick={(event) => event.stopPropagation()}
        >
          <div className={`relative z-20 flex shrink-0 items-center gap-2 border-b border-brand-green/8 bg-brand-white px-3 py-2 ${expanded ? 'pt-[max(0.5rem,var(--safe-top))]' : ''}`}>
            <button
              type="button"
              onClick={onClose}
              className={mapControlButton}
              aria-label="Cerrar mapa"
              title="Cerrar"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
            <h2 id="map-modal-title" className="min-w-0 flex-1 font-display text-sm font-bold leading-tight text-brand-green">
              Ubicación del negocio
            </h2>
            <button
              type="button"
              onClick={useMyLocation}
              disabled={locating}
              className={mapControlButton}
              aria-label="Usar mi ubicación"
              title="Usar mi ubicación"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M12 21s7-4.5 7-11a7 7 0 1 0-14 0c0 6.5 7 11 7 11Z" />
                <circle cx="12" cy="10" r="2.5" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => setExpanded((value) => !value)}
              className={mapControlButton}
              aria-label={expanded ? 'Reducir a modal' : 'Ampliar a pantalla completa'}
              title={expanded ? 'Reducir a modal' : 'Ampliar a pantalla completa'}
            >
              {expanded ? (
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 3H5a2 2 0 0 0-2 2v4m12-6h4a2 2 0 0 1 2 2v4M3 15v4a2 2 0 0 0 2 2h4m12-6v4a2 2 0 0 1-2 2h-4" /></svg>
              ) : (
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M8 3H5a2 2 0 0 0-2 2v3m13-5h3a2 2 0 0 1 2 2v3M3 16v3a2 2 0 0 0 2 2h3m13-5v3a2 2 0 0 1-2 2h-3" /></svg>
              )}
            </button>
          </div>

          <div className="relative z-0 min-h-0 flex-1">
            <div ref={mapRef} className="h-full w-full" />
          </div>

          <div className="flex shrink-0 items-center justify-end gap-2 border-t border-brand-green/8 px-3 py-2 pb-[max(0.5rem,var(--safe-bottom))]">
            {locationError ? (
              <p className="min-w-0 flex-1 text-xs text-brand-carmelita" role="alert">{locationError}</p>
            ) : null}
            <button
              type="button"
              onClick={handleConfirm}
              disabled={!hasPoint}
              className="h-8 shrink-0 rounded-full bg-brand-green px-3.5 text-xs font-semibold text-white touch-manipulation disabled:opacity-50"
            >
              Confirmar
            </button>
          </div>
        </div>
      </div>
    </SellerModalPortal>
  )
}

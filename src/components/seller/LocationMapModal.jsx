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
import { sellerModalTitle } from './sellerStyles'
import { useDismissibleModal } from '../../buyer/components/useOrderModalPresence'

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

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return

    const start = initialLocation
      ? [initialLocation.lat, initialLocation.lng]
      : SELLER_MAP_DEFAULT_CENTER

    const zoom = initialLocation ? SELLER_MAP_LOCATION_ZOOM : SELLER_MAP_DEFAULT_ZOOM
    const map = L.map(mapRef.current, { zoomControl: true }).setView(start, zoom)
    addSellerMapTiles(map)

    function placeMarker(lat, lng) {
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

    if (initialLocation) {
      placeMarker(initialLocation.lat, initialLocation.lng)
    } else {
      getCurrentMapPosition()
        .then(({ lat, lng }) => {
          map.setView([lat, lng], SELLER_MAP_LOCATION_ZOOM)
          placeMarker(lat, lng)
        })
        .catch(() => {})
    }

    map.on('click', (event) => {
      const { lat, lng } = event.latlng
      placeMarker(lat, lng)
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

  return (
    <div
      className={`fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 backdrop-blur-[2px] sm:items-center sm:p-4 ${expanded ? '!p-0' : ''} ${motionClass}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="map-modal-title"
      onClick={onClose}
    >
      <div
        className={`flex w-full flex-col overflow-hidden border border-brand-green/12 bg-brand-white shadow-xl ${expanded ? 'h-[100dvh] max-w-none rounded-none' : 'h-[88dvh] max-h-[760px] max-w-5xl rounded-t-2xl sm:rounded-2xl'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 border-b border-brand-green/8 px-4 py-3 sm:px-5">
          <h2 id="map-modal-title" className={sellerModalTitle}>
            Ubicación del negocio
          </h2>
          <button
            type="button"
            onClick={() => setExpanded((value) => !value)}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-brand-green/15 text-brand-green hover:bg-brand-green/5"
            aria-label={expanded ? 'Restaurar tamaño del mapa' : 'Ampliar mapa'}
            title={expanded ? 'Restaurar tamaño' : 'Ampliar mapa'}
          >
            {expanded ? (
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 3H5a2 2 0 0 0-2 2v4m12-6h4a2 2 0 0 1 2 2v4M3 15v4a2 2 0 0 0 2 2h4m12-6v4a2 2 0 0 1-2 2h-4" /></svg>
            ) : (
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M8 3H5a2 2 0 0 0-2 2v3m13-5h3a2 2 0 0 1 2 2v3M3 16v3a2 2 0 0 0 2 2h3m13-5v3a2 2 0 0 1-2 2h-3" /></svg>
            )}
          </button>
        </div>

        <div ref={mapRef} className="min-h-0 w-full flex-1" />

        <div className="grid grid-cols-2 gap-2 border-t border-brand-green/8 p-3">
          <button
            type="button"
            onClick={onClose}
            className="min-h-10 rounded-xl border border-brand-green/20 px-3 text-xs font-semibold text-brand-green sm:text-sm"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!hasPoint}
            className="min-h-10 rounded-xl bg-brand-green px-3 text-xs font-semibold text-brand-white disabled:opacity-50 sm:text-sm"
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  )
}

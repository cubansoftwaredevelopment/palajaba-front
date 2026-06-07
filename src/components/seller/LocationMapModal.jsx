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

export default function LocationMapModal({ initialLocation, onConfirm, onClose }) {
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const markerRef = useRef(null)
  const selectedRef = useRef(
    initialLocation
      ? { lat: initialLocation.lat, lng: initialLocation.lng, label: initialLocation.label ?? '' }
      : null,
  )
  const [hasPoint, setHasPoint] = useState(Boolean(initialLocation))

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
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 backdrop-blur-[2px] sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="map-modal-title"
      onClick={onClose}
    >
      <div
        className="flex w-full max-w-md flex-col overflow-hidden rounded-t-2xl border border-brand-green/12 bg-brand-white shadow-xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-brand-green/8 px-4 py-4">
          <h2 id="map-modal-title" className={sellerModalTitle}>
            Ubicación del negocio
          </h2>
        </div>

        <div ref={mapRef} className="h-56 w-full sm:h-64" />

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

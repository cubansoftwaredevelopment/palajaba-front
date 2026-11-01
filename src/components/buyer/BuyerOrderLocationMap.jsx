import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
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
import { getUserFacingMessage } from '../../lib/userFacingError'

export default function BuyerOrderLocationMap({ initialCoords, onChange, fill = false, heightClass = 'h-64' }) {
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const markerRef = useRef(null)
  const placeMarkerRef = useRef(null)
  const selectedLocationRef = useRef(null)
  const userMovedRef = useRef(false)
  const onChangeRef = useRef(onChange)
  const [locating, setLocating] = useState(false)
  const [locateError, setLocateError] = useState('')
  const [expanded, setExpanded] = useState(false)
  onChangeRef.current = onChange

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return undefined

    const map = L.map(mapRef.current, { zoomControl: true, attributionControl: false }).setView(
      SELLER_MAP_DEFAULT_CENTER,
      SELLER_MAP_DEFAULT_ZOOM,
    )
    addSellerMapTiles(map)

    function placeMarker(lat, lng) {
      selectedLocationRef.current = { lat, lng }
      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lng])
        markerRef.current.dragging?.enable()
      } else {
        const marker = L.marker([lat, lng], {
          icon: sellerMapMarkerIcon,
          draggable: true,
          autoPan: true,
        })
        marker.on('dragend', () => {
          userMovedRef.current = true
          const next = marker.getLatLng()
          selectedLocationRef.current = { lat: next.lat, lng: next.lng }
          onChangeRef.current({ lat: next.lat, lng: next.lng })
        })
        marker.addTo(map)
        markerRef.current = marker
      }
      onChangeRef.current({ lat, lng })
    }

    map.on('click', (event) => {
      userMovedRef.current = true
      placeMarker(event.latlng.lat, event.latlng.lng)
    })

    mapInstanceRef.current = map
    placeMarkerRef.current = placeMarker
    if (selectedLocationRef.current) {
      const { lat, lng } = selectedLocationRef.current
      map.setView([lat, lng], SELLER_MAP_LOCATION_ZOOM)
      placeMarker(lat, lng)
    }
    const resizeId = window.setTimeout(() => map.invalidateSize(), 80)
    const resizeLateId = window.setTimeout(() => map.invalidateSize(), 320)
    const observer = new ResizeObserver(() => map.invalidateSize())
    observer.observe(mapRef.current)

    return () => {
      observer.disconnect()
      window.clearTimeout(resizeId)
      window.clearTimeout(resizeLateId)
      map.remove()
      mapInstanceRef.current = null
      markerRef.current = null
      placeMarkerRef.current = null
    }
  }, [expanded])

  useEffect(() => {
    const map = mapInstanceRef.current
    const lat = initialCoords?.lat
    const lng = initialCoords?.lng
    if (!map || userMovedRef.current || lat == null || lng == null) return

    map.setView([lat, lng], SELLER_MAP_LOCATION_ZOOM)
    placeMarkerRef.current?.(lat, lng)
  }, [initialCoords?.lat, initialCoords?.lng])

  async function useCurrentLocation() {
    const map = mapInstanceRef.current
    const placeMarker = placeMarkerRef.current
    if (!map || !placeMarker) return

    setLocating(true)
    setLocateError('')
    try {
      const { lat, lng } = await getCurrentMapPosition()
      userMovedRef.current = true
      map.setView([lat, lng], SELLER_MAP_LOCATION_ZOOM)
      placeMarker(lat, lng)
    } catch (error) {
      setLocateError(getUserFacingMessage(error, 'No se pudo obtener tu ubicación.'))
    } finally {
      setLocating(false)
    }
  }

  const controlClass = 'absolute z-[1000] grid h-11 w-11 place-items-center rounded-xl border border-brand-green/15 bg-brand-white/95 text-brand-green shadow-lg backdrop-blur transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green/40 disabled:opacity-60'

  const mapContent = (
    <div className={expanded ? 'fixed inset-0 z-[140] flex h-[100dvh] w-full animate-fade-in flex-col bg-brand-white p-0' : fill ? 'flex min-h-0 flex-1 flex-col' : ''}>
      <div className={`buyer-order-map relative overflow-hidden ${expanded ? 'min-h-0 flex-1 rounded-none border-0' : `rounded-2xl border border-brand-green/12 ${fill ? 'min-h-0 flex-1' : ''}`}`}>
        <div ref={mapRef} className={expanded || fill ? 'h-full min-h-0 w-full' : `${heightClass} w-full`} />
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          aria-label={expanded ? 'Cerrar mapa ampliado' : 'Ampliar mapa'}
          title={expanded ? 'Cerrar mapa ampliado' : 'Ampliar mapa'}
          className={`${controlClass} right-3 top-3`}
        >
          {expanded ? (
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 4l6 6m-5-1 5 1-1-5M20 20l-6-6m5 1-5-1 1 5" /></svg>
          ) : (
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M8 3H5a2 2 0 0 0-2 2v3m13-5h3a2 2 0 0 1 2 2v3M3 16v3a2 2 0 0 0 2 2h3m13-5v3a2 2 0 0 1-2 2h-3" /></svg>
          )}
        </button>
        <button
          type="button"
          onClick={useCurrentLocation}
          disabled={locating}
          aria-label={locating ? 'Buscando ubicación' : 'Usar mi ubicación'}
          title={locating ? 'Buscando ubicación…' : 'Usar mi ubicación'}
          className={`${controlClass} bottom-3 right-3`}
        >
          <svg viewBox="0 0 24 24" className={`h-5 w-5 ${locating ? 'animate-pulse' : ''}`} fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="12" cy="12" r="3" /><path d="M12 2v3m0 14v3M2 12h3m14 0h3" /><circle cx="12" cy="12" r="8" /></svg>
        </button>
        {locateError ? <p role="alert" className="absolute bottom-3 left-3 z-[1000] max-w-[70%] rounded-lg bg-white/95 px-3 py-2 text-xs text-red-700 shadow">{locateError}</p> : null}
      </div>
      {!expanded ? <p className="mt-1 text-xs leading-relaxed text-brand-carmelita/90">Arrastra el pin o toca el mapa para mover el punto.</p> : null}
    </div>
  )

  if (expanded && typeof document !== 'undefined') return createPortal(mapContent, document.body)
  return mapContent
}

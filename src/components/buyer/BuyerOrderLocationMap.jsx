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
import { getUserFacingMessage } from '../../lib/userFacingError'

export default function BuyerOrderLocationMap({ initialCoords, onChange, fill = false }) {
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const markerRef = useRef(null)
  const placeMarkerRef = useRef(null)
  const userMovedRef = useRef(false)
  const onChangeRef = useRef(onChange)
  const [locating, setLocating] = useState(false)
  const [locateError, setLocateError] = useState('')
  onChangeRef.current = onChange

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return undefined

    const map = L.map(mapRef.current, { zoomControl: true, attributionControl: false }).setView(
      SELLER_MAP_DEFAULT_CENTER,
      SELLER_MAP_DEFAULT_ZOOM,
    )
    addSellerMapTiles(map)

    function placeMarker(lat, lng) {
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
  }, [])

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

  return (
    <div className={fill ? 'flex min-h-0 flex-1 flex-col' : ''}>
      <div className={`buyer-order-map overflow-hidden rounded-2xl border border-brand-green/12 ${fill ? 'min-h-0 flex-1' : ''}`}>
        <div ref={mapRef} className={fill ? 'h-full min-h-48 w-full' : 'h-52 w-full'} />
      </div>
      <button
        type="button"
        onClick={useCurrentLocation}
        disabled={locating}
        className="mt-2 min-h-11 w-full rounded-xl border border-brand-green/20 px-3 text-sm font-semibold text-brand-green active:bg-brand-yellow/20 disabled:opacity-50"
      >
        {locating ? 'Buscando ubicación…' : 'Usar mi ubicación'}
      </button>
      {locateError ? (
        <p className="mt-1 text-xs leading-relaxed text-brand-carmelita">{locateError}</p>
      ) : (
        <p className="mt-1 text-xs leading-relaxed text-brand-carmelita/90">
          Arrastra el pin o toca el mapa para mover el punto.
        </p>
      )}
    </div>
  )
}

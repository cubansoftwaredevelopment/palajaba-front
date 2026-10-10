import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import {
  addSellerMapTiles,
  SELLER_MAP_DEFAULT_CENTER,
  SELLER_MAP_DEFAULT_ZOOM,
  SELLER_MAP_LOCATION_ZOOM,
  sellerMapMarkerIcon,
} from '../../lib/sellerMap'

export default function BuyerOrderLocationMap({ initialCoords, onChange }) {
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const markerRef = useRef(null)
  const userMovedRef = useRef(false)
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return undefined

    const map = L.map(mapRef.current, { zoomControl: true }).setView(
      SELLER_MAP_DEFAULT_CENTER,
      SELLER_MAP_DEFAULT_ZOOM,
    )
    addSellerMapTiles(map)

    function placeMarker(lat, lng) {
      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lng])
      } else {
        markerRef.current = L.marker([lat, lng], { icon: sellerMapMarkerIcon }).addTo(map)
      }
      onChangeRef.current({ lat, lng })
    }

    map.on('click', (event) => {
      userMovedRef.current = true
      placeMarker(event.latlng.lat, event.latlng.lng)
    })

    mapInstanceRef.current = map
    const resizeId = window.setTimeout(() => map.invalidateSize(), 120)

    return () => {
      window.clearTimeout(resizeId)
      map.remove()
      mapInstanceRef.current = null
      markerRef.current = null
    }
  }, [])

  useEffect(() => {
    const map = mapInstanceRef.current
    const lat = initialCoords?.lat
    const lng = initialCoords?.lng
    if (!map || userMovedRef.current || lat == null || lng == null) return

    map.setView([lat, lng], SELLER_MAP_LOCATION_ZOOM)
    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng])
    } else {
      markerRef.current = L.marker([lat, lng], { icon: sellerMapMarkerIcon }).addTo(map)
    }
    onChangeRef.current({ lat, lng })
  }, [initialCoords])

  return (
    <div className="buyer-order-map overflow-hidden rounded-2xl border border-brand-green/12">
      <div ref={mapRef} className="h-44 w-full" />
    </div>
  )
}

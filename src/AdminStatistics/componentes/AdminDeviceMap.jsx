import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { addSellerMapTiles, SELLER_MAP_DEFAULT_CENTER, SELLER_MAP_DEFAULT_ZOOM } from '../../lib/sellerMap'

function pinIcon(color) {
  const html = `
    <svg width="32" height="42" viewBox="0 0 36 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style="display:block">
      <path d="M18 0C10.82 0 5 5.82 5 13c0 9.75 13 35 13 35s13-25.25 13-35C31 5.82 25.18 0 18 0z" fill="${color}" stroke="#fdfbf2" stroke-width="2"/>
      <circle cx="18" cy="13" r="5.5" fill="#fdfbf2"/>
    </svg>
  `
  return L.divIcon({
    className: 'admin-device-pin',
    html,
    iconSize: [32, 42],
    iconAnchor: [16, 42],
    popupAnchor: [0, -36],
  })
}

const ACTIVE_ICON = pinIcon('#59802c')
const SESSION_ICON = pinIcon('#d97706')

function markerLabel(marker) {
  if (marker.session_kind === 'seller') return 'Sesión de tienda'
  if (marker.session_kind === 'gestor') return 'Sesión de gestor'
  if (marker.signed_in) return 'Sesión iniciada'
  return marker.active ? 'Activo' : 'Usó la app'
}

export default function AdminDeviceMap({ markers, frameKey }) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const layerRef = useRef(null)
  const fittedKey = useRef(null)

  useEffect(() => {
    const node = containerRef.current
    if (!node || mapRef.current) return undefined
    const map = L.map(node, {
      center: SELLER_MAP_DEFAULT_CENTER,
      zoom: SELLER_MAP_DEFAULT_ZOOM,
      zoomControl: true,
      scrollWheelZoom: true,
      doubleClickZoom: true,
      touchZoom: true,
      boxZoom: true,
      keyboard: true,
    })
    addSellerMapTiles(map)
    layerRef.current = L.layerGroup().addTo(map)
    mapRef.current = map
    requestAnimationFrame(() => map.invalidateSize())
    return () => {
      map.remove()
      mapRef.current = null
      layerRef.current = null
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    const layer = layerRef.current
    if (!map || !layer) return
    map.invalidateSize()
    layer.clearLayers()
    const points = []
    for (const marker of markers ?? []) {
      if (marker.lat == null || marker.lng == null) continue
      const latLng = [marker.lat, marker.lng]
      points.push(latLng)
      const icon = marker.signed_in || marker.session_kind ? SESSION_ICON : ACTIVE_ICON
      L.marker(latLng, { icon }).bindTooltip(markerLabel(marker), { direction: 'top' }).addTo(layer)
    }
    if (points.length && fittedKey.current !== frameKey) {
      map.fitBounds(L.latLngBounds(points), { padding: [24, 24], maxZoom: 15 })
      fittedKey.current = frameKey
    }
  }, [frameKey, markers])

  return (
    <div className="admin-device-map relative h-72 overflow-hidden rounded-xl border border-zinc-800/80">
      <div ref={containerRef} className="h-full w-full" />
      {(markers ?? []).length === 0 ? (
        <p className="pointer-events-none absolute inset-x-3 bottom-3 rounded-lg bg-zinc-950/80 px-3 py-2 text-center text-xs text-zinc-300">
          No hay coordenadas para mostrar.
        </p>
      ) : null}
    </div>
  )
}

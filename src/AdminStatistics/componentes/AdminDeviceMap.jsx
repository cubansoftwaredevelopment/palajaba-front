import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { addSellerMapTiles, SELLER_MAP_DEFAULT_CENTER, SELLER_MAP_DEFAULT_ZOOM } from '../../lib/sellerMap'

const BUYER_LOGO = '/images/states/loading.png'

const STORE_SVG = `
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M4 10 6 4h12l2 6" stroke="#59802c" stroke-width="1.8" stroke-linejoin="round"/>
    <path d="M4 10h16v9H4z" stroke="#59802c" stroke-width="1.8"/>
    <path d="M10 19v-5h4v5" stroke="#59802c" stroke-width="1.8"/>
  </svg>
`

const GESTOR_SVG = `
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="12" cy="8" r="3.2" stroke="#18181b" stroke-width="1.8"/>
    <path d="M5.5 19.5c1.2-3.2 3.4-4.8 6.5-4.8s5.3 1.6 6.5 4.8" stroke="#18181b" stroke-width="1.8" stroke-linecap="round"/>
  </svg>
`

const ANDROID_SVG = `
  <svg width="12" height="12" viewBox="0 0 24 24" fill="#8fdb6a" aria-hidden="true">
    <path d="M7 8.5h10a2 2 0 0 1 2 2V18a2 2 0 0 1-2 2h-1v2h-2v-2H10v2H8v-2H7a2 2 0 0 1-2-2v-7.5a2 2 0 0 1 2-2z"/>
    <circle cx="9" cy="12.5" r="1" fill="#18181b"/>
    <circle cx="15" cy="12.5" r="1" fill="#18181b"/>
    <path d="M8 6.5 6.5 4M16 6.5 17.5 4" stroke="#8fdb6a" stroke-width="1.8" stroke-linecap="round"/>
  </svg>
`

const COMPUTER_SVG = `
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <rect x="3" y="4" width="18" height="12" rx="1.5" stroke="#fdfbf2" stroke-width="1.8"/>
    <path d="M8 20h8M12 16v4" stroke="#fdfbf2" stroke-width="1.8" stroke-linecap="round"/>
  </svg>
`

const PHONE_SVG = `
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <rect x="7" y="2.5" width="10" height="19" rx="2" stroke="#fdfbf2" stroke-width="1.8"/>
    <path d="M11 18.5h2" stroke="#fdfbf2" stroke-width="1.8" stroke-linecap="round"/>
  </svg>
`

const icons = new Map()

function roleOf(marker) {
  if (marker.session_kind === 'seller') return 'seller'
  if (marker.session_kind === 'gestor') return 'gestor'
  return 'buyer'
}

function platformOf(marker) {
  if (marker.platform === 'android' || marker.platform === 'ios' || marker.platform === 'web') {
    return marker.platform
  }
  return 'web'
}

function faceHtml(role) {
  if (role === 'seller') return STORE_SVG
  if (role === 'gestor') return GESTOR_SVG
  return `<img src="${BUYER_LOGO}" alt="" width="40" height="40" />`
}

function badgeHtml(platform) {
  if (platform === 'android') return ANDROID_SVG
  if (platform === 'ios') return PHONE_SVG
  return COMPUTER_SVG
}

function markerIcon(marker) {
  const role = roleOf(marker)
  const platform = platformOf(marker)
  const key = `${role}:${platform}`
  const cached = icons.get(key)
  if (cached) return cached
  const icon = L.divIcon({
    className: 'admin-device-pin',
    html: `<div class="admin-device-marker"><div class="admin-device-marker__face">${faceHtml(role)}</div><span class="admin-device-marker__badge">${badgeHtml(platform)}</span></div>`,
    iconSize: [44, 44],
    iconAnchor: [22, 22],
    tooltipAnchor: [0, -24],
  })
  icons.set(key, icon)
  return icon
}

function markerLabel(marker) {
  const role = marker.session_kind === 'seller'
    ? 'Vendedor'
    : marker.session_kind === 'gestor'
      ? 'Gestor'
      : 'Comprador'
  const place = marker.platform === 'android'
    ? 'Android'
    : marker.platform === 'ios'
      ? 'iPhone'
      : 'Navegador'
  return `${role} · ${place}${marker.active ? ' · Activo' : ''}`
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
      L.marker(latLng, { icon: markerIcon(marker) }).bindTooltip(markerLabel(marker), { direction: 'top' }).addTo(layer)
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

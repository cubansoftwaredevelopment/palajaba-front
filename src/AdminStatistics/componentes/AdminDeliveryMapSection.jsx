import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

import { adminCard, adminMuted, adminSubtle } from '../../components/admin/adminStyles'
import { addSellerMapTiles, SELLER_MAP_DEFAULT_CENTER, SELLER_MAP_DEFAULT_ZOOM } from '../../lib/sellerMap'

const pinIcon = L.divIcon({
  className: 'admin-device-pin',
  html: '<div class="admin-order-pin"></div>',
  iconSize: [22, 22],
  iconAnchor: [11, 20],
  tooltipAnchor: [0, -30],
})

function formatCount(value) {
  return Math.round(Number(value) || 0).toLocaleString('es')
}

function pinLabel(pin) {
  const place = pin.address ? pin.address : 'Sin dirección escrita'
  return `${pin.store_name} · ${place}`
}

function OrderPinsMap({ pins, frameKey }) {
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
    for (const pin of pins ?? []) {
      if (pin.lat == null || pin.lng == null) continue
      const latLng = [pin.lat, pin.lng]
      points.push(latLng)
      L.marker(latLng, { icon: pinIcon }).bindTooltip(pinLabel(pin), { direction: 'top' }).addTo(layer)
    }
    if (points.length && fittedKey.current !== frameKey) {
      map.fitBounds(L.latLngBounds(points), { padding: [28, 28], maxZoom: 15 })
      fittedKey.current = frameKey
    }
  }, [frameKey, pins])

  return (
    <div className="admin-device-map relative h-80 overflow-hidden rounded-xl border border-zinc-800/80">
      <div ref={containerRef} className="h-full w-full" />
      {(pins ?? []).length === 0 ? (
        <p className="pointer-events-none absolute inset-x-3 bottom-3 rounded-lg bg-zinc-950/80 px-3 py-2 text-center text-xs text-zinc-300">
          Ningún pedido a domicilio de este periodo tiene un punto en el mapa.
        </p>
      ) : null}
    </div>
  )
}

export default function AdminDeliveryMapSection({ data, loading, error }) {
  const ordersTotal = data?.orders_total ?? 0
  const deliveryOrders = data?.delivery_orders ?? 0
  const pins = data?.pins ?? []
  const withoutPin = Math.max(0, deliveryOrders - pins.length)

  return (
    <section className={adminCard}>
      <div className="mb-4">
        <h3 className="text-sm font-medium text-zinc-50">Domicilio en el mapa</h3>
        <p className={`mt-1.5 text-xs leading-relaxed ${adminSubtle}`}>
          Pedidos a domicilio frente a los pedidos hechos
          {data?.period_label ? ` · ${data.period_label}` : ''}. El pin aparece solo si el
          domicilio marcó un punto.
        </p>
      </div>

      <div className="mb-4 grid grid-cols-3 gap-2">
        <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 px-3 py-3">
          <p className={`text-[0.65rem] font-medium uppercase tracking-wide ${adminMuted}`}>Hechos</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-zinc-50">
            {loading && !data ? '…' : formatCount(ordersTotal)}
          </p>
        </div>
        <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 px-3 py-3">
          <p className={`text-[0.65rem] font-medium uppercase tracking-wide ${adminMuted}`}>Domicilio</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-zinc-50">
            {loading && !data ? '…' : formatCount(deliveryOrders)}
          </p>
        </div>
        <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 px-3 py-3">
          <p className={`text-[0.65rem] font-medium uppercase tracking-wide ${adminMuted}`}>Con pin</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-zinc-50">
            {loading && !data ? '…' : formatCount(pins.length)}
          </p>
        </div>
      </div>

      {loading && !data ? (
        <p className={`py-6 text-center text-sm ${adminMuted}`}>Cargando el mapa…</p>
      ) : null}

      {!loading && error ? (
        <p
          className="rounded-xl border border-brand-carmelita/25 bg-brand-carmelita/10 px-4 py-5 text-center text-sm text-zinc-200"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      {!loading && !error ? (
        <>
          <p className={`mb-3 text-xs ${adminSubtle}`}>
            {formatCount(withoutPin)} a domicilio sin punto. Pasa el cursor sobre un pin para ver la tienda y la dirección.
          </p>
          <OrderPinsMap pins={pins} frameKey={data?.period_label ?? 'delivery'} />
        </>
      ) : null}
    </section>
  )
}

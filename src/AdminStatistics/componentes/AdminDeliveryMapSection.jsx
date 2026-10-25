import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
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

function OrderPinsCanvas({ pins, frameKey, interactive }) {
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
      zoomControl: interactive,
      scrollWheelZoom: interactive,
      doubleClickZoom: interactive,
      touchZoom: interactive,
      boxZoom: interactive,
      keyboard: interactive,
      dragging: interactive,
    })
    addSellerMapTiles(map)
    layerRef.current = L.layerGroup().addTo(map)
    mapRef.current = map
    requestAnimationFrame(() => map.invalidateSize())
    const timer = window.setTimeout(() => map.invalidateSize(), 80)
    return () => {
      window.clearTimeout(timer)
      map.remove()
      mapRef.current = null
      layerRef.current = null
    }
  }, [interactive])

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
      L.marker(latLng, { icon: pinIcon, interactive })
        .bindTooltip(pinLabel(pin), { direction: 'top' })
        .addTo(layer)
    }
    if (points.length && fittedKey.current !== frameKey) {
      map.fitBounds(L.latLngBounds(points), { padding: [28, 28], maxZoom: 15 })
      fittedKey.current = frameKey
    }
  }, [frameKey, interactive, pins])

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} className="h-full w-full" />
      {(pins ?? []).length === 0 ? (
        <p className="pointer-events-none absolute inset-x-3 bottom-3 rounded-lg bg-zinc-950/80 px-3 py-2 text-center text-xs text-zinc-300">
          Ningún pedido a domicilio de este periodo tiene un punto en el mapa.
        </p>
      ) : null}
    </div>
  )
}

function OrderPinsMap({ pins, frameKey }) {
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    if (!expanded) return undefined
    function onKey(event) {
      if (event.key === 'Escape') {
        event.preventDefault()
        setExpanded(false)
      }
    }
    document.addEventListener('keydown', onKey, true)
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey, true)
      document.body.style.overflow = previous
    }
  }, [expanded])

  return (
    <>
      <div className="admin-device-map relative h-80 overflow-hidden rounded-xl border border-zinc-800/80">
        <OrderPinsCanvas pins={pins} frameKey={frameKey} interactive={false} />
        {expanded ? null : (
          <>
            <button
              type="button"
              className="absolute inset-0 z-10 cursor-pointer bg-transparent"
              onClick={() => setExpanded(true)}
              aria-label="Ver mapa de domicilios a pantalla completa"
            />
            <p className="pointer-events-none absolute inset-x-3 top-3 z-20 rounded-lg bg-zinc-950/75 px-3 py-1.5 text-center text-xs text-zinc-200">
              Toca para ver a pantalla completa
            </p>
          </>
        )}
      </div>
      {expanded
        ? createPortal(
            <div
              className="admin-theme fixed inset-0 z-[120] flex h-dvh flex-col bg-zinc-950"
              role="dialog"
              aria-modal="true"
              aria-label="Mapa de domicilios"
            >
              <button
                type="button"
                onClick={() => setExpanded(false)}
                className="absolute right-3 top-[max(0.75rem,var(--safe-top))] z-[1000] flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-zinc-700 touch-manipulation"
                aria-label="Cerrar mapa"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
              <div className="admin-device-map min-h-0 flex-1 overflow-hidden">
                <OrderPinsCanvas pins={pins} frameKey={`${frameKey}:screen`} interactive />
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
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

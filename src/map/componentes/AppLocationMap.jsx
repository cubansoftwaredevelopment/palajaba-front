import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion } from 'framer-motion'
import L from 'leaflet'
import { buyerMapMarkerIcon, getCurrentMapPosition } from '../utils/sellerMap.js'
import { resolveMediaUrl } from '../../shared/utils/media.js'
import { createAppMap } from './createAppMap.js'

function escapeHtml(value) {
  return String(value || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function addressPin(label, photoUrl) {
  const text = escapeHtml(label || 'Entrega')
  const photo = escapeHtml(resolveMediaUrl(photoUrl) || '')
  const caption = `<div style="max-width:9.5rem;border-radius:14px;background:#59802c;color:#fdfbf2;padding:6px 8px;font:600 11px/1.3 sans-serif;text-align:center;box-shadow:0 8px 18px rgba(89,128,44,.28)">${text}</div>`
  const face = photo
    ? `<img src="${photo}" alt="" style="width:54px;height:54px;border-radius:999px;object-fit:cover;border:3px solid #fdfbf2;box-shadow:0 8px 18px rgba(89,128,44,.28)">`
    : ''
  return L.divIcon({
    className: 'route-map-pin',
    html: `<div class="route-pin__float" style="display:flex;flex-direction:column;align-items:center;gap:4px">${caption}${face}<div style="width:0;height:0;border-left:7px solid transparent;border-right:7px solid transparent;border-top:8px solid #59802c"></div></div>`,
    iconSize: [152, photo ? 118 : 64],
    iconAnchor: [76, photo ? 118 : 64],
  })
}

function courierPin(profileUrl, vehicleUrl) {
  const profile = escapeHtml(resolveMediaUrl(profileUrl) || '')
  const vehicle = escapeHtml(resolveMediaUrl(vehicleUrl) || '')
  const face = profile
    ? `<img src="${profile}" alt="" style="width:50%;height:100%;object-fit:cover">`
    : '<span style="width:50%;height:100%;background:#7b4c38"></span>'
  const ride = vehicle
    ? `<img src="${vehicle}" alt="" style="width:50%;height:100%;object-fit:cover">`
    : '<span style="width:50%;height:100%;background:#59802c"></span>'
  return L.divIcon({
    className: 'route-map-pin',
    html: `<button type="button" class="route-pin__float" style="display:block;border:0;background:transparent;padding:0;cursor:pointer"><span style="display:flex;width:54px;height:54px;overflow:hidden;border-radius:999px;border:3px solid #fdfbf2;box-shadow:0 8px 18px rgba(89,128,44,.28)">${face}${ride}</span></button>`,
    iconSize: [54, 54],
    iconAnchor: [27, 54],
  })
}

const controlClass = 'absolute z-[1000] grid h-11 w-11 place-items-center rounded-xl border border-brand-green/15 bg-brand-white/95 text-brand-green shadow-lg backdrop-blur transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green/40 disabled:opacity-60'

export default function AppLocationMap({
  destination = null,
  points = [],
  pins = [],
  current = null,
  courier = null,
  collapsedHeight = '12rem',
  fullscreen = false,
  onLocate = null,
  onCourierClick = null,
  onBack = null,
}) {
  const mapRef = useRef(null)
  const mapInstance = useRef(null)
  const layers = useRef([])
  const [expanded, setExpanded] = useState(false)
  const [located, setLocated] = useState(null)
  const [locating, setLocating] = useState(false)
  const [locateError, setLocateError] = useState('')
  const anchorRef = useRef(null)
  const [anchorBox, setAnchorBox] = useState(null)
  const here = located || current
  const routeKey = JSON.stringify({
    destination: destination?.lat != null ? [destination.lat, destination.lng, destination.label || '', destination.customer_photo_url || ''] : null,
    here: here?.lat != null ? [here.lat, here.lng] : null,
    points: points.map((point) => [point.lat, point.lng]),
    pins: pins.map((pin) => [pin.lat, pin.lng, pin.label || '']),
    courier: courier?.lat != null ? [courier.lat, courier.lng, courier.profilePhoto || '', courier.vehiclePhoto || ''] : null,
  })

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return undefined
    const center = here || destination || points[points.length - 1] || { lat: 23.13, lng: -82.38 }
    const map = createAppMap(mapRef.current, { center, zoom: 15, attributionControl: false, zoomControl: false })
    mapInstance.current = map
    const observer = new ResizeObserver(() => map.invalidateSize())
    observer.observe(mapRef.current)
    return () => {
      observer.disconnect()
      map.remove()
      mapInstance.current = null
    }
  }, [])

  useEffect(() => {
    const map = mapInstance.current
    if (!map) return undefined
    layers.current.forEach((layer) => layer.remove())
    const next = []
    const line = points.filter((point) => point.lat != null && point.lng != null).map((point) => [point.lat, point.lng])
    const trail = line.length > 1 ? line.slice(0, -1) : []
    const step = Math.max(1, Math.ceil(trail.length / 80))
    for (const [lat, lng] of trail.filter((_, index) => index % step === 0)) {
      next.push(L.circleMarker([lat, lng], {
        radius: 4,
        color: '#fdfbf2',
        weight: 1,
        fillColor: '#59802c',
        fillOpacity: 1,
      }).addTo(map))
    }
    if (destination?.lat != null && destination?.lng != null) {
      next.push(L.marker([destination.lat, destination.lng], { icon: addressPin(destination.label, destination.customer_photo_url), title: destination.label || 'Entrega' }).addTo(map))
    }
    for (const pin of pins) {
      if (pin?.lat == null || pin?.lng == null) continue
      next.push(L.marker([pin.lat, pin.lng], { icon: addressPin(pin.label), title: pin.label || 'Entrega' }).addTo(map))
    }
    if (courier?.lat != null && courier?.lng != null) {
      const marker = L.marker([courier.lat, courier.lng], {
        icon: courierPin(courier.profilePhoto, courier.vehiclePhoto),
        title: courier.name || 'Mensajero',
      }).addTo(map)
      marker.on('click', () => onCourierClick?.())
      next.push(marker)
    }
    if (here?.lat != null && here?.lng != null) {
      next.push(L.marker([here.lat, here.lng], { icon: buyerMapMarkerIcon, title: 'Ubicación actual' }).addTo(map))
    }
    layers.current = next
    const bounds = [...line]
    if (destination?.lat != null && destination?.lng != null) bounds.push([destination.lat, destination.lng])
    for (const pin of pins) {
      if (pin?.lat != null && pin?.lng != null) bounds.push([pin.lat, pin.lng])
    }
    if (courier?.lat != null && courier?.lng != null) bounds.push([courier.lat, courier.lng])
    if (here?.lat != null && here?.lng != null) bounds.push([here.lat, here.lng])
    if (bounds.length > 1) map.fitBounds(bounds, { padding: [28, 28] })
    else if (bounds.length === 1) map.setView(bounds[0], 15)
    const timer = window.setTimeout(() => map.invalidateSize(), 60)
    return () => window.clearTimeout(timer)
  }, [routeKey])

  const expandedRef = useRef(expanded)
  expandedRef.current = expanded

  useLayoutEffect(() => {
    if (!fullscreen) return undefined
    let frame = 0
    function place() {
      if (expandedRef.current) return
      const rect = anchorRef.current?.getBoundingClientRect()
      if (!rect || rect.width === 0) return
      setAnchorBox((current) => {
        if (current && Math.abs(current.top - rect.top) < 0.5 && Math.abs(current.left - rect.left) < 0.5 && Math.abs(current.width - rect.width) < 0.5 && Math.abs(current.height - rect.height) < 0.5) return current
        return { top: rect.top, left: rect.left, width: rect.width, height: rect.height }
      })
    }
    place()
    function tick() {
      place()
      frame = window.requestAnimationFrame(tick)
    }
    frame = window.requestAnimationFrame(tick)
    return () => window.cancelAnimationFrame(frame)
  }, [fullscreen, collapsedHeight])

  useEffect(() => {
    const timer = window.setTimeout(() => mapInstance.current?.invalidateSize(), 460)
    return () => window.clearTimeout(timer)
  }, [expanded, anchorBox])

  useEffect(() => {
    if (!expanded || !fullscreen) return undefined
    function onKey(event) {
      if (event.key !== 'Escape') return
      event.preventDefault()
      event.stopPropagation()
      setExpanded(false)
    }
    document.addEventListener('keydown', onKey, true)
    return () => document.removeEventListener('keydown', onKey, true)
  }, [expanded, fullscreen])

  async function locate() {
    setLocateError('')
    setLocating(true)
    try {
      const point = await getCurrentMapPosition()
      setLocated(point)
      mapInstance.current?.setView([point.lat, point.lng], 16)
      await onLocate?.(point)
    } catch (error) {
      setLocateError(error.message || 'No se pudo obtener tu ubicación.')
    } finally {
      setLocating(false)
    }
  }

  const cover = fullscreen && expanded
  const frame = (
    <motion.div
      className={`${fullscreen ? 'fixed z-[280]' : 'relative w-full'} ${!fullscreen && !expanded ? 'map-allows-page-scroll' : ''} overflow-hidden border border-brand-green/12 bg-brand-white shadow-[0_2px_12px_rgba(89,128,44,0.06)]`}
      initial={false}
      animate={fullscreen
        ? (cover
          ? { top: 0, left: 0, width: '100vw', height: '100dvh', borderRadius: 0 }
          : { top: anchorBox?.top ?? 0, left: anchorBox?.left ?? 0, width: anchorBox?.width ?? 0, height: anchorBox?.height || collapsedHeight, borderRadius: 16 })
        : { height: expanded ? 'calc(100dvh - 5.5rem)' : collapsedHeight, borderRadius: expanded ? 20 : 16 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      onUpdate={() => mapInstance.current?.invalidateSize()}
    >
      <div ref={mapRef} className="absolute inset-0" role="img" aria-label="Mapa de la ruta" />
      {onBack ? (
        <button type="button" onClick={onBack} aria-label="Volver" className={`${controlClass} left-3 top-3`}>
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M15 18 9 12l6-6" /></svg>
        </button>
      ) : null}
      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        aria-label={expanded ? 'Reducir mapa' : 'Ampliar mapa'}
        title={expanded ? 'Reducir mapa' : 'Ampliar mapa'}
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
        onClick={locate}
        disabled={locating}
        aria-label={locating ? 'Buscando ubicación' : 'Usar mi ubicación'}
        title={locating ? 'Buscando ubicación…' : 'Usar mi ubicación'}
        className={`${controlClass} bottom-3 right-3`}
      >
        <svg viewBox="0 0 24 24" className={`h-5 w-5 ${locating ? 'animate-pulse' : ''}`} fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="12" cy="12" r="3" /><path d="M12 2v3m0 14v3M2 12h3m14 0h3" /><circle cx="12" cy="12" r="8" /></svg>
      </button>
      {locateError ? <p role="alert" className="absolute bottom-3 left-3 z-[1000] max-w-[70%] rounded-lg bg-white/95 px-3 py-2 text-xs text-red-700 shadow">{locateError}</p> : null}
    </motion.div>
  )

  if (!fullscreen || typeof document === 'undefined') return frame
  return (
    <>
      <div ref={anchorRef} className="w-full" style={{ height: collapsedHeight }} />
      {createPortal(frame, document.body)}
    </>
  )
}

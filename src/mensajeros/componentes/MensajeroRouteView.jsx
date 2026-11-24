import { useEffect, useRef, useState } from 'react'
import EvidenceGallery from './EvidenceGallery.jsx'
import AppLocationMap from '../../map/componentes/AppLocationMap.jsx'
import SellerFilterDropdown from '../../seller/componentes/SellerFilterDropdown.jsx'
import { sellerBtnPrimary, sellerInput } from '../../seller/componentes/sellerStyles.js'
import { submitMensajeroEvidence } from '../api'
import { useFormErrorToast } from '../../shared/componentes/useFormErrorToast.jsx'
import { IMAGE_TOO_LARGE_MESSAGE, prepareUploadImage } from '../../shared/utils/imageUpload.js'
import { useRouteTelemetry } from '../utils/useRouteTelemetry.js'
import OrderCourierCost from './OrderCourierCost.jsx'
import { vehicleLabel } from '../utils/constants.js'

function trailKm(points) {
  let total = 0
  for (let index = 1; index < points.length; index += 1) {
    const previous = points[index - 1]
    const current = points[index]
    const lat1 = previous.lat * Math.PI / 180
    const lat2 = current.lat * Math.PI / 180
    const dlat = lat2 - lat1
    const dlon = (current.lng - previous.lng) * Math.PI / 180
    const h = Math.sin(dlat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dlon / 2) ** 2
    total += 2 * 6371 * Math.asin(Math.min(1, Math.sqrt(h)))
  }
  return Math.round(total * 100) / 100
}

function SlideToStart({ disabled, onStart }) {
  const trackRef = useRef(null)
  const draggingRef = useRef(false)
  const [offset, setOffset] = useState(0)
  const [dragging, setDragging] = useState(false)

  function moveTo(event) {
    const rect = trackRef.current?.getBoundingClientRect()
    if (!rect) return 0
    const max = Math.max(0, rect.width - 56)
    const next = Math.min(Math.max(0, event.clientX - rect.left - 28), max)
    setOffset(next)
    return next / (max || 1)
  }

  function end(event) {
    if (!draggingRef.current) return
    const progress = moveTo(event)
    draggingRef.current = false
    setDragging(false)
    setOffset(0)
    if (progress > 0.72 && !disabled) onStart()
  }

  const fill = offset + 52

  return (
    <div ref={trackRef} className="relative mt-4 h-14 touch-none overflow-hidden rounded-full bg-brand-green/10 [container-type:inline-size]">
      <div
        className="absolute inset-y-0 left-0 bg-brand-green"
        style={{ width: fill, transition: dragging ? 'none' : 'width 0.25s ease' }}
      />
      <span className="pointer-events-none absolute inset-0 grid place-items-center text-sm font-semibold text-brand-green">Desliza para comenzar la ruta</span>
      <span className="pointer-events-none absolute inset-y-0 left-0 overflow-hidden" style={{ width: fill, transition: dragging ? 'none' : 'width 0.25s ease' }}>
        <span className="absolute inset-y-0 left-0 grid w-[100cqi] place-items-center text-sm font-semibold text-white">Desliza para comenzar la ruta</span>
      </span>
      <button
        type="button"
        disabled={disabled}
        className="absolute top-1 left-1 z-10 grid h-12 w-12 place-items-center rounded-full bg-brand-green text-brand-white touch-none disabled:opacity-50"
        style={{ transform: `translateX(${offset}px)`, transition: dragging ? 'none' : 'transform 0.25s ease' }}
        onPointerDown={(event) => {
          if (disabled) return
          event.currentTarget.setPointerCapture(event.pointerId)
          draggingRef.current = true
          setDragging(true)
        }}
        onPointerMove={(event) => { if (draggingRef.current) moveTo(event) }}
        onPointerUp={end}
        onPointerCancel={() => { draggingRef.current = false; setDragging(false); setOffset(0) }}
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
      </button>
    </div>
  )
}

export default function MensajeroRouteView({ batch, vehicles, onBack, onStart, onChanged }) {
  const [vehicleId, setVehicleId] = useState(batch.vehicle_id || vehicles[0]?.id || '')
  const [note, setNote] = useState('')
  const [files, setFiles] = useState([])
  const [previews, setPreviews] = useState([])
  const openOrders = (batch.orders || []).filter((order) => order.assignment_status !== 'closed' && order.assignment_status !== 'cancelled')
  const [orderId, setOrderId] = useState(openOrders[0]?.id || '')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const { showError, toastNode } = useFormErrorToast()
  const [points, setPoints] = useState(batch.points || [])
  const km = points.length > 1 ? trailKm(points) : (Number(batch.km) || 0)
  const running = batch.status === 'in_progress'
  const finished = batch.status === 'completed'
  useRouteTelemetry(batch.id, running, (point) => {
    setPoints((current) => {
      const last = current[current.length - 1]
      if (last && last.lat === point.lat && last.lng === point.lng) return current
      return [...current, point]
    })
  })

  useEffect(() => () => { previews.forEach((url) => URL.revokeObjectURL(url)) }, [previews])

  const pins = (batch.orders || [])
    .filter((order) => order.latitude != null && order.longitude != null)
    .map((order) => ({ lat: Number(order.latitude), lng: Number(order.longitude), label: order.address || '' }))

  async function sendEvidence(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      await submitMensajeroEvidence(orderId, { note, files })
      setNote('')
      setFiles([])
      previews.forEach((url) => URL.revokeObjectURL(url))
      setPreviews([])
      onChanged()
    } catch (err) {
      if (String(err.message || '').includes('pesa demasiado')) showError(IMAGE_TOO_LARGE_MESSAGE)
      else setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function addEvidencePhotos(event) {
    const incoming = Array.from(event.target.files || [])
    event.target.value = ''
    const prepared = []
    for (const file of incoming) {
      const result = await prepareUploadImage(file)
      if (!result.ok) {
        if (result.message === IMAGE_TOO_LARGE_MESSAGE) showError(result.message)
        else setError(result.message)
        continue
      }
      prepared.push(result.file)
    }
    if (!prepared.length) return
    setFiles(prepared)
    setPreviews((current) => {
      current.forEach((url) => URL.revokeObjectURL(url))
      return prepared.map((file) => URL.createObjectURL(file))
    })
  }

  return (
    <section>
      {toastNode}
      <AppLocationMap
        collapsedHeight="33dvh"
        onBack={onBack}
        points={points}
        pins={pins}
        current={points[points.length - 1] || null}
      />
      <ul className="mt-3 space-y-2">
        {(batch.orders || []).map((order) => (
          <li key={order.id} className="rounded-2xl border border-brand-green/12 bg-brand-white px-3 py-2">
            <p className="font-semibold text-brand-carmelita">#{order.code} · {order.buyer_name}</p>
            <p className="text-sm text-brand-carmelita">{order.address || 'Este pedido no tiene pin: solo dirección de texto.'}</p>
            <OrderCourierCost order={order} km={km} done={order.assignment_status === 'closed'} />
            <EvidenceGallery evidence={order.evidence} orderId={order.evidence ? order.id : ''} />
          </li>
        ))}
      </ul>
      {running ? (
        <form className="mt-4 space-y-2" onSubmit={sendEvidence}>
          <SellerFilterDropdown
            label="Pedido"
            placeholder="Elige el pedido"
            options={openOrders.map((order) => ({ value: order.id, label: `Cerrar #${order.code}` }))}
            value={orderId}
            onChange={(value) => { if (value) setOrderId(value) }}
          />
          <textarea className={sellerInput} rows={3} placeholder="Nota de la evidencia" value={note} onChange={(event) => setNote(event.target.value)} />
          <div className="flex flex-wrap items-center gap-2">
            <EvidenceGallery images={previews} inline />
            <label className="grid h-16 w-16 shrink-0 cursor-pointer place-items-center rounded-xl border border-dashed border-brand-green/30 text-brand-green" aria-label="Agregar fotos de la evidencia">
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true"><path d="M4 8h3l2-2h6l2 2h3v11H4z" /><circle cx="12" cy="13" r="3.5" /></svg>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                className="hidden"
                onChange={addEvidencePhotos}
              />
            </label>
          </div>
          {error ? <p className="text-sm font-semibold text-red-700">{error}</p> : null}
          <button className={sellerBtnPrimary} type="submit" disabled={busy || !orderId}>{busy ? 'Enviando…' : 'Enviar evidencia y cerrar pedido'}</button>
        </form>
      ) : finished ? null : (
        <div className="mt-4">
          <SellerFilterDropdown
            label="Vehículo de esta ruta"
            placeholder="Elige un vehículo"
            options={vehicles.map((vehicle) => ({ value: vehicle.id, label: `${vehicleLabel(vehicle.vehicle_type)} ${vehicle.plate || ''}`.trim() }))}
            value={vehicleId}
            onChange={setVehicleId}
          />
          {vehicles.length === 0 ? <p className="mt-2 text-sm text-brand-carmelita">Agrega un vehículo en tu perfil antes de salir.</p> : null}
          <SlideToStart disabled={!vehicleId || busy} onStart={() => onStart(vehicleId)} />
          {error ? <p className="mt-2 text-sm font-semibold text-red-700">{error}</p> : null}
        </div>
      )}
    </section>
  )
}

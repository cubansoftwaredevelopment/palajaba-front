import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { backdropFade, dialogSpring } from '../../motion/presets'
import AppLocationMap from './AppLocationMap'
import { resolveMediaUrl } from '../../lib/media'
import { fetchCustomerOrderTracking, fetchSellerOrderTracking, saveCustomerOrderLocation } from '../../mensajeros/api'
import { getSellerToken } from '../../lib/sellerAuth'

export default function OrderRouteMap({ orderId, role = 'seller', fullscreen = false }) {
  const [tracking, setTracking] = useState(null)
  const [message, setMessage] = useState('')
  const [courierOpen, setCourierOpen] = useState(false)
  const reducedMotion = useReducedMotion()

  useEffect(() => {
    if (!orderId) return undefined
    let stopped = false
    async function load() {
      try {
        const data = role === 'customer'
          ? await fetchCustomerOrderTracking(orderId)
          : await fetchSellerOrderTracking(getSellerToken(), orderId)
        if (!stopped) setTracking(data)
      } catch {
        if (!stopped) setTracking(null)
      }
    }
    load()
    const timer = window.setInterval(load, 5000)
    return () => {
      stopped = true
      window.clearInterval(timer)
    }
  }, [orderId, role])

  async function locate() {
    setMessage('')
    if (role === 'seller') {
      if (!tracking?.customer_location) setMessage('El cliente todavía no compartió su ubicación.')
      return
    }
    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 8000 })
      })
      const point = { lat: position.coords.latitude, lng: position.coords.longitude }
      await saveCustomerOrderLocation(orderId, point)
      setTracking((current) => ({ ...(current || {}), customer_location: point }))
    } catch (error) {
      setMessage(error.message || 'No pudimos leer tu ubicación.')
    }
  }

  const destination = tracking?.destination?.lat != null ? tracking.destination : null
  const messenger = tracking?.messenger
  const courier = tracking?.courier?.lat != null ? {
    ...tracking.courier,
    name: [messenger?.first_name, messenger?.last_name].filter(Boolean).join(' '),
    profilePhoto: messenger?.profile_photo_url,
    vehiclePhoto: messenger?.vehicle_photo_urls?.[0],
  } : null
  const photos = messenger?.vehicle_photo_urls || []

  return (
    <div className="mt-3">
      <AppLocationMap
        destination={destination}
        points={tracking?.points || []}
        current={tracking?.customer_location}
        courier={courier}
        fullscreen={fullscreen}
        onCourierClick={() => setCourierOpen(true)}
        onLocate={locate}
      />
      {message ? <p className="mt-2 text-xs font-semibold text-brand-carmelita">{message}</p> : null}
      {createPortal(
        <AnimatePresence>
          {courierOpen && messenger ? (
            <motion.div
              key="courier-pin"
              className="fixed inset-0 z-[300] flex items-end justify-center bg-brand-green/25 p-4 sm:items-center"
              role="presentation"
              initial={reducedMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={reducedMotion ? { duration: 0 } : backdropFade}
              onMouseDown={(event) => { if (event.target === event.currentTarget) setCourierOpen(false) }}
            >
              <motion.div
                className="w-full max-w-sm rounded-3xl bg-brand-white p-5 shadow-[0_24px_60px_rgba(89,128,44,0.22)]"
                role="dialog"
                aria-modal="true"
                aria-labelledby="courier-pin-title"
                initial={reducedMotion ? false : { y: 48, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 32, opacity: 0 }}
                transition={reducedMotion ? { duration: 0 } : dialogSpring}
              >
                <div className="flex items-start justify-between gap-3">
                  <h2 id="courier-pin-title" className="font-display text-xl font-bold text-brand-green">{courier?.name || 'Mensajero'}</h2>
                  <button type="button" className="grid h-9 w-9 place-items-center rounded-full text-brand-green" aria-label="Cerrar" onClick={() => setCourierOpen(false)}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12" /></svg>
                  </button>
                </div>
                {messenger.profile_photo_url ? <img src={resolveMediaUrl(messenger.profile_photo_url)} alt="" className="mx-auto mt-3 h-28 w-28 rounded-full object-cover" /> : null}
                {photos.length ? (
                  <div className="mt-4 grid grid-cols-3 gap-2">
                    {photos.map((url) => <img key={url} src={resolveMediaUrl(url)} alt="" className="h-20 w-full rounded-xl object-cover" />)}
                  </div>
                ) : <p className="mt-3 text-sm text-brand-carmelita/70">Este vehículo no tiene fotos.</p>}
              </motion.div>
            </motion.div>
          ) : null}
        </AnimatePresence>,
        document.body,
      )}
    </div>
  )
}

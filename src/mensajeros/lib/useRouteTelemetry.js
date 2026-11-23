import { useEffect, useRef } from 'react'
import { pushMensajeroPoint } from '../api'

async function readPosition() {
  const { Geolocation } = await import('@capacitor/geolocation')
  const position = await Geolocation.getCurrentPosition({ enableHighAccuracy: true, timeout: 8000 })
  return {
    lat: position.coords.latitude,
    lng: position.coords.longitude,
    accuracy: position.coords.accuracy,
  }
}

export function useRouteTelemetry(batchId, active, onPoint) {
  const onPointRef = useRef(onPoint)
  onPointRef.current = onPoint

  useEffect(() => {
    if (!active || !batchId) return undefined
    let stopped = false
    let lastSent = 0
    let background = null
    let clearTimer = () => {}

    async function send(coords) {
      if (stopped || !coords || coords.lat == null || coords.lng == null) return
      const now = Date.now()
      if (now - lastSent < 2500) return
      lastSent = now
      const location = { lat: coords.lat, lng: coords.lng }
      onPointRef.current?.(location)
      try {
        await pushMensajeroPoint(batchId, {
          client_id: crypto.randomUUID(),
          lat: location.lat,
          lng: location.lng,
          accuracy: coords.accuracy ?? null,
          recorded_at: new Date().toISOString(),
        })
      } catch {
        /* el sync manager reintenta si no hubo respuesta */
      }
    }

    async function begin() {
      try {
        const plugin = await import('@capgo/background-geolocation')
        const Background = plugin.BackgroundGeolocation || plugin.default
        if (Background?.start) {
          background = Background
          await Background.start(
            {
              backgroundMessage: 'Mensajería en curso',
              backgroundTitle: 'Pa\' La Jaba',
              requestPermissions: true,
              stale: false,
              distanceFilter: 0,
            },
            (location) => {
              const lat = location?.latitude ?? location?.lat
              const lng = location?.longitude ?? location?.lng
              if (lat == null || lng == null) return
              void send({ lat, lng, accuracy: location.accuracy })
            },
          )
        }
      } catch {
        background = null
      }
      const { Geolocation } = await import('@capacitor/geolocation')
      await Geolocation.requestPermissions().catch(() => {})
      const tick = async () => {
        try {
          await send(await readPosition())
        } catch {
          /* sin GPS en este instante; el plugin sigue en segundo plano */
        }
      }
      await tick()
      const timer = window.setInterval(tick, 3000)
      clearTimer = () => window.clearInterval(timer)
    }

    begin()

    return () => {
      stopped = true
      clearTimer()
      background?.stop?.().catch(() => {})
    }
  }, [active, batchId])
}

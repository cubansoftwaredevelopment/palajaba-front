import { useEffect, useRef } from 'react'
import { NETWORK_ERROR_CODE } from '../../api/client.js'
import { pushMensajeroPoint } from '../api'
import { getMensajeroToken } from './session.js'
import { clearOfflineLocationNotice, showOfflineLocationNotice } from './offlineLocationNotice.js'
import {
  acceptPoint,
  clearBatch,
  dropTrail,
  markSent,
  readLogCursor,
  readPending,
  readTrail,
  seedLast,
  setLogCursor,
} from './routePointQueue.js'

function lostNetwork(error) {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return true
  if (error?.code === NETWORK_ERROR_CODE) return true
  return error instanceof TypeError
}

function pointUrl(batchId) {
  const base = String(import.meta.env.VITE_API_URL || '').replace(/\/$/, '')
  if (!base) return undefined
  return `${base}/api/mensajeros/batches/${encodeURIComponent(batchId)}/points`
}

async function readPosition() {
  const { Geolocation } = await import('@capacitor/geolocation')
  const position = await Geolocation.getCurrentPosition({ enableHighAccuracy: true, timeout: 8000 })
  return {
    lat: position.coords.latitude,
    lng: position.coords.longitude,
    accuracy: position.coords.accuracy,
    time: position.timestamp || Date.now(),
  }
}

export function useRouteTelemetry(batchId, active, { onFix, onPending, onClosed } = {}) {
  const onFixRef = useRef(onFix)
  const onPendingRef = useRef(onPending)
  const onClosedRef = useRef(onClosed)
  const seedRef = useRef(null)
  onFixRef.current = onFix
  onPendingRef.current = onPending
  onClosedRef.current = onClosed

  useEffect(() => {
    if (!active || !batchId) return undefined
    let stopped = false
    let flushing = false
    let retryTimer = 0
    let background = null
    let watchId = null
    let clearTimer = () => {}
    seedLast(batchId, seedRef.current)

    function publish() {
      onPendingRef.current?.(readTrail(batchId))
    }

    function noteFix(coords) {
      if (coords?.lat == null || coords?.lng == null) return
      onFixRef.current?.({ lat: Number(coords.lat), lng: Number(coords.lng) })
    }

    function scheduleRetry() {
      if (retryTimer || stopped) return
      retryTimer = window.setTimeout(() => {
        retryTimer = 0
        void flush()
      }, 5000)
    }

    async function flush() {
      if (flushing || stopped) return
      flushing = true
      try {
        while (!stopped) {
          const next = readPending(batchId)[0]
          if (!next) break
          try {
            const result = await pushMensajeroPoint(batchId, next)
            markSent(batchId, next.client_id)
            if (result?.skipped) dropTrail(batchId, next.client_id)
            publish()
            await clearOfflineLocationNotice()
          } catch (error) {
            if (error?.status === 409) {
              clearBatch(batchId)
              publish()
              stopped = true
              background?.stop?.().catch(() => {})
              onClosedRef.current?.()
            } else if (lostNetwork(error)) {
              void showOfflineLocationNotice()
            }
            scheduleRetry()
            break
          }
        }
      } finally {
        flushing = false
      }
    }

    function keep(coords) {
      if (stopped || coords?.lat == null || coords?.lng == null) return
      noteFix(coords)
      const saved = acceptPoint(batchId, coords)
      if (!saved.accepted) return
      publish()
      void flush()
    }

    async function absorbLog(plugin) {
      if (!plugin?.getLocationLog) return
      let cursor = readLogCursor(batchId)
      for (let page = 0; page < 20; page += 1) {
        const result = await plugin.getLocationLog({ afterId: cursor }).catch(() => null)
        const entries = result?.entries || []
        if (!entries.length) break
        let pageCursor = cursor
        for (const entry of entries) {
          const lat = entry.latitude ?? entry.lat
          const lng = entry.longitude ?? entry.lng
          if (lat == null || lng == null) continue
          acceptPoint(batchId, {
            lat,
            lng,
            accuracy: entry.accuracy,
            time: entry.time || Date.now(),
          })
          if (entry.id > pageCursor) pageCursor = entry.id
        }
        if (pageCursor <= cursor) break
        cursor = pageCursor
        setLogCursor(batchId, cursor)
        if (entries.length < 100) break
      }
      publish()
      void flush()
    }

    async function begin() {
      publish()
      try {
        const plugin = await import('@capgo/background-geolocation')
        const Background = plugin.BackgroundGeolocation || plugin.default
        if (Background?.start) {
          background = Background
          const token = getMensajeroToken()
          const url = pointUrl(batchId)
          if (stopped) return
          await Background.start(
            {
              backgroundMessage: 'Mensajería en curso',
              backgroundTitle: 'Pa\' La Jaba',
              requestPermissions: true,
              stale: false,
              distanceFilter: 15,
              networkFallback: true,
              locationLog: true,
              ...(url ? { url } : {}),
              headers: token ? { Authorization: `Bearer ${token}` } : {},
            },
            (location) => {
              const lat = location?.latitude ?? location?.lat
              const lng = location?.longitude ?? location?.lng
              if (lat == null || lng == null) return
              keep({ lat, lng, accuracy: location.accuracy, time: location.time || Date.now() })
            },
          )
          if (!stopped) await absorbLog(Background)
        }
      } catch {
        background = null
      }
      if (stopped) {
        background?.stop?.().catch(() => {})
        return
      }

      const { Geolocation } = await import('@capacitor/geolocation')
      await Geolocation.requestPermissions().catch(() => {})
      if (stopped) return
      try {
        const id = await Geolocation.watchPosition(
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 1000 },
          (position, error) => {
            if (error || !position?.coords) return
            keep({
              lat: position.coords.latitude,
              lng: position.coords.longitude,
              accuracy: position.coords.accuracy,
              time: position.timestamp || Date.now(),
            })
          },
        )
        if (stopped) {
          Geolocation.clearWatch({ id }).catch(() => {})
          return
        }
        watchId = id
      } catch {
        const tick = async () => {
          try {
            keep(await readPosition())
          } catch {
            /* el plugin nativo sigue con la pantalla apagada */
          }
        }
        await tick()
        const timer = window.setInterval(tick, 3000)
        clearTimer = () => window.clearInterval(timer)
      }
    }

    function onOffline() {
      void showOfflineLocationNotice()
    }
    function onOnline() {
      void flush()
    }
    function onVisible() {
      if (document.visibilityState === 'visible') {
        void absorbLog(background)
        void flush()
      }
    }
    window.addEventListener('offline', onOffline)
    window.addEventListener('online', onOnline)
    document.addEventListener('visibilitychange', onVisible)
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      void showOfflineLocationNotice()
    }

    begin()

    return () => {
      stopped = true
      clearTimer()
      if (retryTimer) window.clearTimeout(retryTimer)
      window.removeEventListener('offline', onOffline)
      window.removeEventListener('online', onOnline)
      document.removeEventListener('visibilitychange', onVisible)
      void clearOfflineLocationNotice()
      background?.stop?.().catch(() => {})
      if (watchId) {
        import('@capacitor/geolocation').then(({ Geolocation }) => {
          Geolocation.clearWatch({ id: watchId }).catch(() => {})
        }).catch(() => {})
      }
    }
  }, [active, batchId])

  return seedRef
}

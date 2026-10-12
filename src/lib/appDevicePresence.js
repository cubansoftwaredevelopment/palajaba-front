import { useEffect, useRef } from 'react'
import { Capacitor } from '@capacitor/core'
import { useLiveLocation } from '../live/context/LiveLocationContext'
import { recordAppDevicePresence } from './api'
import { getGestorToken } from './gestorAuth'
import { getSellerToken } from './sellerAuth'

const STORAGE_KEY = 'pala-jaba-device-id'
const INTERVAL_MS = 60_000

function readDeviceId() {
  const existing = localStorage.getItem(STORAGE_KEY)
  if (existing && existing.length >= 8) return existing
  const next =
    globalThis.crypto?.randomUUID?.() ??
    `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 14)}`
  localStorage.setItem(STORAGE_KEY, next)
  return next
}

function sessionKind() {
  if (getSellerToken()) return 'seller'
  if (getGestorToken()) return 'gestor'
  return null
}

export default function AppDevicePresence() {
  const { coords } = useLiveLocation()
  const coordsRef = useRef(coords)
  coordsRef.current = coords

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return undefined
    const platform = Capacitor.getPlatform()
    if (platform !== 'android' && platform !== 'ios') return undefined

    let stopped = false
    let timer = 0
    let removeAppListener = () => {}

    async function beat() {
      if (stopped || document.visibilityState === 'hidden') return
      const current = coordsRef.current
      const body = {
        device_id: readDeviceId(),
        platform,
        session_kind: sessionKind(),
      }
      if (typeof current?.lat === 'number' && typeof current?.lng === 'number') {
        body.lat = current.lat
        body.lng = current.lng
      }
      try {
        await recordAppDevicePresence(body)
      } catch {
        // El censo no debe interrumpir el uso de la app.
      }
    }

    function stop() {
      window.clearInterval(timer)
      timer = 0
    }

    function start() {
      stop()
      beat()
      timer = window.setInterval(beat, INTERVAL_MS)
    }

    function onVisibility() {
      if (document.visibilityState === 'hidden') stop()
      else start()
    }

    start()
    document.addEventListener('visibilitychange', onVisibility)
    import('@capacitor/app').then(({ App }) => {
      if (stopped) return
      App.addListener('appStateChange', ({ isActive }) => {
        if (!isActive) stop()
        else start()
      }).then((handle) => {
        removeAppListener = () => handle.remove()
      })
    })

    return () => {
      stopped = true
      stop()
      document.removeEventListener('visibilitychange', onVisibility)
      removeAppListener()
    }
  }, [])

  return null
}

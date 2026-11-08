import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import {
  LOCATION_PERMISSION_DENIED,
  LOCATION_PERMISSION_GRANTED,
  LOCATION_PERMISSION_PROMPT,
} from '../constants'
import { watchForegroundLocation } from '../utils'

const LiveLocationContext = createContext({
  coords: null,
  permission: LOCATION_PERMISSION_PROMPT,
  requestLocation: () => {},
})

export function LiveLocationProvider({ children }) {
  const [coords, setCoords] = useState(null)
  const [permission, setPermission] = useState(LOCATION_PERMISSION_PROMPT)

  const requestLocation = useCallback(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = Number(position?.coords?.latitude)
        const lng = Number(position?.coords?.longitude)
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return
        setCoords({ lat, lng })
        setPermission(LOCATION_PERMISSION_GRANTED)
      },
      (error) => {
        if (error?.code === 1) setPermission(LOCATION_PERMISSION_DENIED)
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 },
    )
  }, [])

  useEffect(() => {
    let cancelled = false
    let stop = () => {}

    async function resumeGranted() {
      if (!navigator.permissions?.query) return
      try {
        const status = await navigator.permissions.query({ name: 'geolocation' })
        if (cancelled || status.state !== 'granted') return
        const cleanup = await watchForegroundLocation(
          (next) => {
            if (cancelled) return
            setCoords(next)
            setPermission(LOCATION_PERMISSION_GRANTED)
          },
          (nextStatus) => {
            if (!cancelled && nextStatus === LOCATION_PERMISSION_DENIED) {
              setPermission(LOCATION_PERMISSION_DENIED)
            }
          },
        )
        if (cancelled) cleanup()
        else stop = cleanup
      } catch {
        // Sin la API de permisos, el aviso queda para el botón del mapa.
      }
    }

    resumeGranted()

    return () => {
      cancelled = true
      stop()
    }
  }, [])

  const value = useMemo(
    () => ({ coords, permission, requestLocation }),
    [coords, permission, requestLocation],
  )
  return <LiveLocationContext.Provider value={value}>{children}</LiveLocationContext.Provider>
}

export function useLiveLocation() {
  return useContext(LiveLocationContext)
}

import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import {
  LOCATION_PERMISSION_DENIED,
  LOCATION_PERMISSION_GRANTED,
  LOCATION_PERMISSION_PROMPT,
} from '../constants'
import { watchForegroundLocation } from '../utils'

const LiveLocationContext = createContext({
  coords: null,
  permission: LOCATION_PERMISSION_PROMPT,
})

export function LiveLocationProvider({ children }) {
  const [coords, setCoords] = useState(null)
  const [permission, setPermission] = useState(LOCATION_PERMISSION_PROMPT)

  useEffect(() => {
    let stop = () => {}
    let cancelled = false

    watchForegroundLocation(
      (next) => {
        if (cancelled) return
        setCoords(next)
        setPermission(LOCATION_PERMISSION_GRANTED)
      },
      (status) => {
        if (!cancelled && status === LOCATION_PERMISSION_DENIED) {
          setPermission(LOCATION_PERMISSION_DENIED)
        }
      },
    ).then((cleanup) => {
      if (cancelled) cleanup()
      else stop = cleanup
    })

    return () => {
      cancelled = true
      stop()
    }
  }, [])

  const value = useMemo(() => ({ coords, permission }), [coords, permission])
  return <LiveLocationContext.Provider value={value}>{children}</LiveLocationContext.Provider>
}

export function useLiveLocation() {
  return useContext(LiveLocationContext)
}

import { Capacitor } from '@capacitor/core'
import { LIVE_EVENT_NOTIFICATION } from './constants'
import { registerSellerDevice, sellerEventsUrl, unregisterSellerDevice } from './api'

export function isNativeApp() {
  return Capacitor.isNativePlatform()
}

export function connectSellerEvents(accessToken, onNotification) {
  let socket
  let retryId
  let stopped = false

  function open() {
    socket = new WebSocket(sellerEventsUrl(accessToken))
    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        if (data?.type === LIVE_EVENT_NOTIFICATION && data.notification) {
          onNotification(data.notification)
        }
      } catch {
        /* mensaje ignorado */
      }
    }
    socket.onclose = () => {
      if (!stopped) retryId = window.setTimeout(open, 3000)
    }
  }

  open()

  return () => {
    stopped = true
    window.clearTimeout(retryId)
    socket?.close()
  }
}

let pushAuthToken = ''
let deviceToken = ''
let pushListening = false

export async function startSellerPush(accessToken) {
  if (!isNativeApp()) return
  pushAuthToken = accessToken
  const { PushNotifications } = await import('@capacitor/push-notifications')
  const permission = await PushNotifications.requestPermissions()
  if (permission.receive !== 'granted') return

  if (!pushListening) {
    pushListening = true
    await PushNotifications.addListener('registration', async (event) => {
      deviceToken = event.value
      const platform = Capacitor.getPlatform()
      if (platform !== 'android' && platform !== 'ios') return
      try {
        await registerSellerDevice({ token: event.value, platform })
      } catch {
        /* el aviso local del socket sigue disponible */
      }
    })
  }

  await PushNotifications.register()
}

export async function stopSellerPush() {
  if (!deviceToken || !pushAuthToken) {
    deviceToken = ''
    pushAuthToken = ''
    return
  }
  const token = deviceToken
  deviceToken = ''
  pushAuthToken = ''
  try {
    await unregisterSellerDevice(token)
  } catch {
    /* la sesión ya se cierra */
  }
}

function readPosition(position) {
  return {
    lat: position.coords.latitude,
    lng: position.coords.longitude,
  }
}

export async function watchForegroundLocation(onUpdate, onPermission) {
  let stopped = false
  let denied = false
  let stopWatch = () => {}

  function deny() {
    denied = true
    stopWatch()
    stopWatch = () => {}
    onPermission?.('denied')
  }

  async function start() {
    if (stopped || denied) return
    stopWatch()
    if (isNativeApp()) {
      const { Geolocation } = await import('@capacitor/geolocation')
      const permission = await Geolocation.requestPermissions()
      if (permission.location !== 'granted' && permission.coarseLocation !== 'granted') {
        deny()
        return
      }
      const watchId = await Geolocation.watchPosition(
        { enableHighAccuracy: true },
        (position, error) => {
          if (error?.code === 1) {
            deny()
            return
          }
          if (position) onUpdate(readPosition(position))
        },
      )
      stopWatch = () => {
        Geolocation.clearWatch({ id: watchId })
      }
      return
    }

    if (!navigator.geolocation) {
      deny()
      return
    }
    const watchId = navigator.geolocation.watchPosition(
      (position) => onUpdate(readPosition(position)),
      (error) => {
        if (error?.code === 1) deny()
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 },
    )
    stopWatch = () => navigator.geolocation.clearWatch(watchId)
  }

  function handleVisibility() {
    if (document.visibilityState === 'hidden') {
      stopWatch()
      stopWatch = () => {}
      return
    }
    start()
  }

  let removeAppListener = () => {}
  if (isNativeApp()) {
    const { App } = await import('@capacitor/app')
    const handle = await App.addListener('appStateChange', ({ isActive }) => {
      if (!isActive) {
        stopWatch()
        stopWatch = () => {}
        return
      }
      start()
    })
    removeAppListener = () => handle.remove()
  }

  document.addEventListener('visibilitychange', handleVisibility)
  await start()

  return () => {
    stopped = true
    stopWatch()
    removeAppListener()
    document.removeEventListener('visibilitychange', handleVisibility)
  }
}

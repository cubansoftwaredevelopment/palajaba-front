import { Capacitor } from '@capacitor/core'
import { Geolocation } from '@capacitor/geolocation'
import { LIVE_EVENT_NOTIFICATION } from './constants'
import { customerEventsUrl, registerSellerDevice, sellerEventsUrl, unregisterSellerDevice } from './api'
import { registerCustomerDevice, unregisterCustomerDevice } from '../buyer/api.js'

export function isNativeApp() {
  return Capacitor.isNativePlatform()
}

export function connectSellerEvents(accessToken, onNotification, onDataUpdate) {
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
        } else if (data?.type === 'seller_data_update') {
          onDataUpdate?.(data)
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

export function connectCustomerEvents(accessToken, onNotification, onDataUpdate) {
  let socket
  let retryId
  let stopped = false

  function open() {
    if (stopped) return
    socket = new WebSocket(customerEventsUrl(accessToken))
    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        if (data?.type === 'customer_notification' && data.notification) {
          onNotification?.(data.notification)
        } else if (data?.type === 'customer_data_update') {
          onDataUpdate?.(data)
        }
      } catch {
        /* mensaje ignorado */
      }
    }
    socket.onclose = () => {
      if (!stopped) retryId = window.setTimeout(open, 3000)
    }
    socket.onerror = () => socket?.close()
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
let pushRole = 'seller'

export const OPEN_SELLER_NOTIFICATIONS_EVENT = 'pala-jaba-open-seller-notifications'
export const OPEN_CUSTOMER_AVISOS_EVENT = 'pala-jaba-open-customer-avisos'
export const OPEN_APP_UPDATE_EVENT = 'pala-jaba-open-app-update'

function readPushData(notification) {
  const raw = notification?.data || notification?.notification?.data || {}
  const data = {}
  for (const [key, value] of Object.entries(raw)) {
    data[String(key)] = String(value ?? '')
  }
  return data
}

function dispatchPushNavigation(data) {
  const screen = String(data.screen || '').trim()
  if (screen === 'app_update') {
    window.dispatchEvent(
      new CustomEvent(OPEN_APP_UPDATE_EVENT, {
        detail: {
          platform: data.platform || '',
          version: data.version || '',
        },
      }),
    )
    return
  }
  if (screen === 'seller_notifications' || (!screen && pushRole === 'seller')) {
    window.dispatchEvent(
      new CustomEvent(OPEN_SELLER_NOTIFICATIONS_EVENT, {
        detail: {
          notificationId: data.notification_id || '',
          kind: data.kind || '',
        },
      }),
    )
    return
  }
  if (screen === 'customer_avisos' || (!screen && pushRole === 'customer')) {
    window.dispatchEvent(
      new CustomEvent(OPEN_CUSTOMER_AVISOS_EVENT, {
        detail: {
          notificationId: data.notification_id || '',
          orderId: data.order_id || '',
        },
      }),
    )
  }
}

/** Debe coincidir con ANDROID_PUSH_CHANNEL_ID en palajaba-back/app/live/push.py */
export const ANDROID_PUSH_CHANNEL_ID = 'pala_jaba_push'

async function ensureAndroidPushChannel(PushNotifications) {
  if (Capacitor.getPlatform() !== 'android') return
  try {
    await PushNotifications.createChannel({
      id: ANDROID_PUSH_CHANNEL_ID,
      name: 'Pa\' La Jaba',
      description: 'Avisos de pedidos, tienda y actualizaciones de la app',
      importance: 5,
      visibility: 1,
      sound: 'default',
      vibration: true,
      lights: true,
    })
  } catch {
    /* canal ya existe o Android < 8 */
  }
}

async function ensurePushListeners(PushNotifications) {
  if (pushListening) return
  pushListening = true
  await PushNotifications.addListener('registration', async (event) => {
    deviceToken = event.value
    const platform = Capacitor.getPlatform()
    if (platform !== 'android' && platform !== 'ios') return
    try {
      if (pushRole === 'customer') {
        await registerCustomerDevice({ token: event.value, platform }, pushAuthToken)
      } else {
        await registerSellerDevice({ token: event.value, platform })
      }
    } catch { /* push no disponible; la bandeja queda guardada en el servidor */ }
  })
  await PushNotifications.addListener('pushNotificationActionPerformed', (event) => {
    dispatchPushNavigation(readPushData(event?.notification))
  })
  await PushNotifications.addListener('pushNotificationReceived', (notification) => {
    const data = readPushData(notification)
    if (String(data.screen || '').trim() === 'app_update') {
      dispatchPushNavigation(data)
    }
  })
}

async function startNativePush(accessToken, role) {
  if (!isNativeApp()) return
  if (role === 'customer' && !accessToken) return
  pushRole = role
  pushAuthToken = accessToken || ''
  const { PushNotifications } = await import('@capacitor/push-notifications')
  const permission = await PushNotifications.requestPermissions()
  if (permission.receive !== 'granted') return
  await ensureAndroidPushChannel(PushNotifications)
  await ensurePushListeners(PushNotifications)
  await PushNotifications.register()
}

export async function startSellerPush(accessToken) {
  await startNativePush(accessToken, 'seller')
}

export async function startCustomerPush(accessToken) {
  await startNativePush(accessToken, 'customer')
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

export async function stopCustomerPush(accessToken = pushAuthToken) {
  if (!deviceToken || !accessToken || pushRole !== 'customer') return
  const token = deviceToken
  deviceToken = ''
  pushAuthToken = ''
  pushRole = 'seller'
  try { await unregisterCustomerDevice(token, accessToken) } catch { /* sesión finalizada */ }
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

  const nativePermission = isNativeApp() ? Geolocation.requestPermissions() : null

  async function start() {
    if (stopped || denied) return
    stopWatch()
    if (isNativeApp()) {
      const permission = await nativePermission
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

  if (!isNativeApp()) {
    if (!navigator.geolocation) {
      deny()
    } else {
      const watchId = navigator.geolocation.watchPosition(
        (position) => onUpdate(readPosition(position)),
        (error) => {
          if (error?.code === 1) deny()
        },
        { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 },
      )
      stopWatch = () => navigator.geolocation.clearWatch(watchId)
    }
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
  if (isNativeApp()) await start()

  return () => {
    stopped = true
    stopWatch()
    removeAppListener()
    document.removeEventListener('visibilitychange', handleVisibility)
  }
}

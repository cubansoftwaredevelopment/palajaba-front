import { Capacitor } from '@capacitor/core'

const NOTICE_ID = 41021
const CHANNEL_ID = 'route-offline'
const TITLE = 'Sin conexión'
const BODY = 'No hay red. Los datos de ubicación se mostrarán cuando la red vuelva.'

let visible = false

export async function showOfflineLocationNotice() {
  if (visible) return
  visible = true
  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications')
    if (Capacitor.getPlatform() === 'android') {
      await LocalNotifications.createChannel({
        id: CHANNEL_ID,
        name: 'Viaje sin red',
        description: 'Aviso cuando un viaje activo pierde la conexión',
        importance: 4,
        visibility: 1,
      })
    }
    const permission = await LocalNotifications.requestPermissions()
    if (permission.display !== 'granted') {
      visible = false
      return
    }
    await LocalNotifications.schedule({
      notifications: [
        {
          id: NOTICE_ID,
          title: TITLE,
          body: BODY,
          channelId: CHANNEL_ID,
          smallIcon: 'ic_stat_notify',
        },
      ],
    })
  } catch {
    visible = false
    if (typeof Notification === 'undefined') return
    let permission = Notification.permission
    if (permission === 'default') {
      permission = await Notification.requestPermission()
    }
    if (permission !== 'granted') return
    visible = true
    new Notification(TITLE, { body: BODY, tag: 'pala-jaba-route-offline' })
  }
}

export async function clearOfflineLocationNotice() {
  if (!visible) return
  visible = false
  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications')
    await LocalNotifications.cancel({ notifications: [{ id: NOTICE_ID }] })
  } catch {
    /* la notificación del navegador se reemplaza por el mismo tag */
  }
}

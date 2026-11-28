import { Capacitor, registerPlugin } from '@capacitor/core'

const NOTICE_ID = 41042
const CHANNEL_ID = 'account-sync'
const SYNC_EVENT = 'pala-jaba:sync-notice'
const RETRY_MS = 60_000

const AccountSync = registerPlugin('AccountSync')

let visible = null
let retryTimer = 0

function emit(notice) {
  window.dispatchEvent(new CustomEvent(SYNC_EVENT, { detail: notice }))
}

async function systemNotice(title, body) {
  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications')
    if (Capacitor.getPlatform() === 'android') {
      await LocalNotifications.createChannel({
        id: CHANNEL_ID,
        name: 'Sincronización',
        description: 'Aviso mientras la cuenta se sincroniza',
        importance: 3,
        visibility: 1,
      })
    }
    const permission = await LocalNotifications.requestPermissions()
    if (permission.display !== 'granted') return
    await LocalNotifications.schedule({
      notifications: [{ id: NOTICE_ID, title, body, channelId: CHANNEL_ID, smallIcon: 'ic_stat_notify' }],
    })
  } catch {
    if (typeof Notification === 'undefined') return
    let permission = Notification.permission
    if (permission === 'default') permission = await Notification.requestPermission()
    if (permission !== 'granted') return
    new Notification(title, { body, tag: 'pala-jaba-account-sync' })
  }
}

async function clearSystemNotice() {
  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications')
    await LocalNotifications.cancel({ notifications: [{ id: NOTICE_ID }] })
  } catch {
    /* el aviso del navegador usa el mismo tag y se reemplaza */
  }
}

async function nativeService(failed) {
  if (!Capacitor.isNativePlatform()) return
  try {
    await AccountSync.start({ failed })
  } catch {
    /* el temporizador de la página cubre el navegador */
  }
}

export async function showSyncingNotice() {
  if (visible === 'syncing') return
  visible = 'syncing'
  const title = 'Sincronizando tu cuenta'
  const body = 'Estamos bajando los datos más recientes.'
  emit({ id: 'syncing', title, content: body, tone: 'info' })
  await systemNotice(title, body)
  await nativeService(false)
}

export async function showSyncFailedNotice() {
  const changed = visible !== 'failed'
  visible = 'failed'
  const title = 'La sincronización falló'
  const body = 'Volveremos a intentarlo en un minuto.'
  emit({ id: 'failed', title, content: body, tone: 'error' })
  if (changed) await systemNotice(title, body)
  await nativeService(true)
  if (!Capacitor.isNativePlatform()) {
    window.clearTimeout(retryTimer)
    retryTimer = window.setTimeout(() => {
      window.__palaJabaSyncRetry?.()
    }, RETRY_MS)
  }
}

export async function clearSyncNotice() {
  visible = null
  window.clearTimeout(retryTimer)
  emit(null)
  await clearSystemNotice()
  if (!Capacitor.isNativePlatform()) return
  try {
    await AccountSync.stop()
  } catch {
    /* el servicio ya estaba detenido */
  }
}

export const SYNC_NOTICE_EVENT = SYNC_EVENT

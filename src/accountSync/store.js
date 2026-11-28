const DB_NAME = 'pala-jaba-accounts'
const STORE = 'accounts'

function openDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: 'id' })
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

function accountKey(role, accountId) {
  return `${role}:${accountId}`
}

export function accountIdFromToken(token) {
  try {
    const part = String(token || '').split('.')[1]
    if (!part) return ''
    const json = atob(part.replace(/-/g, '+').replace(/_/g, '/'))
    const payload = JSON.parse(json)
    return String(payload.customer_id || payload.seller_id || payload.gestor_id || payload.mensajero_id || payload.admin_id || '')
  } catch {
    return ''
  }
}

export async function readAccount(role, accountId) {
  if (!role || !accountId || typeof indexedDB === 'undefined') return null
  try {
    const db = await openDb()
    const value = await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly')
      const request = tx.objectStore(STORE).get(accountKey(role, accountId))
      request.onsuccess = () => resolve(request.result || null)
      request.onerror = () => reject(request.error)
    })
    db.close()
    return value
  } catch {
    return null
  }
}

export async function writeAccount(role, accountId, sections) {
  if (!role || !accountId || typeof indexedDB === 'undefined') return
  const db = await openDb()
  await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).put({ id: accountKey(role, accountId), role, accountId, sections, savedAt: new Date().toISOString() })
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
  db.close()
}

export function sectionDate(record, name) {
  const value = record?.sections?.[name]?.updatedAt
  return value || null
}

export function latestIso(values) {
  let best = null
  let bestMs = Number.NEGATIVE_INFINITY
  for (const value of values) {
    const ms = Date.parse(value || '')
    if (Number.isFinite(ms) && ms > bestMs) {
      bestMs = ms
      best = new Date(ms).toISOString()
    }
  }
  return best
}

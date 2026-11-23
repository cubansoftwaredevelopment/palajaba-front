const DB_NAME = 'pala-jaba-sync'
const VERSION = 1

function openDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, VERSION)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains('outbox')) db.createObjectStore('outbox', { keyPath: 'id' })
      if (!db.objectStoreNames.contains('reads')) db.createObjectStore('reads', { keyPath: 'path' })
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

function txDone(tx) {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
    tx.onabort = () => reject(tx.error)
  })
}

export async function putOutbox(record) {
  const db = await openDb()
  const tx = db.transaction('outbox', 'readwrite')
  tx.objectStore('outbox').put(record)
  await txDone(tx)
  db.close()
}

export async function deleteOutbox(id) {
  const db = await openDb()
  const tx = db.transaction('outbox', 'readwrite')
  tx.objectStore('outbox').delete(id)
  await txDone(tx)
  db.close()
}

export async function listOutbox() {
  const db = await openDb()
  const tx = db.transaction('outbox', 'readonly')
  const request = tx.objectStore('outbox').getAll()
  const rows = await new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result || [])
    request.onerror = () => reject(request.error)
  })
  db.close()
  return rows.sort((a, b) => a.createdAt - b.createdAt)
}

export async function putRead(path, data) {
  const db = await openDb()
  const tx = db.transaction('reads', 'readwrite')
  tx.objectStore('reads').put({ path, data, savedAt: Date.now() })
  await txDone(tx)
  db.close()
}

export async function getRead(path) {
  const db = await openDb()
  const tx = db.transaction('reads', 'readonly')
  const request = tx.objectStore('reads').get(path)
  const row = await new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result || null)
    request.onerror = () => reject(request.error)
  })
  db.close()
  return row ? row.data : undefined
}

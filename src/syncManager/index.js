import { Directory, Filesystem } from '@capacitor/filesystem'
import { deleteOutbox, getRead, listOutbox, putOutbox, putRead } from './lib/store.js'

function apiBase() {
  if (import.meta.env.DEV) return ''
  return import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8081'
}

export async function rememberRead(path, data) {
  try {
    await putRead(path, data)
  } catch {
    /* el disco puede estar lleno; la lectura en red sigue valiendo */
  }
}

export async function cachedRead(path) {
  try {
    return await getRead(path)
  } catch {
    return undefined
  }
}

function bytesToBase64(bytes) {
  let binary = ''
  const chunk = 0x8000
  for (let index = 0; index < bytes.length; index += chunk) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunk))
  }
  return btoa(binary)
}

function base64ToBlob(value, type) {
  const binary = atob(value)
  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index)
  return new Blob([bytes], { type: type || 'application/octet-stream' })
}

async function persistBlob(id, index, blob) {
  const name = blob.name || 'archivo'
  const type = blob.type || 'application/octet-stream'
  const path = `sync/${id}-${index}`
  try {
    const bytes = new Uint8Array(await blob.arrayBuffer())
    await Filesystem.writeFile({
      path,
      data: bytesToBase64(bytes),
      directory: Directory.Cache,
      recursive: true,
    })
    return { path, name, type }
  } catch {
    return { blob, name, type }
  }
}

async function readStoredBlob(part) {
  if (part.blob) return part.blob
  if (!part.path) return null
  const file = await Filesystem.readFile({ path: part.path, directory: Directory.Cache })
  const data = typeof file.data === 'string' ? file.data : ''
  return base64ToBlob(data, part.type)
}

async function removeFiles(stored) {
  if (!stored || stored.kind !== 'form') return
  for (const part of stored.parts || []) {
    if (!part.path) continue
    await Filesystem.deleteFile({ path: part.path, directory: Directory.Cache }).catch(() => {})
  }
}

async function serializeBody(id, body) {
  if (body == null || body === '') return null
  if (typeof body === 'string') return { kind: 'text', value: body }
  if (body instanceof FormData) {
    const parts = []
    let index = 0
    for (const [key, value] of body.entries()) {
      if (value instanceof Blob) {
        parts.push({ key, ...(await persistBlob(id, index, value)) })
        index += 1
      } else {
        parts.push({ key, text: String(value) })
      }
    }
    return { kind: 'form', parts }
  }
  return { kind: 'text', value: String(body) }
}

async function restoreBody(stored) {
  if (!stored) return undefined
  if (stored.kind === 'text') return stored.value
  const form = new FormData()
  for (const part of stored.parts || []) {
    if (part.blob || part.path) {
      const blob = await readStoredBlob(part)
      if (blob) form.append(part.key, blob, part.name || 'archivo')
    } else {
      form.append(part.key, part.text ?? '')
    }
  }
  return form
}

export async function enqueueSend({ id, path, method, headers, body }) {
  await putOutbox({
    id,
    path,
    method,
    headers: headers || {},
    body: await serializeBody(id, body),
    createdAt: Date.now(),
  })
}

export async function dropSend(id) {
  try {
    const rows = await listOutbox()
    const row = rows.find((item) => item.id === id)
    await removeFiles(row?.body)
    await deleteOutbox(id)
  } catch {
    /* si ya no está, la memoria quedó libre */
  }
}

let draining = false
let heldId = null

export function holdSend(id) {
  heldId = id
}

export function releaseHold() {
  heldId = null
}

export async function drainOutbox() {
  if (draining || (typeof navigator !== 'undefined' && navigator.onLine === false)) return
  draining = true
  try {
    const rows = await listOutbox()
    const next = rows.find((row) => row.id !== heldId)
    if (!next) return
    const headers = { ...(next.headers || {}) }
    const body = await restoreBody(next.body)
    if (body instanceof FormData) delete headers['Content-Type']
    let response
    try {
      response = await fetch(`${apiBase()}${next.path}`, { method: next.method, headers, body })
    } catch {
      return
    }
    await removeFiles(next.body)
    await deleteOutbox(next.id)
    if (response.ok) {
      const data = response.status === 204 ? null : await response.json().catch(() => null)
      if (data && next.method === 'GET') await putRead(next.path, data)
    }
  } finally {
    draining = false
  }
}

export function startSyncManager() {
  const tick = () => { void drainOutbox() }
  window.addEventListener('online', tick)
  window.setInterval(tick, 4000)
  tick()
}

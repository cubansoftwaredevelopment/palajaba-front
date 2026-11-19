import { Capacitor } from '@capacitor/core'
import { Directory, Filesystem } from '@capacitor/filesystem'

export const BACKGROUND_UPLOAD_EVENT = 'pala-jaba-background-upload'

const STORAGE_KEY = 'pala-jaba-background-uploads'
const RESULT_KEY = 'pala-jaba-background-upload-results'
let listening = false

function apiOrigin() {
  return String(import.meta.env.VITE_API_URL || '').replace(/\/$/, '')
}

export function canBackgroundUpload() {
  return Capacitor.isNativePlatform() && Boolean(apiOrigin())
}

function readPending() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function writePending(pending) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(pending))
}

function rememberResult(detail) {
  let list = []
  try {
    list = JSON.parse(localStorage.getItem(RESULT_KEY) || '[]')
  } catch {
    list = []
  }
  if (!Array.isArray(list)) list = []
  list.push(detail)
  localStorage.setItem(RESULT_KEY, JSON.stringify(list.slice(-10)))
}

export function forgetUploadResult(id) {
  let list = []
  try {
    list = JSON.parse(localStorage.getItem(RESULT_KEY) || '[]')
  } catch {
    list = []
  }
  if (!Array.isArray(list)) return
  localStorage.setItem(RESULT_KEY, JSON.stringify(list.filter((item) => item.id !== id)))
}

export function consumeUploadResults(kind) {
  let list = []
  try {
    list = JSON.parse(localStorage.getItem(RESULT_KEY) || '[]')
  } catch {
    list = []
  }
  if (!Array.isArray(list)) list = []
  const mine = list.filter((item) => item.kind === kind)
  const rest = list.filter((item) => item.kind !== kind)
  localStorage.setItem(RESULT_KEY, JSON.stringify(rest))
  return mine
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = String(reader.result || '')
      const comma = result.indexOf(',')
      resolve(comma >= 0 ? result.slice(comma + 1) : result)
    }
    reader.onerror = () => reject(reader.error || new Error('No pudimos leer la imagen.'))
    reader.readAsDataURL(file)
  })
}

async function persistFile(file) {
  const extension = file.name?.includes('.') ? file.name.slice(file.name.lastIndexOf('.')) : '.jpg'
  const path = `uploads/${Date.now()}-${Math.random().toString(36).slice(2, 8)}${extension}`
  const data = await fileToBase64(file)
  const written = await Filesystem.writeFile({
    path,
    data,
    directory: Directory.Cache,
    recursive: true,
  })
  return { uri: written.uri, path }
}

async function deleteCached(paths) {
  await Promise.all(
    (paths || []).map((path) =>
      Filesystem.deleteFile({ path, directory: Directory.Cache }).catch(() => undefined),
    ),
  )
}

function finishUpload(id, detail) {
  const pending = readPending()
  const job = pending[id]
  if (!job) return
  delete pending[id]
  writePending(pending)
  deleteCached(job.paths)
  rememberResult({ id, kind: job.kind, ...detail })
  window.dispatchEvent(
    new CustomEvent(BACKGROUND_UPLOAD_EVENT, {
      detail: { id, kind: job.kind, ...detail },
    }),
  )
}

export function ensureBackgroundUploads() {
  if (listening || !canBackgroundUpload()) return
  listening = true
  import('@capgo/capacitor-uploader')
    .then(({ Uploader }) =>
      Uploader.addListener('events', (event) => {
        if (event?.name !== 'completed' && event?.name !== 'failed') return
        const statusCode = Number(event.payload?.statusCode || 0)
        const ok = event.name === 'completed' && (statusCode === 0 || (statusCode >= 200 && statusCode < 300))
        finishUpload(event.id, {
          ok,
          statusCode,
          error: event.payload?.error || '',
        })
        if (event.eventId) {
          Uploader.acknowledgeEvent({ eventId: event.eventId }).catch(() => undefined)
        }
      }),
    )
    .catch(() => {
      listening = false
    })
}

export async function startBackgroundFormUpload({
  token,
  path,
  files,
  fields = {},
  notificationTitle,
  kind,
}) {
  if (!canBackgroundUpload() || !files?.length) return false
  ensureBackgroundUploads()
  const { Uploader } = await import('@capgo/capacitor-uploader')
  const stored = []
  for (const entry of files) {
    const saved = await persistFile(entry.file)
    stored.push({
      filePath: saved.uri,
      path: saved.path,
      fieldName: entry.fieldName,
      mimeType: entry.file.type || 'image/jpeg',
    })
  }
  const parameters = {}
  for (const [key, value] of Object.entries(fields)) {
    if (value != null) parameters[key] = String(value)
  }
  const { id } = await Uploader.startUpload({
    serverUrl: `${apiOrigin()}${path}`,
    method: 'POST',
    uploadType: 'multipart',
    files: stored.map(({ filePath, fieldName, mimeType }) => ({ filePath, fieldName, mimeType })),
    fileField: stored[0].fieldName,
    parameters,
    headers: { Authorization: `Bearer ${token}` },
    notificationTitle,
    maxRetries: 2,
  })
  const pending = readPending()
  pending[id] = { kind, paths: stored.map((file) => file.path) }
  writePending(pending)
  return true
}

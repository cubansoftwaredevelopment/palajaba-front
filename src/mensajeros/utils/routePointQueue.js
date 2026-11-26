const STORAGE_KEY = 'pala_jaba_route_points'
const MIN_PIN_METERS = 15
const MAX_PENDING = 400
const MAX_SENT = 250

function emptyBatch() {
  return { last: null, pending: [], trail: [], sent: [], logCursor: 0 }
}

function readStore() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function writeStore(store) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
}

function batchState(store, batchId) {
  const current = store[batchId]
  if (!current || typeof current !== 'object') return emptyBatch()
  return {
    last: current.last?.lat != null ? { lat: Number(current.last.lat), lng: Number(current.last.lng) } : null,
    pending: Array.isArray(current.pending) ? current.pending : [],
    trail: Array.isArray(current.trail) ? current.trail : [],
    sent: Array.isArray(current.sent) ? current.sent : [],
    logCursor: Number(current.logCursor) || 0,
  }
}

export function metersBetween(origin, destination) {
  const lat1 = origin.lat * Math.PI / 180
  const lat2 = destination.lat * Math.PI / 180
  const dlat = lat2 - lat1
  const dlon = (destination.lng - origin.lng) * Math.PI / 180
  const h = Math.sin(dlat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dlon / 2) ** 2
  return 2 * 6371000 * Math.asin(Math.min(1, Math.sqrt(h)))
}

export function pointClientId(lat, lng, timeMs) {
  const stamp = Math.round(Number(timeMs) || Date.now())
  return `loc-${stamp}-${Number(lat).toFixed(5)}-${Number(lng).toFixed(5)}`
}

export function readPending(batchId) {
  if (!batchId) return []
  return batchState(readStore(), batchId).pending
}

export function readTrail(batchId) {
  if (!batchId) return []
  return batchState(readStore(), batchId).trail
}

export function seedLast(batchId, point) {
  if (!batchId || point?.lat == null || point?.lng == null) return
  const store = readStore()
  const state = batchState(store, batchId)
  if (state.last) return
  state.last = { lat: Number(point.lat), lng: Number(point.lng) }
  store[batchId] = state
  writeStore(store)
}

export function acceptPoint(batchId, point) {
  if (!batchId || point?.lat == null || point?.lng == null) return { accepted: false, pending: [] }
  const store = readStore()
  const state = batchState(store, batchId)
  const location = { lat: Number(point.lat), lng: Number(point.lng) }
  if (state.last && metersBetween(state.last, location) < MIN_PIN_METERS) {
    return { accepted: false, pending: state.pending }
  }
  const clientId = point.client_id || pointClientId(location.lat, location.lng, point.time)
  if (state.sent.includes(clientId) || state.pending.some((item) => item.client_id === clientId)) {
    return { accepted: false, pending: state.pending }
  }
  const next = {
    client_id: clientId,
    lat: location.lat,
    lng: location.lng,
    accuracy: point.accuracy ?? null,
    recorded_at: point.recorded_at || new Date(point.time || Date.now()).toISOString(),
  }
  state.last = location
  state.pending = [...state.pending, next].slice(-MAX_PENDING)
  state.trail = [...state.trail, next].slice(-MAX_PENDING)
  store[batchId] = state
  writeStore(store)
  return { accepted: true, pending: state.pending }
}

export function dropTrail(batchId, clientId) {
  if (!batchId || !clientId) return
  const store = readStore()
  const state = batchState(store, batchId)
  state.trail = state.trail.filter((item) => item.client_id !== clientId)
  store[batchId] = state
  writeStore(store)
}

export function markSent(batchId, clientId) {
  if (!batchId || !clientId) return []
  const store = readStore()
  const state = batchState(store, batchId)
  state.pending = state.pending.filter((item) => item.client_id !== clientId)
  state.sent = [...state.sent.filter((item) => item !== clientId), clientId].slice(-MAX_SENT)
  store[batchId] = state
  writeStore(store)
  return state.pending
}

export function readLogCursor(batchId) {
  if (!batchId) return 0
  return batchState(readStore(), batchId).logCursor
}

export function setLogCursor(batchId, cursor) {
  if (!batchId) return
  const store = readStore()
  const state = batchState(store, batchId)
  state.logCursor = Number(cursor) || 0
  store[batchId] = state
  writeStore(store)
}

export function clearBatch(batchId) {
  if (!batchId) return
  const store = readStore()
  delete store[batchId]
  writeStore(store)
}

const roles = ['seller', 'gestor', 'mensajero', 'customer']

const buckets = Object.fromEntries(roles.map((role) => [role, new Map()]))
const refreshing = Object.fromEntries(roles.map((role) => [role, new Map()]))
const listeners = new Map()
const refreshListeners = new Map()

function listenerKey(role, key) {
  return `${role}:${key}`
}

export function readSection(role, key) {
  return buckets[role]?.get(key) ?? null
}

export function commitSection(role, key, data, query = null) {
  const snapshot = { data, query }
  buckets[role]?.set(key, snapshot)
  listeners.get(listenerKey(role, key))?.forEach((listener) => listener(snapshot))
  return snapshot
}

export function subscribeSection(role, key, listener) {
  const id = listenerKey(role, key)
  if (!listeners.has(id)) listeners.set(id, new Set())
  listeners.get(id).add(listener)
  return () => listeners.get(id)?.delete(listener)
}

export function isSectionRefreshing(role, key) {
  return (refreshing[role]?.get(key) || 0) > 0
}

function notifyRefresh(role, key) {
  const active = isSectionRefreshing(role, key)
  refreshListeners.get(listenerKey(role, key))?.forEach((listener) => listener(active))
}

export function beginSectionRefresh(role, key) {
  const bucket = refreshing[role]
  if (!bucket || !key) return
  bucket.set(key, (bucket.get(key) || 0) + 1)
  notifyRefresh(role, key)
}

export function endSectionRefresh(role, key) {
  const bucket = refreshing[role]
  if (!bucket || !key) return
  const next = (bucket.get(key) || 1) - 1
  if (next <= 0) bucket.delete(key)
  else bucket.set(key, next)
  notifyRefresh(role, key)
}

export function subscribeSectionRefresh(role, key, listener) {
  const id = listenerKey(role, key)
  if (!refreshListeners.has(id)) refreshListeners.set(id, new Set())
  refreshListeners.get(id).add(listener)
  return () => refreshListeners.get(id)?.delete(listener)
}

export function runSectionRefresh(role, key, task) {
  beginSectionRefresh(role, key)
  return Promise.resolve()
    .then(task)
    .finally(() => endSectionRefresh(role, key))
}

export function clearRoleSections(role) {
  const bucket = buckets[role]
  const pending = refreshing[role]
  if (pending) {
    const pendingKeys = [...pending.keys()]
    pending.clear()
    for (const key of pendingKeys) notifyRefresh(role, key)
  }
  if (!bucket) return
  const keys = [...bucket.keys()]
  bucket.clear()
  for (const key of keys) {
    listeners.get(listenerKey(role, key))?.forEach((listener) => listener(null))
  }
}

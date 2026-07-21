const TOKEN_KEY = 'pala_jaba_gestor_token'
const GESTOR_KEY = 'pala_jaba_gestor_profile'
const CONTEXT_KEY = 'pala_jaba_gestor_context'
const SETUP_KEY = 'pala_jaba_gestor_setup'

function readStoredValue(key) {
  const fromLocal = localStorage.getItem(key)
  if (fromLocal != null) return fromLocal

  const fromSession = sessionStorage.getItem(key)
  if (fromSession == null) return null

  try {
    localStorage.setItem(key, fromSession)
    sessionStorage.removeItem(key)
  } catch {
    return fromSession
  }

  return fromSession
}

function writeStoredValue(key, value) {
  localStorage.setItem(key, value)
  sessionStorage.removeItem(key)
}

function removeStoredValue(key) {
  localStorage.removeItem(key)
  sessionStorage.removeItem(key)
}

export function getGestorToken() {
  return readStoredValue(TOKEN_KEY)
}

export function getGestorProfile() {
  const raw = readStoredValue(GESTOR_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

/** Contexto de tienda (slug / nombre) para rutas y UI. */
export function getGestorContext() {
  const raw = readStoredValue(CONTEXT_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function setGestorSession(token, gestor, context = null) {
  writeStoredValue(TOKEN_KEY, token)
  writeStoredValue(GESTOR_KEY, JSON.stringify(gestor))
  if (context) {
    writeStoredValue(CONTEXT_KEY, JSON.stringify(context))
  }
  clearGestorSetup()
}

export function updateGestorProfileCache(gestor) {
  writeStoredValue(GESTOR_KEY, JSON.stringify(gestor))
}

export function clearGestorSession() {
  removeStoredValue(TOKEN_KEY)
  removeStoredValue(GESTOR_KEY)
  removeStoredValue(CONTEXT_KEY)
}

export function isGestorAuthenticated() {
  return Boolean(getGestorToken())
}

export function setGestorSetup(payload) {
  sessionStorage.setItem(SETUP_KEY, JSON.stringify(payload))
}

export function getGestorSetup() {
  const raw = sessionStorage.getItem(SETUP_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function clearGestorSetup() {
  sessionStorage.removeItem(SETUP_KEY)
}

export function gestorPanelPath(storeSlug) {
  const slug = String(storeSlug ?? '').trim()
  if (!slug) return '/g'
  return `/g/${encodeURIComponent(slug)}/gestor/panel`
}

export function gestorLoginPath(storeSlug) {
  const slug = String(storeSlug ?? '').trim()
  if (!slug) return '/g'
  return `/g/${encodeURIComponent(slug)}/gestor`
}

export function gestorSetupPath(storeSlug) {
  const slug = String(storeSlug ?? '').trim()
  if (!slug) return '/g'
  return `/g/${encodeURIComponent(slug)}/gestor/setup`
}

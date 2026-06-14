const TOKEN_KEY = 'pala_jaba_seller_token'
const SELLER_KEY = 'pala_jaba_seller_profile'

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

export function getSellerToken() {
  return readStoredValue(TOKEN_KEY)
}

export function setSellerSession(token, seller) {
  writeStoredValue(TOKEN_KEY, token)
  writeStoredValue(SELLER_KEY, JSON.stringify(seller))
}

export function updateSellerProfileCache(seller) {
  writeStoredValue(SELLER_KEY, JSON.stringify(seller))
}

export function isSellerProfileComplete(seller) {
  return Boolean(seller?.profile_completed)
}

export function getSellerProfile() {
  const raw = readStoredValue(SELLER_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function clearSellerSession() {
  removeStoredValue(TOKEN_KEY)
  removeStoredValue(SELLER_KEY)
}

export function isSellerAuthenticated() {
  return Boolean(getSellerToken())
}

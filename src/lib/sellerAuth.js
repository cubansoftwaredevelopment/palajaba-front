const TOKEN_KEY = 'pala_jaba_seller_token'
const SELLER_KEY = 'pala_jaba_seller_profile'

export function getSellerToken() {
  return sessionStorage.getItem(TOKEN_KEY)
}

export function setSellerSession(token, seller) {
  sessionStorage.setItem(TOKEN_KEY, token)
  sessionStorage.setItem(SELLER_KEY, JSON.stringify(seller))
}

export function updateSellerProfileCache(seller) {
  sessionStorage.setItem(SELLER_KEY, JSON.stringify(seller))
}

export function isSellerProfileComplete(seller) {
  return Boolean(seller?.profile_completed)
}

export function getSellerProfile() {
  const raw = sessionStorage.getItem(SELLER_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function clearSellerSession() {
  sessionStorage.removeItem(TOKEN_KEY)
  sessionStorage.removeItem(SELLER_KEY)
}

export function isSellerAuthenticated() {
  return Boolean(getSellerToken())
}

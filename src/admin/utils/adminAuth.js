const TOKEN_KEY = 'pala_jaba_admin_token'

export function getAdminToken() {
  return sessionStorage.getItem(TOKEN_KEY)
}

export function setAdminToken(token) {
  sessionStorage.setItem(TOKEN_KEY, token)
}

export function clearAdminToken() {
  sessionStorage.removeItem(TOKEN_KEY)
}

export function isAdminAuthenticated() {
  return Boolean(getAdminToken())
}

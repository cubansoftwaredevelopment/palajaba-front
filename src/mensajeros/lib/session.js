import { clearRoleSections } from '../../session/sectionStore'

const TOKEN_KEY = 'pala_jaba_mensajero_token'
const PROFILE_KEY = 'pala_jaba_mensajero_profile'
const SETUP_KEY = 'pala_jaba_mensajero_setup'

export function getMensajeroToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function getMensajeroProfile() {
  try {
    return JSON.parse(localStorage.getItem(PROFILE_KEY) || 'null')
  } catch {
    return null
  }
}

export function setMensajeroSession(token, mensajero) {
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(PROFILE_KEY, JSON.stringify(mensajero))
  sessionStorage.removeItem(SETUP_KEY)
}

export function updateMensajeroProfile(mensajero) {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(mensajero))
}

export function clearMensajeroSession() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(PROFILE_KEY)
  clearRoleSections('mensajero')
}

export function isMensajeroAuthenticated() {
  return Boolean(getMensajeroToken())
}

export function setMensajeroSetup(payload) {
  sessionStorage.setItem(SETUP_KEY, JSON.stringify(payload))
}

export function getMensajeroSetup() {
  try {
    return JSON.parse(sessionStorage.getItem(SETUP_KEY) || 'null')
  } catch {
    return null
  }
}

export function mensajeroLoginPath(alias) {
  return `/mensajero/${encodeURIComponent(alias)}`
}

export function mensajeroSetupPath(alias) {
  return `/mensajero/${encodeURIComponent(alias)}/setup`
}

export function mensajeroPanelPath(alias) {
  return `/mensajero/${encodeURIComponent(alias)}/panel`
}

const STORAGE_KEY = 'pala_jaba_admin_theme'

export function readAdminTheme() {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'light' ? 'light' : 'dark'
  } catch {
    return 'dark'
  }
}

export function writeAdminTheme(theme) {
  try {
    localStorage.setItem(STORAGE_KEY, theme)
  } catch {
    /* el tema sigue en esta visita */
  }
}

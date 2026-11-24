export const DOWNLOAD_PROMPT_DISMISS_KEY = 'pala-jaba-app-download-dismissed'
export const UPDATE_PROMPT_DISMISS_KEY = 'pala-jaba-app-update-dismissed'
export const PROMPT_PENDING_KEY = 'pala-jaba-app-prompt-pending'

export function shouldShowDownloadPrompt(inNativeApp) {
  return !inNativeApp
}

export function normalizeAppVersion(value) {
  return String(value || '')
    .trim()
    .replace(/^v/i, '')
    .replace(/\s+/g, '')
    .toLowerCase()
}

export function shouldShowUpdatePrompt(nativeVersion, mainVersion) {
  const current = normalizeAppVersion(nativeVersion)
  const main = normalizeAppVersion(mainVersion)
  if (!current || !main) return false
  return current !== main
}

export function wasDownloadPromptDismissed() {
  try {
    return window.sessionStorage.getItem(DOWNLOAD_PROMPT_DISMISS_KEY) === '1'
  } catch {
    return false
  }
}

export function rememberDownloadPromptDismissed() {
  try {
    window.sessionStorage.setItem(DOWNLOAD_PROMPT_DISMISS_KEY, '1')
  } catch {
    /* ignore */
  }
}

export function wasUpdatePromptDismissed(version) {
  try {
    return window.sessionStorage.getItem(UPDATE_PROMPT_DISMISS_KEY) === String(version || '')
  } catch {
    return false
  }
}

export function rememberUpdatePromptDismissed(version) {
  try {
    window.sessionStorage.setItem(UPDATE_PROMPT_DISMISS_KEY, String(version || ''))
  } catch {
    /* ignore */
  }
}

export function clearUpdatePromptDismissed() {
  try {
    window.sessionStorage.removeItem(UPDATE_PROMPT_DISMISS_KEY)
  } catch {
    /* ignore */
  }
}

export const APP_RELEASE_PROMPT_EVENT = 'pala-jaba-app-prompt'

/** Tras login: limpia dismiss de sesión y marca que hay que evaluar el aviso. */
export function requestAppReleasePromptOnLogin() {
  try {
    window.sessionStorage.removeItem(DOWNLOAD_PROMPT_DISMISS_KEY)
    window.sessionStorage.removeItem(UPDATE_PROMPT_DISMISS_KEY)
    window.sessionStorage.setItem(PROMPT_PENDING_KEY, '1')
  } catch {
    /* ignore */
  }
  try {
    window.dispatchEvent(new Event(APP_RELEASE_PROMPT_EVENT))
  } catch {
    /* ignore */
  }
}

export function peekAppReleasePromptPending() {
  try {
    return window.sessionStorage.getItem(PROMPT_PENDING_KEY) === '1'
  } catch {
    return false
  }
}

export function consumeAppReleasePromptPending() {
  try {
    const pending = window.sessionStorage.getItem(PROMPT_PENDING_KEY) === '1'
    if (pending) window.sessionStorage.removeItem(PROMPT_PENDING_KEY)
    return pending
  } catch {
    return false
  }
}

/**
 * @returns {'download' | 'update' | 'none'}
 */
export function resolveAppReleasePromptAction({
  inNativeApp,
  nativeVersion,
  nativePlatform,
  status,
  guestHasBuild,
}) {
  if (inNativeApp) {
    if (nativePlatform !== 'android' && nativePlatform !== 'ios') return 'none'
    const mainVersion =
      nativePlatform === 'ios'
        ? status?.ios?.main?.version
        : status?.android?.main?.version
    if (shouldShowUpdatePrompt(nativeVersion, mainVersion)) return 'update'
    return 'none'
  }

  if (status) {
    const platforms = [status.android, status.ios].filter((item) => item?.main)
    if (!platforms.length) return 'none'
    const hasAnyDownload = platforms.some((item) => item.downloaded_version)
    const hasOutdated = platforms.some(
      (item) =>
        item.downloaded_version && item.downloaded_version !== item.main.version,
    )
    if (!hasAnyDownload || hasOutdated) return 'download'
    return 'none'
  }

  return guestHasBuild ? 'download' : 'none'
}

export function isNativeAppShell() {
  return typeof window.PalaJabaApp?.postMessage === 'function'
}

export function openExternalUrl(url) {
  if (!url) return

  if (isNativeAppShell()) {
    window.PalaJabaApp.postMessage(JSON.stringify({ action: 'openExternal', url }))
    return
  }

  window.open(url, '_blank', 'noopener,noreferrer')
}

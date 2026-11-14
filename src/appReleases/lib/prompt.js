export function shouldShowDownloadPrompt(inNativeApp) {
  return !inNativeApp
}

export function shouldShowUpdatePrompt(nativeVersion, mainVersion) {
  const current = String(nativeVersion || '').trim()
  const main = String(mainVersion || '').trim()
  if (!current || !main) return false
  return current !== main
}

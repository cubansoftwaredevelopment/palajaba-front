export function isNativeAppShell() {
  return typeof window.PalaJabaApp?.postMessage === 'function'
}

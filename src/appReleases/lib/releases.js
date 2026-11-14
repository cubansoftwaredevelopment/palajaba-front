import { App } from '@capacitor/app'
import { Capacitor } from '@capacitor/core'
import {
  fetchMainAppReleases,
  recordAppReleaseDownload,
  resolveAppReleaseFileUrl,
} from '../api.js'
import {
  shouldShowDownloadPrompt as shouldShowDownloadPromptFor,
  shouldShowUpdatePrompt,
} from './prompt.js'
import { getCustomerToken } from '../../lib/customerAuth'
import { isNativeAppShell } from '../../lib/nativeApp'
import { getSellerToken } from '../../lib/sellerAuth'
import { APP_DOWNLOAD_URL } from '../constants.js'

export { shouldShowUpdatePrompt }

export function isInNativeApp() {
  try {
    if (Capacitor.isNativePlatform()) return true
  } catch {
    /* Capacitor no disponible */
  }
  return isNativeAppShell()
}

export function shouldShowDownloadPrompt(inNativeApp = isInNativeApp()) {
  return shouldShowDownloadPromptFor(inNativeApp)
}

export async function getNativeAppVersion() {
  if (!isInNativeApp()) return null
  try {
    if (Capacitor.isNativePlatform()) {
      const info = await App.getInfo()
      return String(info?.version || '').trim() || null
    }
  } catch {
    /* sin plugin App */
  }
  const shellVersion = window.PalaJabaApp?.appVersion
  return shellVersion ? String(shellVersion).trim() : null
}

export function getNativePlatformKey() {
  try {
    if (Capacitor.isNativePlatform()) {
      const platform = Capacitor.getPlatform()
      if (platform === 'ios') return 'ios'
      if (platform === 'android') return 'android'
    }
  } catch {
    /* ignore */
  }
  return null
}

export function sessionTokenForAppDownload() {
  return getCustomerToken() || getSellerToken() || null
}

export function releaseFileHref(release) {
  if (!release?.id) return null
  return resolveAppReleaseFileUrl(release.id) || release.download_url || null
}

export async function loadMainAppReleases() {
  try {
    return await fetchMainAppReleases()
  } catch {
    return { android: null, ios: null }
  }
}

export function androidDownloadFallbackHref(mains) {
  return releaseFileHref(mains?.android) || APP_DOWNLOAD_URL
}

export async function startAppReleaseDownload(release) {
  if (!release?.id) return
  const token = sessionTokenForAppDownload()
  if (token) {
    try {
      await recordAppReleaseDownload(token, release.id)
    } catch {
      /* la descarga sigue aunque falle el registro */
    }
  }
  const href = releaseFileHref(release)
  if (!href) return
  const anchor = document.createElement('a')
  anchor.href = href
  anchor.download = release.original_filename || ''
  anchor.rel = 'noopener'
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
}

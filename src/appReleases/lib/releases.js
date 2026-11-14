import { App } from '@capacitor/app'
import { Capacitor } from '@capacitor/core'
import {
  fetchAppReleasePromptStatus,
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
  try {
    const shellPlatform = String(window.PalaJabaApp?.platform || '').trim().toLowerCase()
    if (shellPlatform === 'ios' || shellPlatform === 'iphone' || shellPlatform === 'ipad') return 'ios'
    if (shellPlatform === 'android') return 'android'
  } catch {
    /* ignore */
  }
  if (typeof navigator !== 'undefined') {
    const ua = navigator.userAgent || ''
    if (/iPhone|iPad|iPod/i.test(ua)) return 'ios'
    if (/Android/i.test(ua)) return 'android'
  }
  return null
}

export function platformLabel(platform) {
  if (platform === 'ios') return 'Apple'
  if (platform === 'android') return 'Android'
  return 'app'
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

export async function loadAppReleasePromptStatus() {
  const token = sessionTokenForAppDownload()
  if (!token) return null
  try {
    return await fetchAppReleasePromptStatus(token)
  } catch {
    return null
  }
}

export function mainsFromPromptStatus(status) {
  if (!status) return { android: null, ios: null }
  return {
    android: status.android?.main || null,
    ios: status.ios?.main || null,
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

import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { App } from '@capacitor/app'
import { Capacitor } from '@capacitor/core'

/** Hostname canónico de VITE_SITE_URL (SITE_URL del front). */
export function getSiteUrlHostname() {
  const raw = String(import.meta.env.VITE_SITE_URL || '').trim()
  if (!raw) return null
  try {
    return new URL(raw).hostname.toLowerCase()
  } catch {
    return null
  }
}

/**
 * Convierte una URL absoluta del SITE_URL en path interno del router.
 * @returns {string | null}
 */
export function deepLinkPathFromUrl(urlString, siteHostname = getSiteUrlHostname()) {
  if (!urlString || !siteHostname) return null
  try {
    const url = new URL(String(urlString))
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return null
    if (url.hostname.toLowerCase() !== siteHostname) return null
    return `${url.pathname}${url.search}${url.hash}` || '/'
  } catch {
    return null
  }
}

/**
 * Escucha App Links / Universal Links y navega a cualquier ruta del SITE_URL.
 */
export function NativeDeepLinkBridge() {
  const navigate = useNavigate()

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return undefined

    const siteHostname = getSiteUrlHostname()
    if (!siteHostname) return undefined

    function openDeepLink(urlString) {
      const path = deepLinkPathFromUrl(urlString, siteHostname)
      if (!path) return
      navigate(path, { replace: true })
    }

    let cancelled = false
    let removeListener = () => {}

    App.getLaunchUrl()
      .then((result) => {
        if (cancelled || !result?.url) return
        openDeepLink(result.url)
      })
      .catch(() => {
        /* sin launch URL */
      })

    App.addListener('appUrlOpen', (event) => {
      if (event?.url) openDeepLink(event.url)
    })
      .then((handle) => {
        removeListener = () => {
          try {
            handle.remove()
          } catch {
            /* ignore */
          }
        }
      })
      .catch(() => {
        /* plugin no disponible */
      })

    return () => {
      cancelled = true
      removeListener()
    }
  }, [navigate])

  return null
}

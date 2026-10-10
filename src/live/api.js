import { Capacitor } from '@capacitor/core'
import { getSellerToken } from '../lib/sellerAuth'

function isNativeApp() {
  return Capacitor.isNativePlatform()
}

function apiBase() {
  if (isNativeApp() || !import.meta.env.DEV) {
    return (import.meta.env.VITE_API_URL ?? 'https://palajaba-api.onrender.com').replace(/\/$/, '')
  }
  return ''
}

async function liveRequest(path, { method = 'GET', body } = {}) {
  const token = getSellerToken()
  const response = await fetch(`${apiBase()}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!response.ok && response.status !== 204) {
    throw new Error('No se pudo registrar el dispositivo.')
  }
  if (response.status === 204) return null
  return response.json()
}

export function registerSellerDevice(device) {
  return liveRequest('/api/live/devices', { method: 'POST', body: device })
}

export function unregisterSellerDevice(token) {
  return liveRequest('/api/live/devices', { method: 'DELETE', body: { token } })
}

export function sellerEventsUrl(accessToken) {
  const params = new URLSearchParams({ token: accessToken })
  const path = `/api/live/events?${params}`
  if (isNativeApp() || !import.meta.env.DEV) {
    const base = (import.meta.env.VITE_API_URL ?? 'https://palajaba-api.onrender.com').replace(/\/$/, '')
    const wsBase = base.replace(/^http/i, 'ws')
    return `${wsBase}${path}`
  }
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  return `${protocol}//${window.location.host}${path}`
}

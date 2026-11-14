import { ApiError, parseApiErrorDetail, request } from '../lib/api.js'

function getApiBase() {
  if (import.meta.env.DEV) return ''
  return import.meta.env.VITE_API_URL ?? 'https://palajaba-api.onrender.com'
}

export function fetchAdminAppReleases(token, platform = null) {
  const params = new URLSearchParams()
  if (platform) params.set('platform', platform)
  const query = params.toString() ? `?${params.toString()}` : ''
  return request(`/api/admin/app-releases${query}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
}

export async function createAdminAppRelease(token, file, { platform, version }) {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('platform', platform)
  formData.append('version', version)
  const response = await fetch(`${getApiBase()}/api/admin/app-releases`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  })
  if (!response.ok) {
    const data = await response.json().catch(() => ({}))
    const parsed = parseApiErrorDetail(data.detail)
    throw new ApiError(parsed.message, {
      code: parsed.code,
      data: parsed.data,
      status: response.status,
    })
  }
  return response.json()
}

export function setAdminAppReleaseMain(token, releaseId) {
  return request(`/api/admin/app-releases/${encodeURIComponent(releaseId)}/set-main`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
}

export function deleteAdminAppRelease(token, releaseId) {
  return request(`/api/admin/app-releases/${encodeURIComponent(releaseId)}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
}

export function fetchMainAppReleases() {
  return request('/api/marketplace/app-releases/main')
}

export function fetchAppReleasePromptStatus(token) {
  return request('/api/marketplace/app-releases/prompt-status', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
}

export function recordAppReleaseDownload(token, releaseId) {
  return request(`/api/marketplace/app-releases/${encodeURIComponent(releaseId)}/download`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
}

export function resolveAppReleaseFileUrl(releaseId) {
  if (!releaseId) return null
  const path = `/api/marketplace/app-releases/${encodeURIComponent(releaseId)}/file`
  return import.meta.env.DEV ? path : `${getApiBase()}${path}`
}

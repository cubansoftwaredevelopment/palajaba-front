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

export function createAdminAppRelease(token, file, { platform, version, onProgress } = {}) {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('platform', platform)
  formData.append('version', version)

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', `${getApiBase()}/api/admin/app-releases`)
    xhr.setRequestHeader('Authorization', `Bearer ${token}`)
    xhr.responseType = 'json'

    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable || typeof onProgress !== 'function') return
      const percent = Math.max(0, Math.min(100, Math.round((event.loaded / event.total) * 100)))
      onProgress(percent)
    }

    xhr.onload = () => {
      const data = xhr.response && typeof xhr.response === 'object' ? xhr.response : {}
      if (xhr.status >= 200 && xhr.status < 300) {
        if (typeof onProgress === 'function') onProgress(100)
        resolve(data)
        return
      }
      const parsed = parseApiErrorDetail(data.detail)
      reject(
        new ApiError(parsed.message || 'No pudimos subir el build.', {
          code: parsed.code,
          data: parsed.data,
          status: xhr.status,
        }),
      )
    }

    xhr.onerror = () => {
      reject(new ApiError('No pudimos subir el build.', { status: 0 }))
    }

    xhr.onabort = () => {
      reject(new ApiError('Subida cancelada.', { status: 0, code: 'upload_aborted' }))
    }

    xhr.send(formData)
  })
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

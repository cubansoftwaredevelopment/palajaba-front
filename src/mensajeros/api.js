import { request } from '../lib/api'
import { getCustomerToken } from '../lib/customerAuth'
import { getMensajeroToken } from './lib/session'
import { getSellerToken } from '../lib/sellerAuth'

function authHeaders(token) {
  return { Authorization: `Bearer ${token}` }
}

export function fetchSellerMensajeros(token, { search = '', vehicleType = '' } = {}) {
  const params = new URLSearchParams()
  if (search) params.set('search', search)
  if (vehicleType) params.set('vehicle_type', vehicleType)
  const query = params.toString()
  return request(`/api/auth/me/mensajeros${query ? `?${query}` : ''}`, { headers: authHeaders(token) })
}

export function createSellerMensajero(token, payload) {
  return request('/api/auth/me/mensajeros', {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  })
}

export function updateSellerMensajero(token, mensajeroId, payload) {
  return request(`/api/auth/me/mensajeros/${mensajeroId}`, {
    method: 'PUT',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  })
}

export function deleteSellerMensajero(token, mensajeroId) {
  return request(`/api/auth/me/mensajeros/${mensajeroId}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  })
}

export function assignMensajeroBatch(token, payload) {
  return request('/api/auth/me/mensajeros/batches', {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ ...payload, client_id: payload.client_id || crypto.randomUUID() }),
    clientId: payload.client_id,
  })
}

export function cancelMensajeroAssignment(token, orderId) {
  return request(`/api/auth/me/mensajeros/orders/${orderId}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  })
}

export function fetchSellerOrderTracking(token, orderId) {
  return request(`/api/auth/me/mensajeros/orders/${orderId}/tracking`, { headers: authHeaders(token) })
}

export function mensajeroLogin(payload) {
  return request('/api/mensajeros/login', { method: 'POST', body: JSON.stringify(payload) })
}

export function mensajeroSetup(payload) {
  return request('/api/mensajeros/setup', { method: 'POST', body: JSON.stringify(payload) })
}

export function fetchMensajeroSummary(params = {}) {
  const search = new URLSearchParams()
  if (params.start) search.set('start', params.start)
  if (params.end) search.set('end', params.end)
  const query = search.toString()
  return request(`/api/mensajeros/me/summary${query ? `?${query}` : ''}`, {
    headers: authHeaders(getMensajeroToken()),
  })
}

export function markMensajeroNoticeRead(batchId) {
  return request(`/api/mensajeros/batches/${batchId}/read`, {
    method: 'POST',
    headers: authHeaders(getMensajeroToken()),
  })
}

export function startMensajeroBatch(batchId, vehicleId) {
  const clientId = crypto.randomUUID()
  return request(`/api/mensajeros/batches/${batchId}/start`, {
    method: 'POST',
    headers: authHeaders(getMensajeroToken()),
    body: JSON.stringify({ vehicle_id: vehicleId, client_id: clientId }),
    clientId,
  })
}

export function pushMensajeroPoint(batchId, point) {
  return request(`/api/mensajeros/batches/${batchId}/points`, {
    method: 'POST',
    headers: authHeaders(getMensajeroToken()),
    body: JSON.stringify(point),
    clientId: point.client_id,
  })
}

export function submitMensajeroEvidence(orderId, { note, files }) {
  const body = new FormData()
  const clientId = crypto.randomUUID()
  body.append('note', note || '')
  body.append('client_id', clientId)
  for (const file of files || []) body.append('files', file)
  return request(`/api/mensajeros/orders/${orderId}/evidence`, {
    method: 'POST',
    headers: authHeaders(getMensajeroToken()),
    body,
    clientId,
  })
}

export function uploadMensajeroPhoto(file) {
  const body = new FormData()
  body.append('file', file)
  return request('/api/mensajeros/me/photo', {
    method: 'POST',
    headers: authHeaders(getMensajeroToken()),
    body,
  })
}

function vehicleBody({ vehicleType, plate, files, keepUrls }) {
  const body = new FormData()
  body.append('vehicle_type', vehicleType)
  body.append('plate', plate || '')
  for (const url of keepUrls || []) body.append('keep_urls', url)
  for (const file of files || []) body.append('files', file)
  return body
}

export function addMensajeroVehicle(payload) {
  return request('/api/mensajeros/me/vehicles', {
    method: 'POST',
    headers: authHeaders(getMensajeroToken()),
    body: vehicleBody(payload),
  })
}

export function updateMensajeroVehicle(vehicleId, payload) {
  return request(`/api/mensajeros/me/vehicles/${vehicleId}`, {
    method: 'PUT',
    headers: authHeaders(getMensajeroToken()),
    body: vehicleBody(payload),
  })
}

export function deleteMensajeroVehicle(vehicleId) {
  return request(`/api/mensajeros/me/vehicles/${vehicleId}`, {
    method: 'DELETE',
    headers: authHeaders(getMensajeroToken()),
  })
}

export function saveMensajeroQvapay(username, { skipVerification = false } = {}) {
  return request('/api/mensajeros/me/qvapay', {
    method: 'PUT',
    headers: authHeaders(getMensajeroToken()),
    body: JSON.stringify({ username, skip_verification: skipVerification }),
  })
}

export function deleteMensajeroQvapay() {
  return request('/api/mensajeros/me/qvapay', {
    method: 'DELETE',
    headers: authHeaders(getMensajeroToken()),
  })
}

export function registerMensajeroDevice(payload) {
  return request('/api/mensajeros/me/devices', {
    method: 'POST',
    headers: authHeaders(getMensajeroToken()),
    body: JSON.stringify(payload),
  })
}

export function fetchCustomerOrderTracking(orderId) {
  return request(`/api/mensajeros/orders/${orderId}/tracking`, {
    headers: authHeaders(getCustomerToken()),
  })
}

export function saveCustomerOrderLocation(orderId, point) {
  return request(`/api/mensajeros/orders/${orderId}/location`, {
    method: 'POST',
    headers: authHeaders(getCustomerToken()),
    body: JSON.stringify(point),
  })
}

export function sellerToken() {
  return getSellerToken()
}

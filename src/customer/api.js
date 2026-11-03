import { request } from '../lib/api.js'

function authHeaders(token) {
  return { Authorization: `Bearer ${token}` }
}

export function decideCustomerOrderEvidence(orderId, accept, token) {
  const action = accept ? 'accept' : 'reject'
  return request(`/api/customers/me/orders/${encodeURIComponent(orderId)}/qvapay/evidence/${action}`, {
    method: 'POST', headers: authHeaders(token),
  })
}

export function fetchCustomerPaymentNotifications(token) {
  return request('/api/customers/me/notifications', { headers: authHeaders(token) })
}

export function markCustomerPaymentNotificationRead(token, id) {
  return request(`/api/customers/me/notifications/${encodeURIComponent(id)}/read`, {
    method: 'PATCH', headers: authHeaders(token),
  })
}

export function fetchCustomerProfile(token) {
  return request('/api/customers/me', { headers: authHeaders(token) })
}

export function startCustomerEmailOtp(token, email) {
  return request('/api/customers/me/email/otp/start', { method: 'POST', headers: authHeaders(token), body: JSON.stringify({ email }) })
}

export function startCustomerPhoneOtp(token, phone) {
  return request('/api/customers/me/phone/otp/start', { method: 'POST', headers: authHeaders(token), body: JSON.stringify({ phone }) })
}

export function confirmCustomerContactOtp(token, challengeId, code) {
  return request('/api/customers/me/contact-otp/confirm', { method: 'POST', headers: authHeaders(token), body: JSON.stringify({ challenge_id: challengeId, code }) })
}

export function updateCustomerIdentityCard(token, identityCard) {
  return request('/api/customers/me/identity-card', { method: 'PATCH', headers: authHeaders(token), body: JSON.stringify({ identity_card: identityCard }) })
}

export function fetchCustomerOrders(token) {
  return request('/api/customers/me/orders', { headers: authHeaders(token) })
}

export function addCustomerAddress(token, address) {
  return request('/api/customers/me/addresses', { method: 'POST', headers: authHeaders(token), body: JSON.stringify(address) })
}

export function updateCustomerAddress(token, addressId, address) {
  return request(`/api/customers/me/addresses/${encodeURIComponent(addressId)}`, { method: 'PUT', headers: authHeaders(token), body: JSON.stringify(address) })
}

export function deleteCustomerAddress(token, addressId) {
  return request(`/api/customers/me/addresses/${encodeURIComponent(addressId)}`, { method: 'DELETE', headers: authHeaders(token) })
}

export function uploadCustomerPhoto(token, file) {
  const formData = new FormData()
  formData.append('photo', file)
  return request('/api/customers/me/profile-photo', { method: 'POST', headers: authHeaders(token), body: formData })
}

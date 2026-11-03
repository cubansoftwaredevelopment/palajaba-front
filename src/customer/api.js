import { request } from '../lib/api.js'
import { getCustomerProfile, getCustomerToken, updateCustomerProfile } from '../lib/customerAuth.js'

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

export function fetchCustomerQvaPayAccount(token) {
  return request('/api/customers/me/payment-methods/qvapay', { headers: authHeaders(token) })
}

export function saveCustomerQvaPayAccount(token, username, { skipVerification = false } = {}) {
  return request('/api/customers/me/payment-methods/qvapay', {
    method: 'PUT', headers: authHeaders(token), body: JSON.stringify({ username, skip_verification: skipVerification }),
  })
}

export function deleteCustomerQvaPayAccount(token) {
  return request('/api/customers/me/payment-methods/qvapay', { method: 'DELETE', headers: authHeaders(token) })
}

export function dismissCustomerQvaPayPrompt(token) {
  return request('/api/customers/me/payment-methods/qvapay/dismiss', { method: 'POST', headers: authHeaders(token) })
}

export async function customerHasQvaPayUsername() {
  if (getCustomerProfile()?.qvapay_username) return true
  const token = getCustomerToken()
  if (!token) return false
  try {
    const fresh = await fetchCustomerProfile(token)
    updateCustomerProfile(fresh)
    return Boolean(fresh?.qvapay_username)
  } catch {
    return false
  }
}

export function openCustomerOrderDispute(token, orderId) {
  return request(`/api/customers/me/orders/${encodeURIComponent(orderId)}/disputes`, {
    method: 'POST', headers: authHeaders(token),
  })
}

export function uploadCustomerPhoto(token, file) {
  const formData = new FormData()
  formData.append('photo', file)
  return request('/api/customers/me/profile-photo', { method: 'POST', headers: authHeaders(token), body: formData })
}

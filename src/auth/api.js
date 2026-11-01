import { ApiError, request } from '../lib/api'

function authHeaders(token) {
  return { Authorization: `Bearer ${token}` }
}

export function startPasswordReset(payload) {
  return request('/api/auth/password-reset/start', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function resendPasswordResetOtp(payload) {
  return request('/api/auth/password-reset/otp/resend', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function confirmPasswordResetOtp(payload) {
  return request('/api/auth/password-reset/otp/confirm', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function completePasswordReset(payload) {
  return request('/api/auth/password-reset/complete', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function sellerLogin(payload) {
  const data = await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  })

  if (data?.subscription_expired) {
    throw new ApiError(data.subscription_expired.message, {
      code: 'subscription_expired',
      data: data.subscription_expired,
    })
  }

  return data
}

function customerHeaders(token) { return { Authorization: `Bearer ${token}` } }

export function fetchStoreCustomers(token, options = {}) {
  const params = new URLSearchParams()
  for (const key of ['offset', 'limit', 'orders_limit', 'customer_id', 'orders_offset', 'search', 'location', 'currency', 'date_from', 'date_to']) {
    const value = options[key]
    if (value !== undefined && value !== null && value !== '') params.set(key, String(value))
  }
  for (const product of options.products ?? []) params.append('products', product)
  const query = params.toString()
  return request(`/api/customers/store/customers${query ? `?${query}` : ''}`, { headers: customerHeaders(token) })
}

export function adminLogin(username, password) {
  return request('/api/admin/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  })
}

export function startRegisterOtp(payload) {
  return request('/api/register/otp/start', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function resendRegisterOtp(payload) {
  return request('/api/register/otp/resend', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function confirmRegisterOtp(payload) {
  return request('/api/register/otp/confirm', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function fetchSellerProfile(token) {
  return request('/api/auth/me', {
    headers: authHeaders(token),
  })
}

export function fetchSellerBusinessCategories(token) {
  return request('/api/auth/me/business-categories', {
    headers: authHeaders(token),
  })
}

export function updateSellerProfile(token, payload) {
  return request('/api/auth/me/profile', {
    method: 'PATCH',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  })
}

export function fetchSellerQvaPayAccount(token) {
  return request('/api/auth/me/payment-methods/qvapay', { headers: authHeaders(token) })
}

export function saveSellerQvaPayAccount(token, username) {
  return request('/api/auth/me/payment-methods/qvapay', {
    method: 'PUT', headers: authHeaders(token), body: JSON.stringify({ username }),
  })
}

export function deleteSellerQvaPayAccount(token) {
  return request('/api/auth/me/payment-methods/qvapay', { method: 'DELETE', headers: authHeaders(token) })
}

export function acceptSellerQvaPayOrder(token, orderId, payload = {}) {
  return request(`/api/auth/me/orders/${encodeURIComponent(orderId)}/qvapay/accept`, {
    method: 'POST', headers: authHeaders(token), body: JSON.stringify(payload),
  })
}

export function rejectSellerQvaPayOrder(token, orderId) {
  return request(`/api/auth/me/orders/${encodeURIComponent(orderId)}/qvapay/reject`, {
    method: 'POST', headers: authHeaders(token),
  })
}

export function uploadSellerOrderEvidenceImage(token, orderId, file) {
  const body = new FormData()
  body.append('photo', file)
  return request(`/api/auth/me/orders/${encodeURIComponent(orderId)}/evidence/images`, {
    method: 'POST', headers: authHeaders(token), body,
  })
}

export function submitSellerOrderEvidence(token, orderId, content) {
  return request(`/api/auth/me/orders/${encodeURIComponent(orderId)}/evidence`, {
    method: 'POST', headers: authHeaders(token), body: JSON.stringify({ content }),
  })
}

export function startSellerPhoneOtp(token, phone) {
  return request('/api/auth/me/phone/otp/start', {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ phone }),
  })
}

export function startSellerEmailOtp(token, email) {
  return request('/api/auth/me/email/otp/start', {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ email }),
  })
}

export function resendSellerContactOtp(token, challengeId) {
  return request('/api/auth/me/contact-otp/resend', {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ challenge_id: challengeId }),
  })
}

export function confirmSellerContactOtp(token, challengeId, code) {
  return request('/api/auth/me/contact-otp/confirm', {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ challenge_id: challengeId, code }),
  })
}

export function updateSellerStoreName(token, storeName) {
  return request('/api/auth/me/store-name', {
    method: 'PATCH',
    headers: authHeaders(token),
    body: JSON.stringify({ store_name: storeName }),
  })
}

export function uploadSellerProfilePhoto(token, file) {
  const formData = new FormData()
  formData.append('photo', file)
  return request('/api/auth/me/profile-photo', {
    method: 'POST',
    headers: authHeaders(token),
    body: formData,
  })
}

export function fetchDiscountCodesAvailability() {
  return request('/api/platform/discount-codes/availability')
}

export function validateDiscountCode({ code, planTier, billingPeriod }) {
  return request('/api/platform/discount-codes/validate', {
    method: 'POST',
    body: JSON.stringify({
      code,
      plan_tier: planTier,
      billing_period: billingPeriod,
    }),
  })
}

export function fetchRegistrations(token, status = 'pending') {
  return request(`/api/admin/registrations?status=${status}`, {
    headers: authHeaders(token),
  })
}

export function rejectRegistration(token, id) {
  return request(`/api/admin/registrations/${id}/reject`, {
    method: 'POST',
    headers: authHeaders(token),
  })
}

export function deleteRegistration(token, id) {
  return request(`/api/admin/registrations/${id}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  })
}

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

export function customerLogin(phone, password) {
  return request('/api/customers/login', { method: 'POST', body: JSON.stringify({ phone, password }) })
}

export function startCustomerPasswordReset(phone) {
  return request('/api/customers/password-reset/start', { method: 'POST', body: JSON.stringify({ phone }) })
}

export function resendCustomerPasswordReset(challengeId) {
  return request('/api/customers/password-reset/otp/resend', { method: 'POST', body: JSON.stringify({ challenge_id: challengeId }) })
}

export function confirmCustomerPasswordReset(challengeId, code) {
  return request('/api/customers/password-reset/otp/confirm', { method: 'POST', body: JSON.stringify({ challenge_id: challengeId, code }) })
}

export function completeCustomerPasswordReset(challengeId, password) {
  return request('/api/customers/password-reset/complete', { method: 'POST', body: JSON.stringify({ challenge_id: challengeId, password }) })
}

export function startCustomerRegistration(payload) {
  return request('/api/customers/register/otp/start', { method: 'POST', body: JSON.stringify(payload) })
}

export function resendCustomerRegistration(payload) {
  return request('/api/customers/register/otp/resend', { method: 'POST', body: JSON.stringify(payload) })
}

export function confirmCustomerRegistration(payload) {
  return request('/api/customers/register/otp/confirm', { method: 'POST', body: JSON.stringify(payload) })
}

function customerHeaders(token) { return { Authorization: `Bearer ${token}` } }

export function fetchCustomerProfile(token) {
  return request('/api/customers/me', { headers: customerHeaders(token) })
}

export function startCustomerEmailOtp(token, email) {
  return request('/api/customers/me/email/otp/start', { method: 'POST', headers: customerHeaders(token), body: JSON.stringify({ email }) })
}

export function startCustomerPhoneOtp(token, phone) {
  return request('/api/customers/me/phone/otp/start', { method: 'POST', headers: customerHeaders(token), body: JSON.stringify({ phone }) })
}

export function confirmCustomerContactOtp(token, challengeId, code) {
  return request('/api/customers/me/contact-otp/confirm', { method: 'POST', headers: customerHeaders(token), body: JSON.stringify({ challenge_id: challengeId, code }) })
}

export function updateCustomerIdentityCard(token, identityCard) {
  return request('/api/customers/me/identity-card', { method: 'PATCH', headers: customerHeaders(token), body: JSON.stringify({ identity_card: identityCard }) })
}

export function fetchCustomerOrders(token) {
  return request('/api/customers/me/orders', { headers: customerHeaders(token) })
}

export function addCustomerAddress(token, address) {
  return request('/api/customers/me/addresses', { method: 'POST', headers: customerHeaders(token), body: JSON.stringify(address) })
}

export function updateCustomerAddress(token, addressId, address) {
  return request(`/api/customers/me/addresses/${encodeURIComponent(addressId)}`, { method: 'PUT', headers: customerHeaders(token), body: JSON.stringify(address) })
}

export function deleteCustomerAddress(token, addressId) {
  return request(`/api/customers/me/addresses/${encodeURIComponent(addressId)}`, { method: 'DELETE', headers: customerHeaders(token) })
}

export function addCustomerFavorite(token, productId) {
  return request(`/api/customers/me/favorites/${encodeURIComponent(productId)}`, { method: 'PUT', headers: customerHeaders(token) })
}

export function removeCustomerFavorite(token, productId) {
  return request(`/api/customers/me/favorites/${encodeURIComponent(productId)}`, { method: 'DELETE', headers: customerHeaders(token) })
}

export function fetchStoreCustomers(token) {
  return request('/api/customers/store/customers', { headers: customerHeaders(token) })
}

export function uploadCustomerPhoto(token, file) {
  const formData = new FormData()
  formData.append('photo', file)
  return request('/api/customers/me/profile-photo', { method: 'POST', headers: customerHeaders(token), body: formData })
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

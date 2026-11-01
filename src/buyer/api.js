import { request } from '../lib/api.js'

function authHeaders(token) {
  return { Authorization: `Bearer ${token}` }
}

function appendAdditionalMunicipalities(params, additionalMunicipalityIds) {
  if (!additionalMunicipalityIds?.length) return
  for (const municipalityId of additionalMunicipalityIds) {
    params.append('municipios_adicionales', municipalityId)
  }
}

function appendDisplayCurrency(params, currency) {
  const codes = Array.isArray(currency) ? currency : currency ? [currency] : []
  for (const code of codes) {
    if (code) params.append('currency', code)
  }
}

export function fetchMarketplaceBanners(provinceId = null) {
  const params = new URLSearchParams()
  if (provinceId) params.set('province_id', provinceId)
  const query = params.toString() ? `?${params.toString()}` : ''
  return request(`/api/marketplace/banners${query}`)
}

export function fetchMarketplaceAvailabilityHints({ provinceId, municipalityIds, currency, globalCategoryId }) {
  const params = new URLSearchParams({ province_id: provinceId })
  for (const municipalityId of municipalityIds ?? []) {
    if (municipalityId) params.append('municipality_id', municipalityId)
  }
  appendDisplayCurrency(params, currency)
  if (globalCategoryId) params.set('global_category_id', globalCategoryId)
  return request(`/api/marketplace/availability-hints?${params}`)
}

export function fetchMarketplaceFeed({
  provinceId,
  municipalityId,
  additionalMunicipalityIds,
  currency,
  limitPerCategory = 20,
  limit = 4,
  offset = 0,
}) {
  const params = new URLSearchParams({
    province_id: provinceId,
    municipality_id: municipalityId,
    limit_per_category: String(limitPerCategory),
    limit: String(limit),
    offset: String(offset),
  })
  appendAdditionalMunicipalities(params, additionalMunicipalityIds)
  appendDisplayCurrency(params, currency)
  return request(`/api/marketplace/feed?${params}`)
}

export function fetchMarketplaceBusinesses({
  provinceId,
  municipalityId,
  additionalMunicipalityIds,
  currency,
  query = '',
  categoryId,
  limit = 20,
  offset = 0,
}) {
  const params = new URLSearchParams({
    province_id: provinceId,
    municipality_id: municipalityId,
    limit: String(limit),
    offset: String(offset),
  })
  if (query.trim()) params.set('q', query.trim())
  if (categoryId) params.set('category_id', categoryId)
  appendAdditionalMunicipalities(params, additionalMunicipalityIds)
  appendDisplayCurrency(params, currency)
  return request(`/api/marketplace/businesses?${params}`)
}

export function fetchMarketplaceSearch({
  provinceId,
  municipalityId,
  additionalMunicipalityIds,
  currency,
  query = '',
  globalCategoryId,
  limit = 20,
  offset = 0,
  storeSlug,
  gestorUsername,
}) {
  const params = new URLSearchParams({
    province_id: provinceId,
    municipality_id: municipalityId,
    q: query,
    limit: String(limit),
    offset: String(offset),
  })
  if (globalCategoryId) params.set('global_category_id', globalCategoryId)
  if (storeSlug) params.set('store_slug', storeSlug)
  if (gestorUsername) params.set('gestor_username', gestorUsername)
  appendAdditionalMunicipalities(params, additionalMunicipalityIds)
  appendDisplayCurrency(params, currency)
  return request(`/api/marketplace/search?${params}`)
}

export function fetchMarketplaceProduct({ productId, provinceId, municipalityId }) {
  const params = new URLSearchParams({ province_id: provinceId, municipality_id: municipalityId })
  return request(`/api/marketplace/products/${encodeURIComponent(productId)}?${params}`)
}

export function fetchMarketplaceSharedProducts({ provinceId, municipalityId, items }) {
  const params = new URLSearchParams({ province_id: provinceId, municipality_id: municipalityId })
  for (const item of items ?? []) {
    if (item) params.append('item', item)
  }
  return request(`/api/marketplace/shared-products?${params}`)
}

export function fetchMarketplaceStore(storeRef) {
  return request(`/api/marketplace/stores/${encodeURIComponent(storeRef)}`)
}

export function createMarketplaceOrder(payload, token = null) {
  return request('/api/marketplace/orders', {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: JSON.stringify(payload),
  })
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

export function registerCustomerDevice(device, token) {
  return request('/api/live/customer-devices', {
    method: 'POST', headers: authHeaders(token), body: JSON.stringify(device),
  })
}

export function unregisterCustomerDevice(tokenValue, token) {
  return request('/api/live/customer-devices', {
    method: 'DELETE', headers: authHeaders(token), body: JSON.stringify({ token: tokenValue }),
  })
}

export function syncBuyerJaba({ items, provinceId, municipalityId, additionalMunicipalityIds }) {
  const body = {
    items,
    province_id: provinceId ?? undefined,
    municipality_id: municipalityId ?? undefined,
  }
  if (additionalMunicipalityIds?.length) body.municipios_adicionales = additionalMunicipalityIds
  return request('/api/marketplace/jaba/sync', { method: 'POST', body: JSON.stringify(body) })
}

export function fetchMarketplaceCategoryProducts({
  provinceId,
  municipalityId,
  additionalMunicipalityIds,
  currency,
  globalCategoryId,
  limit = 20,
  offset = 0,
}) {
  const params = new URLSearchParams({
    province_id: provinceId,
    municipality_id: municipalityId,
    global_category_id: globalCategoryId,
    limit: String(limit),
    offset: String(offset),
  })
  appendAdditionalMunicipalities(params, additionalMunicipalityIds)
  appendDisplayCurrency(params, currency)
  return request(`/api/marketplace/products?${params}`)
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

export function addCustomerFavorite(token, productId) {
  return request(`/api/customers/me/favorites/${encodeURIComponent(productId)}`, { method: 'PUT', headers: authHeaders(token) })
}

export function removeCustomerFavorite(token, productId) {
  return request(`/api/customers/me/favorites/${encodeURIComponent(productId)}`, { method: 'DELETE', headers: authHeaders(token) })
}

export function uploadCustomerPhoto(token, file) {
  const formData = new FormData()
  formData.append('photo', file)
  return request('/api/customers/me/profile-photo', { method: 'POST', headers: authHeaders(token), body: formData })
}

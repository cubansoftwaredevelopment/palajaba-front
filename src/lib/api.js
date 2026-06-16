import { downloadBlob } from './downloadFile'

/** En dev usa rutas relativas → proxy de Vite. En prod usa VITE_API_URL. */
function getApiBase() {
  if (import.meta.env.DEV) return ''
  return import.meta.env.VITE_API_URL ?? 'https://palajaba-api.onrender.com'
}

export const NETWORK_ERROR_CODE = 'network_error'

export class ApiError extends Error {
  constructor(message, { code = null, data = null, status = null } = {}) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.data = data
    this.status = status
  }
}

export function parseApiErrorDetail(detail) {
  if (typeof detail === 'string') {
    return { message: detail, code: null, data: null }
  }

  if (detail && typeof detail === 'object' && !Array.isArray(detail)) {
    return {
      message: detail.message || 'Ocurrió un error. Intenta de nuevo.',
      code: detail.code || null,
      data: detail,
    }
  }

  if (Array.isArray(detail)) {
    return {
      message: detail
        .map((item) => {
          if (typeof item === 'string') return item
          if (item?.msg) {
            const field = Array.isArray(item.loc)
              ? item.loc.filter((p) => p !== 'body').join('.')
              : ''
            return field ? `${field}: ${item.msg}` : item.msg
          }
          return 'Datos inválidos'
        })
        .join(' '),
      code: null,
      data: null,
    }
  }

  return { message: 'Ocurrió un error. Intenta de nuevo.', code: null, data: null }
}

export async function parseApiError(response) {
  const data = await response.json().catch(() => ({}))
  return parseApiErrorDetail(data.detail).message
}

async function request(path, options = {}) {
  const headers = { ...options.headers }
  const hasBody = options.body != null && options.body !== ''
  if (hasBody && !headers['Content-Type'] && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json'
  }

  let response
  try {
    response = await fetch(`${getApiBase()}${path}`, {
      ...options,
      headers,
    })
  } catch {
    throw new ApiError('Error de conexión', { code: NETWORK_ERROR_CODE })
  }

  if (!response.ok) {
    const data = await response.json().catch(() => ({}))
    const parsed = parseApiErrorDetail(data.detail)
    const fallback =
      response.status === 404
        ? 'No encontramos lo que buscabas.'
        : response.status >= 500
          ? 'El servicio no está disponible en este momento.'
          : 'Ocurrió un error. Intenta de nuevo.'
    const message =
      parsed.message === 'Ocurrió un error. Intenta de nuevo.' ? fallback : parsed.message
    throw new ApiError(message, { code: parsed.code, data: parsed.data, status: response.status })
  }

  if (response.status === 204) {
    return null
  }

  return response.json()
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

export function fetchSellerProfile(token) {
  return request('/api/auth/me', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
}

export function fetchSellerBusinessCategories(token) {
  return request('/api/auth/me/business-categories', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
}

export function fetchCategories() {
  return request('/api/categories/')
}

export function fetchProductCategories() {
  return request('/api/product-categories/')
}

export function updateSellerProfile(token, payload) {
  return request('/api/auth/me/profile', {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  })
}

export function updateSellerPhone(token, phone) {
  return request('/api/auth/me/phone', {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ phone }),
  })
}

export async function uploadSellerProfilePhoto(token, file) {
  const formData = new FormData()
  formData.append('photo', file)

  const response = await fetch(`${getApiBase()}/api/auth/me/profile-photo`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  })

  if (!response.ok) {
    const data = await response.json().catch(() => ({}))
    const parsed = parseApiErrorDetail(data.detail)
    throw new ApiError(parsed.message, { code: parsed.code, data: parsed.data })
  }

  return response.json()
}

export function registerSeller(payload) {
  return request('/api/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function adminLogin(username, password) {
  return request('/api/admin/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  })
}

export function fetchRegistrations(token, status = 'pending') {
  return request(`/api/admin/registrations?status=${status}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
}

export function approveRegistration(token, id, subscriptionEndsAt, paymentAmountCup) {
  const params = new URLSearchParams()
  params.set('payment_amount_cup', String(paymentAmountCup))
  if (subscriptionEndsAt) {
    params.set('subscription_ends_at', subscriptionEndsAt)
  }

  return request(`/api/admin/registrations/${id}/approve?${params.toString()}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
}

export function rejectRegistration(token, id) {
  return request(`/api/admin/registrations/${id}/reject`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
}

export function deleteRegistration(token, id) {
  return request(`/api/admin/registrations/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
}

export function fetchAdminStats(token, { year, month } = {}) {
  const params = new URLSearchParams()
  if (year != null) params.set('year', String(year))
  if (month != null) params.set('month', String(month))
  const query = params.toString() ? `?${params.toString()}` : ''

  return request(`/api/admin/stats/summary${query}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
}

export function updateRegistrationPayment(token, id, paymentAmountCup) {
  const params = new URLSearchParams()
  params.set('payment_amount_cup', String(paymentAmountCup))

  return request(`/api/admin/registrations/${id}/payment?${params.toString()}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
}

export function updateRegistrationSubscription(
  token,
  id,
  { subscriptionEndsAt, planTier, billingPeriod } = {},
) {
  const params = new URLSearchParams()
  params.set('subscription_ends_at', subscriptionEndsAt)
  if (planTier) params.set('plan_tier', planTier)
  if (billingPeriod) params.set('billing_period', billingPeriod)

  return request(`/api/admin/registrations/${id}/subscription?${params.toString()}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
}

/** @deprecated Use updateRegistrationSubscription */
export function updateSubscriptionEnd(token, id, subscriptionEndsAt) {
  return updateRegistrationSubscription(token, id, { subscriptionEndsAt })
}

export function renewRegistration(
  token,
  id,
  { subscriptionEndsAt, paymentAmountCup, planTier, billingPeriod } = {},
) {
  const params = new URLSearchParams()
  params.set('payment_amount_cup', String(paymentAmountCup))
  if (subscriptionEndsAt) params.set('subscription_ends_at', subscriptionEndsAt)
  if (planTier) params.set('plan_tier', planTier)
  if (billingPeriod) params.set('billing_period', billingPeriod)

  return request(`/api/admin/registrations/${id}/renew?${params.toString()}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
}

export function fetchAdminNotifications(token) {
  return request('/api/admin/notifications', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
}

export function sendAdminNotification(token, payload) {
  return request('/api/admin/notifications', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  })
}

export function fetchAdminSettings(token) {
  return request('/api/admin/settings', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
}

export function updateAdminSettings(token, payload) {
  return request('/api/admin/settings', {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  })
}

export function fetchRenewalContactPhone() {
  return request('/api/platform/renewal-contact')
}

export function fetchExchangeRates() {
  return request('/api/platform/exchange-rates')
}

export function fetchSellerNotifications(token) {
  return request('/api/auth/me/notifications', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
}

export function fetchSellerUnreadNotificationCount(token) {
  return request('/api/auth/me/notifications/unread-count', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
}

export function markSellerNotificationRead(token, notificationId) {
  return request(`/api/auth/me/notifications/${notificationId}/read`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
}

export function markSellerSystemNotificationsRead(token) {
  return request('/api/auth/me/notifications/read-system', {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
}

export function fetchSellerCatalog(token) {
  return request('/api/auth/me/catalog', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
}

export function fetchSellerStatsSummary(token, { year, month } = {}) {
  const params = new URLSearchParams()
  if (year != null) params.set('year', String(year))
  if (month != null) params.set('month', String(month))
  const query = params.toString() ? `?${params.toString()}` : ''

  return request(`/api/auth/me/stats/summary${query}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
}

export function fetchSellerRevenueChart(token, { granularity, year, month } = {}) {
  const params = new URLSearchParams({ granularity })
  if (year != null) params.set('year', String(year))
  if (month != null) params.set('month', String(month))

  return request(`/api/auth/me/stats/revenue?${params}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
}

export function fetchSellerProductsSoldChart(token, { granularity, year, month } = {}) {
  const params = new URLSearchParams({ granularity })
  if (year != null) params.set('year', String(year))
  if (month != null) params.set('month', String(month))

  return request(`/api/auth/me/stats/products-sold?${params}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
}

export function fetchSellerTopProducts(token) {
  return request('/api/auth/me/stats/top-products', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
}

export function createCatalogCategory(token, payload) {
  return request('/api/auth/me/catalog/categories', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  })
}

export function deleteCatalogCategory(token, categoryId) {
  return request(`/api/auth/me/catalog/categories/${categoryId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
}

export function reorderCatalogCategories(token, categoryIds) {
  return request('/api/auth/me/catalog/categories/order', {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ category_ids: categoryIds }),
  })
}

export function fetchCatalogCurrencies(token) {
  return request('/api/auth/me/catalog/currencies', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
}

export async function createCatalogProduct(token, formData) {
  const response = await fetch(`${getApiBase()}/api/auth/me/catalog/products`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  })

  if (!response.ok) {
    const data = await response.json().catch(() => ({}))
    const parsed = parseApiErrorDetail(data.detail)
    throw new ApiError(parsed.message, { code: parsed.code, data: parsed.data })
  }

  return response.json()
}

export async function updateCatalogProduct(token, productId, formData) {
  const response = await fetch(`${getApiBase()}/api/auth/me/catalog/products/${productId}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  })

  if (!response.ok) {
    const data = await response.json().catch(() => ({}))
    const parsed = parseApiErrorDetail(data.detail)
    throw new ApiError(parsed.message, { code: parsed.code, data: parsed.data })
  }

  return response.json()
}

export function deleteCatalogProduct(token, productId) {
  return request(`/api/auth/me/catalog/products/${productId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
}

function appendAdditionalMunicipalities(params, additionalMunicipalityIds) {
  if (!additionalMunicipalityIds?.length) return
  for (const municipalityId of additionalMunicipalityIds) {
    params.append('municipios_adicionales', municipalityId)
  }
}

export function fetchMarketplaceFeed({
  provinceId,
  municipalityId,
  additionalMunicipalityIds,
  limitPerCategory = 20,
}) {
  const params = new URLSearchParams({
    province_id: provinceId,
    municipality_id: municipalityId,
    limit_per_category: String(limitPerCategory),
  })
  appendAdditionalMunicipalities(params, additionalMunicipalityIds)
  return request(`/api/marketplace/feed?${params}`)
}

export function fetchMarketplaceSearch({
  provinceId,
  municipalityId,
  additionalMunicipalityIds,
  query = '',
  globalCategoryId,
  limit = 20,
  offset = 0,
}) {
  const params = new URLSearchParams({
    province_id: provinceId,
    municipality_id: municipalityId,
    q: query,
    limit: String(limit),
    offset: String(offset),
  })
  if (globalCategoryId) {
    params.set('global_category_id', globalCategoryId)
  }
  appendAdditionalMunicipalities(params, additionalMunicipalityIds)
  return request(`/api/marketplace/search?${params}`)
}

export function fetchMarketplaceStore(storeRef) {
  return request(`/api/marketplace/stores/${encodeURIComponent(storeRef)}`)
}

export function fetchMarketplaceStoreCatalog({
  storeSlug,
  provinceId,
  municipalityId,
  limitPerCategory = 20,
}) {
  const params = new URLSearchParams({
    province_id: provinceId,
    municipality_id: municipalityId,
    limit_per_category: String(limitPerCategory),
  })
  return request(`/api/marketplace/stores/${encodeURIComponent(storeSlug)}/catalog?${params}`)
}

export function fetchMarketplaceStoreCategoryProducts({
  storeSlug,
  localCategoryId,
  provinceId,
  municipalityId,
  limit = 20,
  offset = 0,
}) {
  const params = new URLSearchParams({
    province_id: provinceId,
    municipality_id: municipalityId,
    limit: String(limit),
    offset: String(offset),
  })
  return request(
    `/api/marketplace/stores/${encodeURIComponent(storeSlug)}/categories/${encodeURIComponent(localCategoryId)}/products?${params}`,
  )
}

export function createMarketplaceOrder(payload) {
  return request('/api/marketplace/orders', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function fetchSellerOrders(token) {
  return request('/api/auth/me/orders', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
}

export function updateSellerOrder(token, orderId, payload) {
  return request(`/api/auth/me/orders/${encodeURIComponent(orderId)}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  })
}

export function deleteSellerOrder(token, orderId) {
  return request(`/api/auth/me/orders/${encodeURIComponent(orderId)}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
}

export async function downloadSellerOrderInvoice(token, orderId, type = 'store') {
  const response = await fetch(
    `${getApiBase()}/api/auth/me/orders/${encodeURIComponent(orderId)}/invoice.pdf?type=${encodeURIComponent(type)}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  )

  if (!response.ok) {
    const data = await response.json().catch(() => ({}))
    const parsed = parseApiErrorDetail(data.detail)
    throw new ApiError(parsed.message, { code: parsed.code, data: parsed.data })
  }

  const blob = await response.blob()
  const disposition = response.headers.get('Content-Disposition') ?? ''
  const match = disposition.match(/filename="([^"]+)"/)
  const filename = match?.[1] ?? `pedido-${orderId.slice(-6).toUpperCase()}-${type}.pdf`

  await downloadBlob(blob, filename, 'application/pdf')
}

export function fetchMarketplaceCategoryProducts({
  provinceId,
  municipalityId,
  additionalMunicipalityIds,
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
  return request(`/api/marketplace/products?${params}`)
}

export function syncBuyerJaba({ items, provinceId, municipalityId, additionalMunicipalityIds }) {
  const body = {
    items,
    province_id: provinceId ?? undefined,
    municipality_id: municipalityId ?? undefined,
  }
  if (additionalMunicipalityIds?.length) {
    body.municipios_adicionales = additionalMunicipalityIds
  }
  return request('/api/marketplace/jaba/sync', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

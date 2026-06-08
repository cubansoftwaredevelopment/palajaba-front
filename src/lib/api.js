/** En dev usa rutas relativas → proxy de Vite. En prod usa VITE_API_URL. */
function getApiBase() {
  if (import.meta.env.DEV) return ''
  return import.meta.env.VITE_API_URL ?? 'https://palajaba-api.onrender.com'
}

export class ApiError extends Error {
  constructor(message, { code = null, data = null } = {}) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.data = data
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

  const response = await fetch(`${getApiBase()}${path}`, {
    ...options,
    headers,
  })

  if (!response.ok) {
    const data = await response.json().catch(() => ({}))
    const parsed = parseApiErrorDetail(data.detail)
    const fallback =
      response.status === 404
        ? 'Recurso no encontrado. Si acabas de actualizar la app, espera a que el servidor termine de desplegarse.'
        : response.statusText || 'Error de servidor'
    const message =
      parsed.message === 'Ocurrió un error. Intenta de nuevo.' ? fallback : parsed.message
    throw new ApiError(message, { code: parsed.code, data: parsed.data })
  }

  if (response.status === 204) {
    return null
  }

  return response.json()
}

export function sellerLogin(payload) {
  return request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function fetchSellerProfile(token) {
  return request('/api/auth/me', {
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

export function updateSubscriptionEnd(token, id, subscriptionEndsAt) {
  const params = `?subscription_ends_at=${encodeURIComponent(subscriptionEndsAt)}`
  return request(`/api/admin/registrations/${id}/subscription${params}`, {
    method: 'PATCH',
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

export function fetchSellerCatalog(token) {
  return request('/api/auth/me/catalog', {
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

export function fetchMarketplaceFeed({ provinceId, municipalityId, limitPerCategory = 20 }) {
  const params = new URLSearchParams({
    province_id: provinceId,
    municipality_id: municipalityId,
    limit_per_category: String(limitPerCategory),
  })
  return request(`/api/marketplace/feed?${params}`)
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

  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export function fetchMarketplaceCategoryProducts({
  provinceId,
  municipalityId,
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
  return request(`/api/marketplace/products?${params}`)
}

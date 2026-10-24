import { request } from '../lib/api'

function authHeaders(token) {
  return { Authorization: `Bearer ${token}` }
}

function appendDisplayCurrency(params, currency) {
  const codes = Array.isArray(currency) ? currency : currency ? [currency] : []
  for (const code of codes) {
    if (code) params.append('currency', code)
  }
}

export function fetchCategories() {
  return request('/api/categories/')
}

export function fetchProductCategories() {
  return request('/api/product-categories/')
}

export function fetchAdminProducts(token) {
  return request('/api/admin/products', {
    headers: authHeaders(token),
  })
}

export function fetchSellerCatalog(token) {
  return request('/api/auth/me/catalog', {
    headers: authHeaders(token),
  })
}

export function searchSellerOrderedProducts(token, query = '') {
  const params = new URLSearchParams()
  const normalized = String(query ?? '').trim()
  if (normalized) params.set('q', normalized)
  const suffix = params.toString() ? `?${params}` : ''
  return request(`/api/auth/me/catalog/products/search${suffix}`, {
    headers: authHeaders(token),
  })
}

export function createCatalogCategory(token, payload) {
  return request('/api/auth/me/catalog/categories', {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  })
}

export function deleteCatalogCategory(token, categoryId) {
  return request(`/api/auth/me/catalog/categories/${categoryId}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  })
}

export function reorderCatalogCategories(token, categoryIds) {
  return request('/api/auth/me/catalog/categories/order', {
    method: 'PUT',
    headers: authHeaders(token),
    body: JSON.stringify({ category_ids: categoryIds }),
  })
}

export function updateCatalogCategoryProductSort(token, categoryId, productSortMode) {
  return request(
    `/api/auth/me/catalog/categories/${encodeURIComponent(categoryId)}/product-sort`,
    {
      method: 'PATCH',
      headers: authHeaders(token),
      body: JSON.stringify({ product_sort_mode: productSortMode }),
    },
  )
}

export function reorderCatalogProducts(token, categoryId, productIds) {
  return request(
    `/api/auth/me/catalog/categories/${encodeURIComponent(categoryId)}/products/order`,
    {
      method: 'PUT',
      headers: authHeaders(token),
      body: JSON.stringify({ product_ids: productIds }),
    },
  )
}

export function updateCatalogTheme(token, catalogTheme, catalogPalette) {
  return request('/api/auth/me/catalog/theme', {
    method: 'PATCH',
    headers: authHeaders(token),
    body: JSON.stringify({
      catalog_theme: catalogTheme,
      ...(catalogPalette ? { catalog_palette: catalogPalette } : {}),
    }),
  })
}

export function fetchCatalogCurrencies(token) {
  return request('/api/auth/me/catalog/currencies', {
    headers: authHeaders(token),
  })
}

export function createCatalogProduct(token, formData) {
  return request('/api/auth/me/catalog/products', {
    method: 'POST',
    headers: authHeaders(token),
    body: formData,
  })
}

export function updateCatalogProduct(token, productId, formData) {
  return request(`/api/auth/me/catalog/products/${productId}`, {
    method: 'PATCH',
    headers: authHeaders(token),
    body: formData,
  })
}

export function deleteCatalogProduct(token, productId) {
  return request(`/api/auth/me/catalog/products/${productId}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  })
}

export function fetchMarketplaceStoreCatalog({
  storeSlug,
  provinceId,
  municipalityId,
  currency,
  limitPerCategory = 20,
}) {
  const params = new URLSearchParams({
    province_id: provinceId,
    municipality_id: municipalityId,
    limit_per_category: String(limitPerCategory),
  })
  appendDisplayCurrency(params, currency)
  return request(
    `/api/marketplace/stores/${encodeURIComponent(storeSlug)}/catalog?${params}`,
  )
}

export function fetchMarketplaceGestorStoreCatalog({
  storeSlug,
  gestorUsername,
  provinceId,
  municipalityId,
  currency,
  limitPerCategory = 20,
}) {
  const params = new URLSearchParams({
    province_id: provinceId,
    municipality_id: municipalityId,
    limit_per_category: String(limitPerCategory),
  })
  appendDisplayCurrency(params, currency)
  return request(
    `/api/marketplace/stores/${encodeURIComponent(storeSlug)}/gestores/${encodeURIComponent(gestorUsername)}/catalog?${params}`,
  )
}

export function fetchMarketplaceStoreCategoryProducts({
  storeSlug,
  localCategoryId,
  provinceId,
  municipalityId,
  currency,
  limit = 20,
  offset = 0,
}) {
  const params = new URLSearchParams({
    province_id: provinceId,
    municipality_id: municipalityId,
    limit: String(limit),
    offset: String(offset),
  })
  appendDisplayCurrency(params, currency)
  return request(
    `/api/marketplace/stores/${encodeURIComponent(storeSlug)}/categories/${encodeURIComponent(localCategoryId)}/products?${params}`,
  )
}

export function fetchMarketplaceGestorStoreCategoryProducts({
  storeSlug,
  gestorUsername,
  localCategoryId,
  provinceId,
  municipalityId,
  currency,
  limit = 20,
  offset = 0,
}) {
  const params = new URLSearchParams({
    province_id: provinceId,
    municipality_id: municipalityId,
    limit: String(limit),
    offset: String(offset),
  })
  appendDisplayCurrency(params, currency)
  return request(
    `/api/marketplace/stores/${encodeURIComponent(storeSlug)}/gestores/${encodeURIComponent(gestorUsername)}/categories/${encodeURIComponent(localCategoryId)}/products?${params}`,
  )
}

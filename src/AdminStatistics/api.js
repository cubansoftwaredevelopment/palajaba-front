import { request } from '../lib/api'

function authHeaders(token) {
  return {
    Authorization: `Bearer ${token}`,
  }
}

function appendChartWindow(params, { year, month, start, end } = {}) {
  if (start && end) {
    params.set('start', start)
    params.set('end', end)
    return
  }
  if (year != null) params.set('year', String(year))
  if (month != null) params.set('month', String(month))
}

export function fetchAdminStats(token, { year, month } = {}) {
  const params = new URLSearchParams()
  if (year != null) params.set('year', String(year))
  if (month != null) params.set('month', String(month))
  const query = params.toString() ? `?${params.toString()}` : ''

  return request(`/api/admin/stats/summary${query}`, {
    headers: authHeaders(token),
  })
}

export function fetchAdminBusinessesByProvince(token) {
  return request('/api/admin/stats/businesses-by-province', {
    headers: authHeaders(token),
  })
}

export function fetchAdminRevenueChart(token, { granularity, year, month, start, end } = {}) {
  const params = new URLSearchParams({ granularity })
  appendChartWindow(params, { year, month, start, end })

  return request(`/api/admin/stats/revenue?${params.toString()}`, {
    headers: authHeaders(token),
  })
}

export function fetchAdminTrafficChart(token, { granularity, year, month, start, end } = {}) {
  const params = new URLSearchParams({ granularity })
  appendChartWindow(params, { year, month, start, end })

  return request(`/api/admin/stats/traffic?${params.toString()}`, {
    headers: authHeaders(token),
  })
}

export function fetchAdminTrafficLocations(token, { year, month, start, end } = {}) {
  const params = new URLSearchParams()
  appendChartWindow(params, { year, month, start, end })
  const query = params.toString() ? `?${params.toString()}` : ''

  return request(`/api/admin/stats/traffic/locations${query}`, {
    headers: authHeaders(token),
  })
}

export function fetchAdminTrafficPatterns(token, { year, month, start, end } = {}) {
  const params = new URLSearchParams()
  appendChartWindow(params, { year, month, start, end })
  const query = params.toString() ? `?${params.toString()}` : ''

  return request(`/api/admin/stats/traffic/patterns${query}`, {
    headers: authHeaders(token),
  })
}

export function fetchAdminOrdersChart(token, { granularity, year, month, start, end } = {}) {
  const params = new URLSearchParams({ granularity })
  appendChartWindow(params, { year, month, start, end })

  return request(`/api/admin/stats/orders?${params.toString()}`, {
    headers: authHeaders(token),
  })
}

export function fetchAdminOrderSalesChart(token, { granularity, year, month, start, end } = {}) {
  const params = new URLSearchParams({ granularity })
  appendChartWindow(params, { year, month, start, end })

  return request(`/api/admin/stats/orders/sales?${params.toString()}`, {
    headers: authHeaders(token),
  })
}

export function fetchAdminDeviceStats(token, { granularity, year, month, start, end } = {}) {
  const params = new URLSearchParams({ granularity })
  appendChartWindow(params, { year, month, start, end })

  return request(`/api/admin/stats/devices?${params.toString()}`, {
    headers: authHeaders(token),
  })
}

export function fetchAdminOrdersTopBusinesses(token, { granularity, start, end } = {}) {
  const params = new URLSearchParams({ granularity })
  appendChartWindow(params, { start, end })
  return request(`/api/admin/stats/orders/top-businesses?${params.toString()}`, {
    headers: authHeaders(token),
  })
}

export function fetchAdminTopSoldProducts(token, { granularity, start, end } = {}) {
  const params = new URLSearchParams({ granularity })
  appendChartWindow(params, { start, end })
  return request(`/api/admin/stats/products/sold?${params.toString()}`, {
    headers: authHeaders(token),
  })
}

export function fetchAdminTopPopularProducts(token, { granularity, start, end } = {}) {
  const params = new URLSearchParams({ granularity })
  appendChartWindow(params, { start, end })
  return request(`/api/admin/stats/products/popular?${params.toString()}`, {
    headers: authHeaders(token),
  })
}

export function fetchAdminOrdersLocations(token, { granularity, start, end } = {}) {
  const params = new URLSearchParams({ granularity })
  appendChartWindow(params, { start, end })
  return request(`/api/admin/stats/orders/locations?${params.toString()}`, {
    headers: authHeaders(token),
  })
}

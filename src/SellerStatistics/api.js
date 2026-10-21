import { request } from '../lib/api'

function authHeaders(token) {
  return { Authorization: `Bearer ${token}` }
}

function chartQuery({ granularity, start, end } = {}) {
  const params = new URLSearchParams()
  if (granularity) params.set('granularity', granularity)
  if (start) params.set('start', start)
  if (end) params.set('end', end)
  const query = params.toString()
  return query ? `?${query}` : ''
}

function get(path, token, window) {
  return request(`/api/seller/statistics${path}${chartQuery(window)}`, {
    headers: authHeaders(token),
  })
}

export function fetchSellerStatsKpis(token, window) {
  return get('/kpis', token, window)
}

export function fetchSellerSiteConversion(token, window) {
  return get('/conversion/site', token, window)
}

export function fetchSellerProductConversion(token, window) {
  return get('/conversion/products', token, window)
}

export function fetchSellerHighViewsLowSales(token, window) {
  return get('/conversion/high-views-low-sales', token, window)
}

export function fetchSellerViewsByZone(token, window) {
  return get('/views-by-zone', token, window)
}

export function fetchSellerTraffic(token, window) {
  return get('/traffic', token, window)
}

export function fetchSellerProductViews(token, window) {
  return get('/product-views', token, window)
}

export function fetchSellerDeliveredOrders(token, window) {
  return get('/orders', token, window)
}

export function fetchSellerRevenue(token, window) {
  return get('/revenue', token, window)
}

export function fetchSellerTopSold(token, window) {
  return get('/top-sold', token, window)
}

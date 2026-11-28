import { request } from '../api/client.js'
import { fetchRegistrations } from '../auth/api.js'
import { fetchSellerProfile } from '../auth/api.js'
import { fetchSellerCatalog } from '../products/api.js'
import { fetchSellerNotifications, fetchSellerOrders, fetchSellerStatsSummary } from '../seller/api.js'
import { fetchStoreCustomers } from '../auth/api.js'
import { fetchAdminSettings } from '../admin/api.js'
import { fetchCustomerOrders, fetchCustomerPaymentNotifications, fetchCustomerProfile } from '../customer/api.js'
import { fetchGestorAllowedProducts, fetchGestorMe } from '../gestor/api.js'
import { fetchMensajeroMe, fetchMensajeroSummary } from '../mensajeros/api.js'
import { latestIso } from './store.js'

export const ROLE_SECTIONS = {
  customer: ['perfil', 'direcciones', 'favoritos', 'pedidos', 'avisos'],
  seller: ['perfil', 'catalogo', 'pedidos', 'clientes', 'avisos', 'estadisticas'],
  gestor: ['perfil', 'productos', 'permitidos'],
  mensajero: ['perfil', 'vehiculos', 'rutas'],
  admin: ['ajustes', 'estadisticas', 'aprobaciones', 'cuentas'],
}

const SYNC_PATH = {
  customer: '/api/customers/me/sync',
  seller: '/api/auth/me/sync',
  gestor: '/api/gestores/me/sync',
  mensajero: '/api/mensajeros/me/sync',
  admin: '/api/admin/me/sync',
}

function headers(token) {
  return { Authorization: `Bearer ${token}` }
}

export function compareSectionDates(role, token, dates) {
  return request(SYNC_PATH[role], {
    method: 'POST',
    headers: headers(token),
    body: JSON.stringify(dates),
    syncSkip: true,
  })
}

export function pushSection(role, token, name, updatedAt, data) {
  return request(`${SYNC_PATH[role]}/${encodeURIComponent(name)}`, {
    method: 'PUT',
    headers: headers(token),
    body: JSON.stringify({ updated_at: updatedAt, data }),
    syncSkip: true,
  })
}

function customerSlices(customer) {
  const dates = customer?.section_updated_at || {}
  return {
    perfil: { updatedAt: dates.perfil || customer?.updated_at || null, data: customer },
    direcciones: { updatedAt: dates.direcciones || customer?.updated_at || null, data: customer?.addresses || [] },
    favoritos: {
      updatedAt: dates.favoritos || customer?.updated_at || null,
      data: { favorite_product_ids: customer?.favorite_product_ids || [], favorites: customer?.favorites || [] },
    },
  }
}

async function pullCustomer(token, name, bag) {
  if (name === 'perfil' || name === 'direcciones' || name === 'favoritos') {
    bag.customer ||= await fetchCustomerProfile(token)
    const slices = customerSlices(bag.customer)
    return { ...slices[name], siblings: slices }
  }
  if (name === 'pedidos') {
    const page = await fetchCustomerOrders(token, { offset: 0, limit: 10 })
    const updatedAt = latestIso((page?.items || []).map((item) => item.updated_at || item.created_at))
    return { updatedAt, data: page }
  }
  const notices = await fetchCustomerPaymentNotifications(token)
  const items = Array.isArray(notices) ? notices : (notices?.items || [])
  return { updatedAt: latestIso(items.map((item) => item.read_at || item.created_at)), data: items }
}

async function pullSeller(token, name, bag) {
  if (name === 'perfil' || name === 'estadisticas' || name === 'catalogo' || name === 'avisos') {
    bag.seller ||= await fetchSellerProfile(token)
  }
  const dates = bag.seller?.section_updated_at || {}
  if (name === 'perfil') return { updatedAt: dates.perfil || bag.seller?.updated_at || null, data: bag.seller }
  if (name === 'catalogo') {
    const catalog = await fetchSellerCatalog(token)
    return { updatedAt: dates.catalogo || latestIso((catalog?.items || catalog || []).map?.((item) => item.updated_at) || []), data: catalog }
  }
  if (name === 'pedidos') {
    const page = await fetchSellerOrders(token, { offset: 0, limit: 25 })
    return { updatedAt: dates.pedidos || latestIso((page?.items || []).map((item) => item.updated_at)), data: page }
  }
  if (name === 'clientes') {
    const page = await fetchStoreCustomers(token, {})
    return { updatedAt: dates.clientes || null, data: page }
  }
  if (name === 'avisos') {
    const page = await fetchSellerNotifications(token, { paged: true, offset: 0, limit: 10 })
    const items = page?.items || page || []
    return { updatedAt: dates.avisos || latestIso(items.map((item) => item.created_at)), data: page }
  }
  const summary = await fetchSellerStatsSummary(token, {})
  return { updatedAt: dates.estadisticas || null, data: summary }
}

async function pullGestor(token, name, bag) {
  bag.me ||= await fetchGestorMe(token)
  const dates = bag.me?.section_updated_at || {}
  if (name === 'permitidos') {
    const products = await fetchGestorAllowedProducts(token)
    return { updatedAt: dates.permitidos || null, data: products }
  }
  if (name === 'productos') return { updatedAt: dates.productos || bag.me?.updated_at || null, data: bag.me?.selected_products || [] }
  return { updatedAt: dates.perfil || bag.me?.updated_at || null, data: bag.me }
}

async function pullMensajero(token, name, bag) {
  bag.me ||= await fetchMensajeroMe()
  const dates = bag.me?.section_updated_at || {}
  if (name === 'rutas') {
    const summary = await fetchMensajeroSummary({})
    return { updatedAt: dates.rutas || null, data: summary }
  }
  if (name === 'vehiculos') return { updatedAt: dates.vehiculos || bag.me?.updated_at || null, data: bag.me?.vehicles || [] }
  return { updatedAt: dates.perfil || bag.me?.updated_at || null, data: bag.me }
}

async function pullAdmin(token, name) {
  if (name === 'ajustes') {
    const settings = await fetchAdminSettings(token)
    return { updatedAt: settings?.updated_at || null, data: settings }
  }
  if (name === 'cuentas' || name === 'aprobaciones') {
    const rows = await fetchRegistrations(token, 'all')
    const updatedAt = latestIso((rows || []).map((item) => item.updated_at || item.created_at))
    return { updatedAt, data: rows }
  }
  return { updatedAt: new Date().toISOString(), data: null }
}

export function pullSection(role, token, name, bag) {
  if (role === 'customer') return pullCustomer(token, name, bag)
  if (role === 'seller') return pullSeller(token, name, bag)
  if (role === 'gestor') return pullGestor(token, name, bag)
  if (role === 'mensajero') return pullMensajero(token, name, bag)
  return pullAdmin(token, name)
}

export function pushData(role, name, section) {
  if (role === 'customer' && name === 'perfil') {
    return { full_name: section?.data?.full_name, qvapay_prompt_dismissed: Boolean(section?.data?.qvapay_prompt_dismissed) }
  }
  if (role === 'customer' && name === 'favoritos') return section?.data || { favorite_product_ids: [], favorites: [] }
  if (role === 'seller' && name === 'perfil') {
    const data = section?.data || {}
    return {
      biography: data.biography,
      social_instagram: data.social_instagram,
      social_facebook: data.social_facebook,
      social_links: data.social_links,
      offers_delivery: data.offers_delivery,
      gestores_enabled: data.gestores_enabled,
      business_area: data.business_area,
      delivery_areas: data.delivery_areas,
      category_ids: data.category_ids,
      catalog_theme: data.catalog_theme,
      catalog_palette: data.catalog_palette,
      store_pages: data.store_pages,
      gestor_catalog_access: data.gestor_catalog_access,
    }
  }
  if (role === 'admin' && name === 'ajustes') return { renewal_contact_phone: section?.data?.renewal_contact_phone }
  return section?.data ?? null
}

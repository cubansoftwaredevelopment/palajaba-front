import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { fetchCustomerOrders, fetchCustomerProfile, fetchCustomerPaymentNotifications, markCustomerPaymentNotificationRead, markAllCustomerPaymentNotificationsRead } from '../api.js'
import { getCustomerToken, updateCustomerProfile } from '../utils/customerAuth.js'
import { startAccountSync } from '../../accountSync/run.js'
import { accountIdFromToken, readAccount } from '../../accountSync/store.js'
import { fetchMarketplaceProduct } from '../../buyer/api.js'
import { CUSTOMER_NOTICES_EVENT } from '../../buyer/componentes/BuyerHeaderTools.jsx'
import { needsBuyerOrderAttention } from '../utils/constants.js'
import { getBuyerLocation } from '../../buyer/utils/buyerLocation.js'
import { customerAccountSection } from '../componentes/customerNav.jsx'
import { runSectionRefresh } from '../../session/sectionStore'
import { useSectionSnapshot } from '../../session/useSectionSnapshot'
import { getUserFacingMessage } from '../../shared/utils/userFacingError.js'
import { isCustomerAccountPath } from '../../motion/RouteMotion'
import {
  connectCustomerEvents,
  OPEN_CUSTOMER_AVISOS_EVENT,
  startCustomerPush,
  stopCustomerPush,
} from '../../live/utils'

const CUSTOMER_ORDER_PAGE = 10
const CUSTOMER_NOTICE_PAGE = 10

const CustomerAccountContext = createContext(null)

export function CustomerAccountProvider({ children }) {
  const navigate = useNavigate()
  const location = useLocation()
  const section = customerAccountSection(location.pathname)
  const token = getCustomerToken()
  const { snapshot, commit } = useSectionSnapshot('customer', 'account')
  const cachedAccount = snapshot?.data
  const cachedProfile = cachedAccount?.profile ?? null
  const savedNoticeQuery = snapshot?.query ?? {}
  const [profile, setProfile] = useState(cachedProfile)
  const [orders, setOrders] = useState(cachedAccount?.orders ?? [])
  const [ordersHasMore, setOrdersHasMore] = useState(cachedAccount?.ordersHasMore ?? false)
  const [ordersAttention, setOrdersAttention] = useState(cachedAccount?.ordersAttention ?? false)
  const [loadingMoreOrders, setLoadingMoreOrders] = useState(false)
  const ordersLengthRef = useRef(0)
  ordersLengthRef.current = orders.length
  const [paymentNotifications, setPaymentNotifications] = useState(cachedAccount?.paymentNotifications ?? [])
  const [notificationsLoading, setNotificationsLoading] = useState(snapshot == null)
  const [notificationsError, setNotificationsError] = useState('')
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [noticeDateFrom, setNoticeDateFrom] = useState(savedNoticeQuery.noticeDateFrom ?? '')
  const [noticeDateTo, setNoticeDateTo] = useState(savedNoticeQuery.noticeDateTo ?? '')
  const [noticesHasMore, setNoticesHasMore] = useState(cachedAccount?.noticesHasMore ?? false)
  const [loadingMoreNotices, setLoadingMoreNotices] = useState(false)
  const [favoriteProducts, setFavoriteProducts] = useState(cachedAccount?.favoriteProducts ?? [])
  const [loading, setLoading] = useState(cachedProfile == null)
  const [error, setError] = useState('')

  const hasAccountRef = useRef(cachedProfile != null)
  useEffect(() => {
    hasAccountRef.current = Boolean(profile)
  }, [profile])

  const loadPaymentNotifications = useCallback(async ({ append = false, offset = 0, silent = false } = {}) => {
    if (append) setLoadingMoreNotices(true)
    else if (!silent) {
      setNotificationsLoading(true)
      setNotificationsError('')
    }
    try {
      const page = await fetchCustomerPaymentNotifications(token, {
        paged: true,
        offset,
        limit: CUSTOMER_NOTICE_PAGE,
        dateFrom: noticeDateFrom,
        dateTo: noticeDateTo,
      })
      const items = Array.isArray(page) ? page : (Array.isArray(page?.items) ? page.items : [])
      setPaymentNotifications((current) => (append ? [...current, ...items] : items))
      setNoticesHasMore(Boolean(page?.has_more))
    } catch (cause) {
      if (!append && !silent) {
        setNotificationsError(getUserFacingMessage(cause, 'No pudimos cargar tus avisos.'))
        setPaymentNotifications([])
        setNoticesHasMore(false)
      }
    } finally {
      setNotificationsLoading(false)
      setLoadingMoreNotices(false)
    }
  }, [noticeDateFrom, noticeDateTo, token])

  const applyCustomerOrders = useCallback((page, { append = false } = {}) => {
    const items = Array.isArray(page?.items) ? page.items : []
    setOrders((current) => append ? [...current, ...items] : items)
    setOrdersHasMore(Boolean(page?.has_more))
    setOrdersAttention(Boolean(page?.has_attention))
    if (!append) {
      setSelectedOrder((current) => current ? items.find((order) => order.id === current.id) ?? current : current)
    }
  }, [])

  const refreshCustomerOrders = useCallback(async () => {
    try {
      const page = await fetchCustomerOrders(token, {
        offset: 0,
        limit: Math.max(CUSTOMER_ORDER_PAGE, ordersLengthRef.current),
      })
      applyCustomerOrders(page)
    } catch {
      /* El siguiente evento o la actualización manual volverá a sincronizar los pedidos. */
    }
  }, [applyCustomerOrders, token])

  const load = useCallback(async () => {
    if (!hasAccountRef.current) setLoading(true)
    setError('')
    try {
      const [customer, customerOrders] = await Promise.all([
        fetchCustomerProfile(token), fetchCustomerOrders(token, { offset: 0, limit: CUSTOMER_ORDER_PAGE }),
      ])
      setProfile(customer)
      updateCustomerProfile(customer)
      applyCustomerOrders(customerOrders)
      void loadPaymentNotifications()
      const buyerLocation = getBuyerLocation()
      const ids = customer.favorite_product_ids ?? []
      const savedById = new Map((customer.favorites ?? []).map((product) => [product.id, product]))
      if (buyerLocation?.province?.id && buyerLocation?.municipality?.id && ids.length) {
        const results = await Promise.allSettled(ids.map((productId) => fetchMarketplaceProduct({ productId, provinceId: buyerLocation.province.id, municipalityId: buyerLocation.municipality.id })))
        setFavoriteProducts(results.map((result, index) => {
          if (result.status !== 'fulfilled') {
            return { ...(savedById.get(ids[index]) ?? { id: ids[index], name: 'Oferta guardada' }), unavailable_in_municipality: buyerLocation.municipality.name }
          }
          return result.value.pickup_required
            ? { ...result.value, warning_municipality: buyerLocation.municipality.name }
            : result.value
        }))
      } else {
        setFavoriteProducts(ids.map((id) => ({ ...(savedById.get(id) ?? { id, name: 'Oferta guardada' }), unavailable_in_municipality: true })))
      }
    } catch (cause) {
      setError(getUserFacingMessage(cause, 'No pudimos cargar tu cuenta.'))
    } finally { setLoading(false) }
  }, [applyCustomerOrders, token])

  useEffect(() => {
    if (!token) return undefined
    let cancel = false
    const accountId = accountIdFromToken(token)
    function applyRecord(record) {
      if (cancel || !record) return
      const nextProfile = record.sections?.perfil?.data
      if (nextProfile) {
        setProfile(nextProfile)
        updateCustomerProfile(nextProfile)
        accountReadyRef.current = true
      }
      if (record.sections?.pedidos?.data) applyCustomerOrders(record.sections.pedidos.data)
      const notices = record.sections?.avisos?.data
      if (Array.isArray(notices)) setPaymentNotifications(notices)
      const favorites = record.sections?.favoritos?.data?.favorites
      if (Array.isArray(favorites)) setFavoriteProducts(favorites)
      setLoading(false)
      setNotificationsLoading(false)
    }
    readAccount('customer', accountId).then(applyRecord)
    startAccountSync({ role: 'customer', token, onAccount: applyRecord, onError: () => { if (!cancel) setLoading(false) } })
    return () => { cancel = true }
  }, [applyCustomerOrders, token])

  const accountReadyRef = useRef(cachedProfile != null)
  useEffect(() => {
    if (accountReadyRef.current) return
    queueMicrotask(() => { void load() })
  }, [load])

  useEffect(() => {
    if (!profile && orders.length === 0 && paymentNotifications.length === 0 && favoriteProducts.length === 0) return
    commit({
      profile,
      orders,
      ordersHasMore,
      ordersAttention,
      paymentNotifications,
      noticesHasMore,
      favoriteProducts,
    }, { noticeDateFrom, noticeDateTo })
  }, [profile, orders, ordersHasMore, ordersAttention, paymentNotifications, noticesHasMore, favoriteProducts, noticeDateFrom, noticeDateTo, commit])

  const refreshVisibleSection = useCallback(() => {
    const task = section === 'avisos'
      ? () => loadPaymentNotifications({ silent: true })
      : section === 'pedidos'
        ? () => refreshCustomerOrders()
        : () => load()
    return runSectionRefresh('customer', section, task)
  }, [section, load, loadPaymentNotifications, refreshCustomerOrders])

  useEffect(() => {
    if (!token) return undefined
    void startCustomerPush(token)
    return () => { void stopCustomerPush(token) }
  }, [token])

  useEffect(() => {
    if (!token) return undefined
    function onOpenFromPush() {
      navigate('/cliente/avisos')
    }
    window.addEventListener(OPEN_CUSTOMER_AVISOS_EVENT, onOpenFromPush)
    return () => window.removeEventListener(OPEN_CUSTOMER_AVISOS_EVENT, onOpenFromPush)
  }, [navigate, token])

  useEffect(() => {
    if (!token) return undefined
    return connectCustomerEvents(token, (notification) => {
      setPaymentNotifications((current) => current.some((item) => item.id === notification.id)
        ? current
        : [notification, ...current])
      if (!isCustomerAccountPath(window.location.pathname)) return
      void refreshCustomerOrders()
    }, () => {
      if (!isCustomerAccountPath(window.location.pathname)) return
      void refreshCustomerOrders()
      void loadPaymentNotifications({ silent: true })
    })
  }, [loadPaymentNotifications, refreshCustomerOrders, token])

  async function markPaymentNotificationRead(notification) {
    if (!notification || notification.read_at) return notification
    const updated = await markCustomerPaymentNotificationRead(token, notification.id)
    setPaymentNotifications((current) =>
      current.map((item) => (item.id === notification.id ? updated : item)),
    )
    return updated
  }

  async function handleMarkNotificationRead(notification) {
    try {
      await markPaymentNotificationRead(notification)
    } catch (cause) {
      setError(getUserFacingMessage(cause, 'No pudimos marcar el aviso como leído.'))
    }
  }

  async function handleMarkAllNotificationsRead() {
    try {
      await markAllCustomerPaymentNotificationsRead(token)
      const now = new Date().toISOString()
      setPaymentNotifications((current) =>
        current.map((item) => (item.read_at ? item : { ...item, read_at: now })),
      )
    } catch (cause) {
      setError(getUserFacingMessage(cause, 'No pudimos marcar los avisos como leídos.'))
    }
  }

  async function openPaymentNotification(notification) {
    try {
      await markPaymentNotificationRead(notification)
      const order = orders.find((item) => item.id === notification.order_id)
      if (order) setSelectedOrder(order)
      else if (notification.order_id) await load()
    } catch (cause) {
      setError(getUserFacingMessage(cause, 'No pudimos abrir el aviso.'))
    }
  }

  async function loadMoreOrders() {
    if (loadingMoreOrders || !ordersHasMore) return
    setLoadingMoreOrders(true)
    try {
      const page = await fetchCustomerOrders(token, { offset: orders.length, limit: CUSTOMER_ORDER_PAGE })
      applyCustomerOrders(page, { append: true })
    } catch (cause) {
      setError(getUserFacingMessage(cause, 'No pudimos cargar más pedidos.'))
    } finally {
      setLoadingMoreOrders(false)
    }
  }

  const unreadNotificationCount = paymentNotifications.filter((notification) => !notification.read_at).length

  useEffect(() => {
    window.dispatchEvent(new Event(CUSTOMER_NOTICES_EVENT))
  }, [paymentNotifications])

  const hasOrderWarning = ordersAttention || orders.some(needsBuyerOrderAttention)

  const value = {
    token,
    section,
    profile,
    setProfile,
    loading,
    error,
    setError,
    orders,
    ordersHasMore,
    loadingMoreOrders,
    loadMoreOrders,
    paymentNotifications,
    notificationsLoading,
    notificationsError,
    noticesHasMore,
    loadingMoreNotices,
    noticeDateFrom,
    setNoticeDateFrom,
    noticeDateTo,
    setNoticeDateTo,
    loadPaymentNotifications,
    handleMarkNotificationRead,
    handleMarkAllNotificationsRead,
    openPaymentNotification,
    unreadNotificationCount,
    favoriteProducts,
    setFavoriteProducts,
    selectedOrder,
    setSelectedOrder,
    hasOrderWarning,
    load,
    refreshVisibleSection,
  }

  return (
    <CustomerAccountContext.Provider value={value}>
      {children}
    </CustomerAccountContext.Provider>
  )
}

export function useCustomerAccount() {
  const value = useContext(CustomerAccountContext)
  if (!value) throw new Error('useCustomerAccount debe usarse dentro de la cuenta del cliente')
  return value
}

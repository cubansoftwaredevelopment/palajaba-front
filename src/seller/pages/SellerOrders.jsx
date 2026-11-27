import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useNavigate, useOutletContext, useSearchParams } from 'react-router-dom'
import SearchBar from '../../buyer/componentes/SearchBar.jsx'
import { monthPageShift } from '../../motion/presets'
import SellerEmptyState from '../componentes/SellerEmptyState.jsx'
import SellerManualOrderModal from '../componentes/SellerManualOrderModal.jsx'
import SellerOrderDetailModal from '../componentes/SellerOrderDetailModal.jsx'
import SellerOrderItem from '../componentes/SellerOrderItem.jsx'
import SellerOrdersGroup from '../componentes/SellerOrdersGroup.jsx'
import PillTabs from '../../shared/componentes/PillTabs.jsx'
import SellerNotificationToast from '../componentes/SellerNotificationToast.jsx'
import SellerPageHeader from '../componentes/SellerPageHeader.jsx'
import { useSellerReadOnly } from '../componentes/sellerReadOnly.js'
import StatePanel from '../../shared/componentes/StatePanel.jsx'
import LoadingState from '../../shared/componentes/LoadingState.jsx'
import { sellerBtnPrimaryCompact, sellerChip, sellerFocusRing, sellerPageWrap, sellerSectionGap } from '../componentes/sellerStyles.js'
import {
  createSellerManualOrder,
  deleteSellerOrder,
  downloadSellerOrderInvoice,
  fetchSellerOrders,
  updateSellerOrder,
} from '../../seller/api.js'
import { getSellerToken } from '../utils/sellerAuth.js'
import { runSectionRefresh } from '../../session/sectionStore'
import { useRegisterSectionRefresh } from '../../session/useSectionRefresh'
import { useSectionSnapshot } from '../../session/useSectionSnapshot'
import { SELLER_LIVE_POLL_MS } from '../../live/constants'
import { SELLER_ORDERS_REFRESH_EVENT } from '../utils/sellerOrdersRefresh.js'
import { getUserFacingMessage } from '../../shared/utils/userFacingError.js'
import { rangeForPeriod } from '../../admin/componentes/AdminDateRangeControls.jsx'
import { acceptSellerQvaPayOrder, refundSellerQvaPayOrder, rejectSellerQvaPayOrder, submitSellerOrderEvidence } from '../../auth/api.js'
import FilterModal from '../../shared/componentes/FilterModal.jsx'
import AssignCourierModal from '../../mensajeros/componentes/AssignCourierModal.jsx'
import { sellerHasMensajeros } from '../../subscriptions/utils/constants.js'
import { guardPlugin } from '../../subscriptions/utils/planPluginGate.js'
import { clearedDateFilter, countActiveFilters } from '../../shared/componentes/filterState.js'

const SELLER_ORDERS_PAGE_SIZE = 15

function isAssignableOrder(order) {
  return Boolean(order?.delivery_requested) && order.status !== 'cancelled' && !order.mensajeria
}

const ORDER_SEARCH_HINTS = [
  'buscar por cliente',
  'buscar por teléfono',
  'buscar por correo',
  'buscar por pedido',
]

function orderFilterDate(order, tab) {
  const value = tab === 'completed'
    ? order.completed_at ?? order.updated_at ?? order.created_at
    : order.created_at
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

function isInRange(order, tab, range) {
  if (!range?.from || !range?.to) return true
  const date = orderFilterDate(order, tab)
  if (!date) return false
  const from = new Date(range.from)
  from.setHours(0, 0, 0, 0)
  const to = new Date(range.to)
  to.setHours(23, 59, 59, 999)
  return date >= from && date <= to
}

function normalizeClientLabel(value) {
  return String(value || '').trim().replace(/\s+/g, ' ').toLocaleLowerCase('es')
}

function orderIdentifier(order) {
  return String(order?.id ?? '').slice(-6).toUpperCase()
}

function getOrderClientLabels(order) {
  return [...new Set([
    order.buyer_name,
    order.delivery?.recipient_name,
    order.buyer_phone,
    order.delivery?.phone_primary,
  ].map((value) => String(value || '').trim().replace(/\s+/g, ' ')).filter(Boolean))]
}

const PendingIcon = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 6v6l4 2" />
  </svg>
)

const CompletedIcon = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
    <path d="M20 6 9 17l-5-5" />
  </svg>
)

const EmptyOrdersIcon = (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
    <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
    <path d="M3 6h18M16 10a4 4 0 0 1-8 0" />
  </svg>
)

export default function SellerOrders() {
  const { profile } = useOutletContext()
  const navigate = useNavigate()
  const canAssignCouriers = sellerHasMensajeros(profile)
  const readOnly = useSellerReadOnly()
  const [searchParams, setSearchParams] = useSearchParams()
  const orderSearchTarget = searchParams.get('search')?.trim() ?? ''
  const { snapshot, commit, skipInitialRef } = useSectionSnapshot('seller', 'orders')
  const cachedOrders = snapshot?.data
  const [orders, setOrders] = useState(cachedOrders?.items ?? [])
  const [ordersHasMore, setOrdersHasMore] = useState(cachedOrders?.hasMore ?? false)
  const [orderStatusCounts, setOrderStatusCounts] = useState(cachedOrders?.counts ?? { pending: 0, completed: 0 })
  const [loadingMoreOrders, setLoadingMoreOrders] = useState(false)
  const loadedOrdersCount = useRef(cachedOrders?.loadedCount ?? cachedOrders?.items?.length ?? 0)
  const [loading, setLoading] = useState(!cachedOrders)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('pending')
  const [tabDirection, setTabDirection] = useState(1)
  const [tabMotion, setTabMotion] = useState(false)
  const reducedMotion = useReducedMotion()
  const [tabInitialized, setTabInitialized] = useState(Boolean(cachedOrders))
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [saving, setSaving] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [downloading, setDownloading] = useState(null)
  const [saveError, setSaveError] = useState('')
  const [notice, setNotice] = useState(null)
  const [manualOrderOpen, setManualOrderOpen] = useState(false)
  const [search, setSearch] = useState(() => orderSearchTarget)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [clientFilter, setClientFilter] = useState('')
  const [productFilters, setProductFilters] = useState([])
  const [currencyFilter, setCurrencyFilter] = useState('')
  const [deliveryFilter, setDeliveryFilter] = useState('')
  const [datePeriod, setDatePeriod] = useState('daily')
  const [dateRange, setDateRange] = useState(() => rangeForPeriod('daily'))
  const [dateFilterEnabled, setDateFilterEnabled] = useState(false)
  const [resultFilter, setResultFilter] = useState('')
  const [selectingOrders, setSelectingOrders] = useState(false)
  const [selectedOrderIds, setSelectedOrderIds] = useState([])
  const [assignOpen, setAssignOpen] = useState(false)
  const [assignNotice, setAssignNotice] = useState('')

  const loadOrders = useCallback(async ({ silent = false } = {}) => {
    if (!silent) {
      setLoading(true)
      setError('')
    }

    try {
      const token = getSellerToken()
      const data = await fetchSellerOrders(token, {
        offset: 0,
        limit: silent ? Math.max(SELLER_ORDERS_PAGE_SIZE, Math.min(loadedOrdersCount.current, 100)) : SELLER_ORDERS_PAGE_SIZE,
      })
      loadedOrdersCount.current = data.items.length
      setOrders(data.items)
      setOrdersHasMore(data.has_more)
      setOrderStatusCounts({ pending: data.pending_count ?? 0, completed: data.completed_count ?? 0 })
      setSelectedOrder((current) =>
        current ? data.items.find((order) => order.id === current.id) ?? null : null,
      )
    } catch (err) {
      if (!silent) {
        loadedOrdersCount.current = 0
        setOrders([])
        setOrdersHasMore(false)
        setError(getUserFacingMessage(err, 'No pudimos cargar los pedidos. Inténtalo de nuevo.'))
      }
    } finally {
      if (!silent) {
        setLoading(false)
      }
    }
  }, [])

  const loadMoreOrders = useCallback(async () => {
    if (loadingMoreOrders || !ordersHasMore) return
    setLoadingMoreOrders(true)
    try {
      const data = await fetchSellerOrders(getSellerToken(), { offset: loadedOrdersCount.current, limit: SELLER_ORDERS_PAGE_SIZE })
      loadedOrdersCount.current += data.items.length
      setOrders((current) => [...current, ...data.items])
      setOrdersHasMore(data.has_more)
    } catch (err) {
      setError(getUserFacingMessage(err, 'No pudimos cargar más pedidos. Inténtalo de nuevo.'))
    } finally {
      setLoadingMoreOrders(false)
    }
  }, [loadingMoreOrders, ordersHasMore])

  useEffect(() => {
    if (skipInitialRef.current) return
    loadOrders()
  }, [loadOrders])

  useEffect(() => {
    if (loading && orders.length === 0) return
    commit({
      items: orders,
      hasMore: ordersHasMore,
      counts: orderStatusCounts,
      loadedCount: loadedOrdersCount.current,
    })
  }, [orders, ordersHasMore, orderStatusCounts, loading, commit])

  useRegisterSectionRefresh(() => runSectionRefresh('seller', 'orders', () => loadOrders({ silent: true })))

  useEffect(() => {
    function refreshSilently() {
      loadOrders({ silent: true })
    }

    function handleVisible() {
      if (document.visibilityState === 'visible') {
        refreshSilently()
      }
    }

    window.addEventListener(SELLER_ORDERS_REFRESH_EVENT, refreshSilently)
    const intervalId = window.setInterval(refreshSilently, SELLER_LIVE_POLL_MS)
    document.addEventListener('visibilitychange', handleVisible)

    return () => {
      window.removeEventListener(SELLER_ORDERS_REFRESH_EVENT, refreshSilently)
      window.clearInterval(intervalId)
      document.removeEventListener('visibilitychange', handleVisible)
    }
  }, [loadOrders])

  const { pendingOrders, completedOrders } = useMemo(() => {
    const pending = []
    const completed = []

    for (const order of orders) {
      if (order.status === 'completed' || order.status === 'cancelled') {
        completed.push(order)
      } else {
        pending.push(order)
      }
    }

    return { pendingOrders: pending, completedOrders: completed }
  }, [orders])

  useEffect(() => {
    if (loading || tabInitialized || error) return
    if (orderSearchTarget && ordersHasMore && !orders.some((order) => orderIdentifier(order).toLocaleLowerCase('es') === orderSearchTarget.toLocaleLowerCase('es'))) {
      loadMoreOrders()
      return
    }
    const targetOrder = orderSearchTarget
      ? orders.find((order) => orderIdentifier(order).toLocaleLowerCase('es') === orderSearchTarget.toLocaleLowerCase('es'))
      : null
    setActiveTab(targetOrder
      ? (targetOrder.status === 'completed' || targetOrder.status === 'cancelled' ? 'completed' : 'pending')
      : pendingOrders.length > 0 ? 'pending' : 'completed')
    setTabInitialized(true)
  }, [loading, tabInitialized, pendingOrders.length, orders, orderSearchTarget, ordersHasMore, loadMoreOrders, error])

  const visibleOrders = useMemo(() => {
    const tabOrders = activeTab === 'pending' ? pendingOrders : completedOrders
    const query = search.trim().toLocaleLowerCase('es')
    return tabOrders.filter((order) => {
      const clientLabels = getOrderClientLabels(order)
      const searchable = [...clientLabels, order.buyer_email, orderIdentifier(order)]
        .filter(Boolean).join(' ').toLocaleLowerCase('es')
      if (query && !searchable.includes(query)) return false
      if (clientFilter && !clientLabels.some((label) => normalizeClientLabel(label) === normalizeClientLabel(clientFilter))) return false
      if (productFilters.length && !order.items?.some((item) => productFilters.includes(item.name))) return false
      if (currencyFilter && order.payment_currency !== currencyFilter) return false
      if (deliveryFilter === 'yes' && !order.delivery_requested) return false
      if (deliveryFilter === 'no' && order.delivery_requested) return false
      if (activeTab === 'completed' && resultFilter && order.status !== resultFilter) return false
      const exactOrderMatch = orderIdentifier(order).toLocaleLowerCase('es') === query
      return exactOrderMatch || !dateFilterEnabled || isInRange(order, activeTab, dateRange)
    })
  }, [activeTab, pendingOrders, completedOrders, search, clientFilter, productFilters, currencyFilter, deliveryFilter, dateRange, dateFilterEnabled, resultFilter])

  const tabRemaining = Math.max(
    0,
    (activeTab === 'pending' ? orderStatusCounts.pending : orderStatusCounts.completed) - (activeTab === 'pending' ? pendingOrders.length : completedOrders.length),
  )
  const nextPageCount = Math.min(SELLER_ORDERS_PAGE_SIZE, tabRemaining)

  const filterOptions = useMemo(() => {
    const allOrders = [...pendingOrders, ...completedOrders]
    return {
      clients: [...new Map(allOrders.flatMap(getOrderClientLabels).map((label) => [normalizeClientLabel(label), label])).values()].sort((a, b) => a.localeCompare(b, 'es')),
      products: [...new Set(allOrders.flatMap((order) => (order.items || []).map((item) => item.name).filter(Boolean)))].sort((a, b) => a.localeCompare(b, 'es')),
      currencies: [...new Set(allOrders.map((order) => order.payment_currency).filter(Boolean))].sort(),
    }
  }, [pendingOrders, completedOrders])

  const orderFilterValues = {
    client: clientFilter,
    products: productFilters,
    currency: currencyFilter,
    delivery: deliveryFilter,
    datePeriod,
    dateRange,
    dateEnabled: dateFilterEnabled,
  }
  const emptyOrderFilters = {
    client: '',
    products: [],
    currency: '',
    delivery: '',
    ...clearedDateFilter(),
  }

  function updateOrderFilters(next) {
    setClientFilter(next.client)
    setProductFilters(next.products)
    setCurrencyFilter(next.currency)
    setDeliveryFilter(next.delivery)
    setDatePeriod(next.datePeriod)
    setDateRange(next.dateRange)
    setDateFilterEnabled(next.dateEnabled)
  }

  async function handleDownloadInvoice(type) {
    if (!selectedOrder) return

    setDownloading(type)
    setSaveError('')

    try {
      const token = getSellerToken()
      await downloadSellerOrderInvoice(token, selectedOrder.id, type)
    } catch (err) {
      setSaveError(getUserFacingMessage(err, 'No pudimos generar la factura. Inténtalo de nuevo.'))
    } finally {
      setDownloading(null)
    }
  }

  async function handleCancelOrder() {
    if (!selectedOrder) return

    setCancelling(true)
    setSaveError('')

    try {
      const token = getSellerToken()
      await deleteSellerOrder(token, selectedOrder.id)
      setOrders((current) => current.filter((item) => item.id !== selectedOrder.id))
      loadedOrdersCount.current = Math.max(0, loadedOrdersCount.current - 1)
      setOrderStatusCounts((current) => ({
        ...current,
        [selectedOrder.status === 'completed' ? 'completed' : 'pending']: Math.max(0, current[selectedOrder.status === 'completed' ? 'completed' : 'pending'] - 1),
      }))
      setSelectedOrder(null)
    } catch (err) {
      setSaveError(getUserFacingMessage(err, 'No pudimos cancelar el pedido. Inténtalo de nuevo.'))
    } finally {
      setCancelling(false)
    }
  }

  async function handleSaveOrder(payload) {
    if (!selectedOrder) return

    setSaving(true)
    setSaveError('')

    try {
      const token = getSellerToken()
      const updated = await updateSellerOrder(token, selectedOrder.id, payload)
      setOrders((current) => current.map((item) => (item.id === updated.id ? updated : item)))
      setSelectedOrder(updated)

      if (selectedOrder.status !== updated.status) {
        setOrderStatusCounts((current) => ({
          pending: Math.max(0, current.pending + (updated.status === 'pending_confirmation' || updated.status === 'in_transit' ? 1 : 0) - (selectedOrder.status === 'pending_confirmation' || selectedOrder.status === 'in_transit' ? 1 : 0)),
          completed: Math.max(0, current.completed + (updated.status === 'completed' ? 1 : 0) - (selectedOrder.status === 'completed' ? 1 : 0)),
        }))
      }

      if (updated.status === 'completed') {
        selectTab('completed')
      }
    } catch (err) {
      setSaveError(getUserFacingMessage(err, 'No pudimos actualizar el pedido. Inténtalo de nuevo.'))
    } finally {
      setSaving(false)
    }
  }

  async function handleCreateManualOrder(payload) {
    try {
      const token = getSellerToken()
      const created = await createSellerManualOrder(token, payload)
      setOrders((current) => [created, ...current])
      loadedOrdersCount.current += 1
      setOrderStatusCounts((current) => ({ ...current, pending: current.pending + 1 }))
      selectTab('pending')
      setSelectedOrder(created)
    } catch (err) {
      throw new Error(getUserFacingMessage(err, 'No pudimos registrar el pedido.'))
    }
  }

  async function handleQvaAccept(payload) {
    if (!selectedOrder) return
    setSaving(true); setSaveError('')
    try {
      await acceptSellerQvaPayOrder(getSellerToken(), selectedOrder.id, payload)
      await loadOrders({ silent: true })
      setNotice({
        id: `${Date.now()}`,
        title: 'La factura QvaPay se envió al cliente.',
      })
    } catch (err) {
      setSaveError(getUserFacingMessage(err, 'No pudimos aceptar el pago QvaPay.'))
    } finally { setSaving(false) }
  }

  async function handleQvaRefund(payload) {
    if (!selectedOrder) return
    setSaving(true); setSaveError('')
    try {
      await refundSellerQvaPayOrder(getSellerToken(), selectedOrder.id, payload)
      await loadOrders({ silent: true })
    } catch (err) {
      setSaveError(getUserFacingMessage(err, 'No pudimos reembolsar al comprador.'))
      throw err
    } finally { setSaving(false) }
  }

  async function handleQvaReject() {
    if (!selectedOrder) return
    setCancelling(true); setSaveError('')
    try {
      await rejectSellerQvaPayOrder(getSellerToken(), selectedOrder.id)
      setOrders((current) => current.filter((order) => order.id !== selectedOrder.id))
      setSelectedOrder(null)
      setOrderStatusCounts((current) => ({ ...current, pending: Math.max(0, current.pending - 1) }))
    } catch (err) {
      setSaveError(getUserFacingMessage(err, 'No pudimos rechazar el pedido.'))
    } finally { setCancelling(false) }
  }

  async function handleSubmitEvidence(content) {
    if (!selectedOrder) return
    setSaving(true); setSaveError('')
    try {
      await submitSellerOrderEvidence(getSellerToken(), selectedOrder.id, content)
      await loadOrders({ silent: true })
    } catch (err) {
      setSaveError(getUserFacingMessage(err, 'No pudimos enviar la evidencia.'))
      throw err
    } finally { setSaving(false) }
  }

  function selectTab(next) {
    if (next === activeTab) return
    setTabDirection(next === 'pending' ? -1 : 1)
    setTabMotion(true)
    setActiveTab(next)
  }

  const tabShift = monthPageShift(tabDirection, reducedMotion || !tabMotion)

  return (
    <section className={`${sellerPageWrap} ${sellerSectionGap}`}>
      <SellerPageHeader
        eyebrow="Pedidos"
        action={readOnly ? null : (
          <button
            type="button"
            className={sellerBtnPrimaryCompact}
            onClick={() => { if (!guardPlugin(profile, 'manual_orders', navigate)) setManualOrderOpen(true) }}
          >
            Registrar venta
          </button>
        )}
      />

      {loading ? (
        <LoadingState message="Cargando pedidos…" />
      ) : null}

      {!loading && error ? (
        <StatePanel
          variant="seller"
          title="No se pudieron cargar los pedidos"
          message={error}
          serviceError
          onRetry={loadOrders}
          retrying={loading}
        />
      ) : null}

      {!loading && !error && orders.length === 0 ? (
        <SellerEmptyState
          icon={EmptyOrdersIcon}
          title="Sin pedidos por ahora"
          description="Cuando un cliente solicite un pedido desde Pa' La Jaba, aparecerá en la pestaña Por procesar."
          badge={null}
        />
      ) : null}

      {!loading && !error && orders.length > 0 ? (
        <>
          <PillTabs
            ariaLabel="Tipo de pedidos"
            value={activeTab}
            onChange={selectTab}
            className="mb-4 shadow-[0_2px_10px_rgba(89,128,44,0.05)]"
            options={[
              {
                id: 'pending',
                label: 'Por procesar',
                badge: orderStatusCounts.pending,
                badgeClassName: (selected) => (
                  selected
                    ? 'bg-brand-yellow/30 text-brand-carmelita'
                    : 'bg-brand-yellow/15 text-brand-carmelita/80'
                ),
              },
              { id: 'completed', label: 'Realizadas', badge: orderStatusCounts.completed },
            ]}
          />

          <div className="mb-3">
            <SearchBar
              id="seller-orders-search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              onClear={() => {
                setSearch('')
                if (searchParams.has('search')) {
                  const nextParams = new URLSearchParams(searchParams)
                  nextParams.delete('search')
                  setSearchParams(nextParams, { replace: true })
                }
              }}
              label="Buscar pedidos"
              phrases={ORDER_SEARCH_HINTS}
              filter={{
                count: countActiveFilters(orderFilterValues, ['client', 'products', 'currency', 'delivery']),
                label: 'Filtrar pedidos',
                expanded: filtersOpen,
                onClick: () => setFiltersOpen(true),
              }}
            />
          </div>

          <div className="relative overflow-x-clip">
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.div key={activeTab} className={tabMotion && !reducedMotion ? 'screen-step' : ''} {...tabShift}>
          {activeTab === 'completed' ? (
            <div className="mb-3 flex flex-wrap gap-2" role="group" aria-label="Filtrar pedidos realizados">
              {[
                { id: '', label: 'Todos' },
                { id: 'completed', label: 'Realizados' },
                { id: 'cancelled', label: 'Cancelados' },
              ].map((option) => (
                <button
                  key={option.id || 'all'}
                  type="button"
                  aria-pressed={resultFilter === option.id}
                  onClick={() => setResultFilter(option.id)}
                  className={`${sellerChip(resultFilter === option.id)} min-h-9 px-3.5 ${sellerFocusRing}`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          ) : null}

          {activeTab === 'pending' ? (
            <div className="mb-3 flex flex-wrap items-center justify-end gap-2">
              {selectingOrders ? (
                <button type="button" className="min-h-10 rounded-full border border-brand-green/20 px-4 text-sm font-semibold text-brand-green" onClick={() => { setSelectingOrders(false); setSelectedOrderIds([]); setAssignNotice('') }}>Cancelar</button>
              ) : null}
              <button
                type="button"
                className={`${sellerBtnPrimaryCompact} !w-auto !min-w-0`}
                disabled={readOnly || !visibleOrders.some(isAssignableOrder)}
                onClick={() => {
                  if (!canAssignCouriers || guardPlugin(profile, 'mensajeros', navigate)) return
                  const selected = orders.filter((order) => selectedOrderIds.includes(order.id))
                  if (selected.length === 0) {
                    setSelectingOrders(true)
                    setAssignNotice('Presiona sobre un pedido con domicilio para seleccionarlo.')
                    return
                  }
                  const unpaid = selected.some((order) => order.payment_method === 'qvapay' && order.qvapay?.payment_status !== 'paid')
                  if (unpaid) {
                    setAssignNotice('El cliente todavía no pagó este pedido por QvaPay.')
                    return
                  }
                  setAssignNotice('')
                  setAssignOpen(true)
                }}
              >
                Asignar a
              </button>
            </div>
          ) : null}

          {assignNotice ? <p role="alert" className="mb-3 rounded-xl bg-brand-carmelita/10 px-3 py-2 text-sm font-semibold text-brand-carmelita">{assignNotice}</p> : null}

          <SellerOrdersGroup
            count={visibleOrders.length}
            emptyIcon={activeTab === 'pending' ? PendingIcon : CompletedIcon}
            emptyTitle={
              activeTab === 'pending'
                ? 'Nada pendiente'
                : resultFilter === 'cancelled'
                  ? 'Sin pedidos cancelados'
                  : resultFilter === 'completed'
                    ? 'Sin pedidos realizados'
                    : 'Aún sin ventas cerradas'
            }
            emptyDescription={
              activeTab === 'pending'
                ? 'Cuando llegue un pedido nuevo desde la jaba, lo verás en esta pestaña.'
                : resultFilter === 'cancelled'
                  ? 'Los pedidos cancelados de esta pestaña aparecerán aquí.'
                  : resultFilter === 'completed'
                    ? 'Los pedidos marcados como realizados aparecerán aquí.'
                    : 'Al marcar un pedido como realizado, aparecerá aquí.'
            }
          >
            {visibleOrders.map((order) => (
              <SellerOrderItem
                key={order.id}
                order={order}
                variant={activeTab === 'pending' ? 'pending' : 'completed'}
                selecting={selectingOrders && activeTab === 'pending'}
                selected={selectedOrderIds.includes(order.id)}
                onLongPress={(item) => {
                  if (!canAssignCouriers) {
                    guardPlugin(profile, 'mensajeros', navigate)
                    return
                  }
                  if (item.payment_method === 'qvapay' && item.qvapay?.payment_status !== 'paid') {
                    setAssignNotice('El cliente todavía no pagó este pedido por QvaPay.')
                    return
                  }
                  if (activeTab !== 'pending' || !item.delivery_requested || item.status === 'cancelled' || item.mensajeria) return
                  setAssignNotice('')
                  setSelectingOrders(true)
                  setSelectedOrderIds((current) => current.includes(item.id) ? current : [...current, item.id])
                }}
                onToggle={(item) => {
                  if (!canAssignCouriers) {
                    guardPlugin(profile, 'mensajeros', navigate)
                    return
                  }
                  if (item.payment_method === 'qvapay' && item.qvapay?.payment_status !== 'paid') {
                    setAssignNotice('El cliente todavía no pagó este pedido por QvaPay.')
                    return
                  }
                  if (!item.delivery_requested || item.status === 'cancelled' || item.mensajeria) return
                  setAssignNotice('')
                  setSelectedOrderIds((current) => current.includes(item.id) ? current.filter((id) => id !== item.id) : [...current, item.id])
                }}
                onOpen={setSelectedOrder}
              />
            ))}
          </SellerOrdersGroup>
          {ordersHasMore && nextPageCount > 0 ? (
            <div className="mt-4 flex justify-center">
              <button type="button" onClick={loadMoreOrders} disabled={loadingMoreOrders} className="min-h-11 rounded-xl border border-brand-green/20 bg-brand-white px-5 text-sm font-semibold text-brand-green disabled:opacity-60">
                {loadingMoreOrders ? 'Cargando…' : `Cargar ${nextPageCount} pedido${nextPageCount === 1 ? '' : 's'} más`}
              </button>
            </div>
          ) : null}
              </motion.div>
            </AnimatePresence>
          </div>

          <FilterModal
            open={filtersOpen}
            onClose={() => setFiltersOpen(false)}
            title="Filtrar pedidos"
            description="Combina los criterios que quieras aplicar."
            titleId="seller-order-filters-title"
            applyLabel="Ver pedidos"
            fields={[
              { key: 'client', label: 'Cliente', placeholder: 'Todos los clientes', options: filterOptions.clients },
              { key: 'products', label: 'Productos · selección múltiple', placeholder: 'Todos los productos', options: filterOptions.products, multiple: true },
              { key: 'currency', label: 'Moneda', placeholder: 'Todas las monedas', options: filterOptions.currencies },
              { key: 'delivery', label: 'Domicilio', placeholder: 'Todos', options: [{ value: 'yes', label: 'Sí' }, { value: 'no', label: 'No' }] },
            ]}
            values={orderFilterValues}
            onValuesChange={updateOrderFilters}
            dateLabel="Fecha del pedido"
            emptyValues={emptyOrderFilters}
          />
        </>
      ) : null}

      {assignOpen ? (
        <AssignCourierModal
          orders={orders.filter((order) => selectedOrderIds.includes(order.id))}
          onClose={() => setAssignOpen(false)}
          onDone={() => {
            setAssignOpen(false)
            setSelectingOrders(false)
            setSelectedOrderIds([])
            loadOrders()
          }}
        />
      ) : null}

      {manualOrderOpen ? (
        <SellerManualOrderModal
          onClose={() => setManualOrderOpen(false)}
          onCreated={handleCreateManualOrder}
        />
      ) : null}

      {notice && typeof document !== 'undefined'
        ? createPortal(
          <SellerNotificationToast
            toast={notice}
            placement="top"
            className="!z-[320]"
            onDone={() => setNotice(null)}
          />,
          document.body,
        )
        : null}

      {selectedOrder ? (
        <SellerOrderDetailModal
          order={selectedOrder}
          saving={saving}
          cancelling={cancelling}
          downloading={downloading}
          error={saveError}
          onClose={() => {
            setSelectedOrder(null)
            setSaveError('')
            setDownloading(null)
          }}
          onSave={handleSaveOrder}
          onCancel={handleCancelOrder}
          onDownloadInvoice={handleDownloadInvoice}
          onQvaAccept={handleQvaAccept}
          onQvaReject={handleQvaReject}
          onQvaRefund={handleQvaRefund}
          onSubmitEvidence={handleSubmitEvidence}
          onAssignmentCancelled={() => {
            setSelectedOrder(null)
            loadOrders()
          }}
        />
      ) : null}

    </section>
  )
}

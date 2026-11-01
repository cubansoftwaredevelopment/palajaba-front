import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import SellerEmptyState from '../../components/seller/SellerEmptyState'
import SellerManualOrderModal from '../../components/seller/SellerManualOrderModal'
import SellerOrderDetailModal from '../../components/seller/SellerOrderDetailModal'
import SellerOrderItem from '../../components/seller/SellerOrderItem'
import SellerOrdersGroup from '../../components/seller/SellerOrdersGroup'
import SellerOrdersTabs from '../../components/seller/SellerOrdersTabs'
import SellerPageHeader from '../../components/seller/SellerPageHeader'
import SellerFilterDropdown from '../../components/seller/SellerFilterDropdown'
import StatePanel from '../../components/ui/StatePanel'
import LoadingState from '../../components/ui/LoadingState'
import { sellerBtnPrimaryCompact, sellerPageWrap, sellerSectionGap } from '../../components/seller/sellerStyles'
import {
  createSellerManualOrder,
  deleteSellerOrder,
  downloadSellerOrderInvoice,
  fetchSellerOrders,
  updateSellerOrder,
} from '../../lib/api'
import { getSellerToken } from '../../lib/sellerAuth'
import { SELLER_LIVE_POLL_MS } from '../../live/constants'
import { SELLER_ORDERS_REFRESH_EVENT } from '../../lib/sellerOrdersRefresh'
import { getUserFacingMessage } from '../../lib/userFacingError'
import AdminDateRangeControls, { rangeForPeriod } from '../../components/admin/AdminDateRangeControls'
import SellerModalPortal from '../../components/seller/SellerModalPortal'
import { orderModalMotionClass, useOrderModalPresence } from '../../buyer/components/useOrderModalPresence'
import { sellerModalOverlay, sellerModalSheet } from '../../components/seller/sellerStyles'

const SELLER_ORDERS_PAGE_SIZE = 15

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
  const [searchParams, setSearchParams] = useSearchParams()
  const orderSearchTarget = searchParams.get('search')?.trim() ?? ''
  const [orders, setOrders] = useState([])
  const [ordersHasMore, setOrdersHasMore] = useState(false)
  const [orderStatusCounts, setOrderStatusCounts] = useState({ pending: 0, completed: 0 })
  const [loadingMoreOrders, setLoadingMoreOrders] = useState(false)
  const loadedOrdersCount = useRef(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('pending')
  const [tabInitialized, setTabInitialized] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [saving, setSaving] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [downloading, setDownloading] = useState(null)
  const [saveError, setSaveError] = useState('')
  const [manualOrderOpen, setManualOrderOpen] = useState(false)
  const [search, setSearch] = useState(() => orderSearchTarget)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const { present: filtersPresent, closing: filtersClosing } = useOrderModalPresence(filtersOpen)
  const [clientFilter, setClientFilter] = useState('')
  const [productFilters, setProductFilters] = useState([])
  const [currencyFilter, setCurrencyFilter] = useState('')
  const [deliveryFilter, setDeliveryFilter] = useState('')
  const [datePeriod, setDatePeriod] = useState('daily')
  const [dateRange, setDateRange] = useState(() => rangeForPeriod('daily'))
  const [dateFilterEnabled, setDateFilterEnabled] = useState(false)

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
    loadOrders()
  }, [loadOrders])

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
      if (order.status === 'completed') {
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
      ? targetOrder.status === 'completed' ? 'completed' : 'pending'
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
      const exactOrderMatch = orderIdentifier(order).toLocaleLowerCase('es') === query
      return exactOrderMatch || !dateFilterEnabled || isInRange(order, activeTab, dateRange)
    })
  }, [activeTab, pendingOrders, completedOrders, search, clientFilter, productFilters, currencyFilter, deliveryFilter, dateRange, dateFilterEnabled])

  const filterOptions = useMemo(() => {
    const allOrders = [...pendingOrders, ...completedOrders]
    return {
      clients: [...new Map(allOrders.flatMap(getOrderClientLabels).map((label) => [normalizeClientLabel(label), label])).values()].sort((a, b) => a.localeCompare(b, 'es')),
      products: [...new Set(allOrders.flatMap((order) => (order.items || []).map((item) => item.name).filter(Boolean)))].sort((a, b) => a.localeCompare(b, 'es')),
      currencies: [...new Set(allOrders.map((order) => order.payment_currency).filter(Boolean))].sort(),
    }
  }, [pendingOrders, completedOrders])

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
          pending: Math.max(0, current.pending + (updated.status === 'pending_confirmation' ? 1 : 0) - (selectedOrder.status === 'pending_confirmation' ? 1 : 0)),
          completed: Math.max(0, current.completed + (updated.status === 'completed' ? 1 : 0) - (selectedOrder.status === 'completed' ? 1 : 0)),
        }))
      }

      if (updated.status === 'completed') {
        setActiveTab('completed')
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
      setActiveTab('pending')
      setSelectedOrder(created)
    } catch (err) {
      throw new Error(getUserFacingMessage(err, 'No pudimos registrar el pedido.'))
    }
  }

  return (
    <section className={`animate-fade-in ${sellerPageWrap} ${sellerSectionGap}`}>
      <SellerPageHeader
        eyebrow="Pedidos"
        title="Bandeja de pedidos"
        subtitle="Usa las pestañas para alternar entre pendientes y ventas ya cerradas."
        action={(
          <button
            type="button"
            className={sellerBtnPrimaryCompact}
            onClick={() => setManualOrderOpen(true)}
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
          description="Cuando un cliente pida por WhatsApp desde Pa' La Jaba, aparecerá en la pestaña Por confirmar."
          badge={null}
        />
      ) : null}

      {!loading && !error && orders.length > 0 ? (
        <>
          <SellerOrdersTabs
            activeTab={activeTab}
            onTabChange={setActiveTab}
            pendingCount={orderStatusCounts.pending}
            completedCount={orderStatusCounts.completed}
          />

          <div className="mb-3 flex">
            <div className="relative min-w-0 flex-1">
              <label>
                <span className="sr-only">Buscar pedidos</span>
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Buscar por cliente, teléfono, correo o pedido"
                  className="min-h-11 w-full rounded-xl border border-brand-green/15 bg-brand-white py-2 pl-11 pr-24 text-sm text-brand-carmelita placeholder:text-brand-carmelita/45 focus:border-brand-green/40 focus:outline-none focus:ring-2 focus:ring-brand-green/15"
                />
              </label>
              {search ? (
                <button
                  type="button"
                  onClick={() => {
                    setSearch('')
                    if (searchParams.has('search')) {
                      const nextParams = new URLSearchParams(searchParams)
                      nextParams.delete('search')
                      setSearchParams(nextParams, { replace: true })
                    }
                  }}
                  aria-label="Limpiar búsqueda"
                  title="Limpiar búsqueda"
                  className="absolute left-1.5 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-brand-carmelita/60 transition hover:bg-brand-green/8 hover:text-brand-green focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green/25"
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                    <path d="m6 6 12 12M18 6 6 18" />
                  </svg>
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => setFiltersOpen((value) => !value)}
                aria-expanded={filtersOpen}
                aria-label="Filtrar pedidos"
                title="Filtrar pedidos"
                className="absolute right-1.5 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-lg border border-brand-green/15 bg-brand-white text-brand-green shadow-sm"
              >
                <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 5h16l-6.2 7v5l-3.6 2v-7L4 5Z" /></svg>
                {[clientFilter, ...productFilters, currencyFilter, deliveryFilter].filter(Boolean).length + (dateFilterEnabled ? 1 : 0) ? <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-brand-green px-1 text-[9px] font-bold leading-none text-white">{[clientFilter, ...productFilters, currencyFilter, deliveryFilter].filter(Boolean).length + (dateFilterEnabled ? 1 : 0)}</span> : null}
              </button>
            </div>
          </div>

          {filtersPresent ? (
            <SellerModalPortal>
              <div
                className={`${sellerModalOverlay} ${orderModalMotionClass(filtersClosing)}`}
                role="presentation"
                onMouseDown={(event) => {
                  if (event.target === event.currentTarget) setFiltersOpen(false)
                }}
              >
                <section
                  className={`${sellerModalSheet} h-auto max-h-[80dvh] max-w-2xl overflow-visible`}
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="seller-order-filters-title"
                >
                  <header className="flex items-center justify-between border-b border-brand-green/10 px-5 py-4">
                    <div>
                      <h2 id="seller-order-filters-title" className="font-display text-lg font-bold text-brand-green">Filtrar pedidos</h2>
                      <p className="mt-1 text-xs text-brand-carmelita/75">Combina los criterios que quieras aplicar.</p>
                    </div>
                    <button type="button" onClick={() => setFiltersOpen(false)} aria-label="Cerrar filtros" className="grid h-10 w-10 place-items-center rounded-full text-xl text-brand-carmelita/60 hover:bg-brand-green/5">×</button>
                  </header>
                  <div className="grid flex-1 gap-4 overflow-y-auto p-5 sm:grid-cols-2">
                    <SellerFilterDropdown label="Cliente" placeholder="Todos los clientes" options={filterOptions.clients} value={clientFilter} onChange={setClientFilter} />
                    <SellerFilterDropdown label="Productos · selección múltiple" placeholder="Todos los productos" options={filterOptions.products} value={productFilters} onChange={setProductFilters} multiple />
                    <SellerFilterDropdown label="Moneda" placeholder="Todas las monedas" options={filterOptions.currencies} value={currencyFilter} onChange={setCurrencyFilter} />
                    <SellerFilterDropdown label="Domicilio" placeholder="Todos" options={['Sí', 'No']} value={deliveryFilter === 'yes' ? 'Sí' : deliveryFilter === 'no' ? 'No' : ''} onChange={(value) => setDeliveryFilter(value === 'Sí' ? 'yes' : value === 'No' ? 'no' : '')} />
                    <div className="sm:col-span-2">
                      <p className="mb-2 text-xs font-semibold text-brand-green">Fecha del pedido</p>
                      <AdminDateRangeControls
                        inline
                        period={datePeriod}
                        onPeriodChange={(period) => { setDatePeriod(period); setDateFilterEnabled(true) }}
                        range={dateRange}
                        onRangeChange={(nextRange, nextPeriod) => {
                          if (nextRange) {
                            setDateRange(nextRange)
                            setDatePeriod(nextPeriod || 'custom')
                            setDateFilterEnabled(true)
                          } else {
                            setDatePeriod('daily')
                            setDateRange(rangeForPeriod('daily'))
                            setDateFilterEnabled(false)
                          }
                        }}
                        applyPeriodToRange
                      />
                    </div>
                  </div>
                  <footer className="flex justify-between gap-3 border-t border-brand-green/10 p-4">
                    <button type="button" onClick={() => { setClientFilter(''); setProductFilters([]); setCurrencyFilter(''); setDeliveryFilter(''); setDatePeriod('daily'); setDateRange(rangeForPeriod('daily')); setDateFilterEnabled(false) }} className="min-h-10 rounded-xl border border-brand-green/15 px-4 text-sm font-semibold text-brand-green">Limpiar filtros</button>
                    <button type="button" onClick={() => setFiltersOpen(false)} className="min-h-10 rounded-xl bg-brand-green px-5 text-sm font-semibold text-white">Ver pedidos</button>
                  </footer>
                </section>
              </div>
            </SellerModalPortal>
          ) : null}

          <SellerOrdersGroup
            tone={activeTab === 'pending' ? 'pending' : 'completed'}
            count={visibleOrders.length}
            emptyIcon={activeTab === 'pending' ? PendingIcon : CompletedIcon}
            emptyTitle={activeTab === 'pending' ? 'Nada pendiente' : 'Aún sin ventas cerradas'}
            emptyDescription={
              activeTab === 'pending'
                ? 'Cuando llegue un pedido nuevo desde la jaba, lo verás en esta pestaña.'
                : 'Al marcar un pedido como realizado, aparecerá aquí.'
            }
          >
            {visibleOrders.map((order) => (
              <SellerOrderItem
                key={order.id}
                order={order}
                variant={activeTab === 'pending' ? 'pending' : 'completed'}
                onOpen={setSelectedOrder}
              />
            ))}
          </SellerOrdersGroup>
          {ordersHasMore ? (
            <div className="mt-4 flex justify-center">
              <button type="button" onClick={loadMoreOrders} disabled={loadingMoreOrders} className="min-h-11 rounded-xl border border-brand-green/20 bg-brand-white px-5 text-sm font-semibold text-brand-green disabled:opacity-60">
                {loadingMoreOrders ? 'Cargando…' : 'Cargar 15 pedidos más'}
              </button>
            </div>
          ) : null}
        </>
      ) : null}

      {manualOrderOpen ? (
        <SellerManualOrderModal
          onClose={() => setManualOrderOpen(false)}
          onCreated={handleCreateManualOrder}
        />
      ) : null}

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
        />
      ) : null}

    </section>
  )
}

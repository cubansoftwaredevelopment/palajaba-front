import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import SellerEmptyState from '../../components/seller/SellerEmptyState'
import SellerManualOrderModal from '../../components/seller/SellerManualOrderModal'
import SellerOrderDetailModal from '../../components/seller/SellerOrderDetailModal'
import SellerOrderItem from '../../components/seller/SellerOrderItem'
import SellerOrdersGroup from '../../components/seller/SellerOrdersGroup'
import SellerOrdersTabs from '../../components/seller/SellerOrdersTabs'
import SellerPageHeader from '../../components/seller/SellerPageHeader'
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
import { orderModalMotionClass, useOrderModalPresence } from '../../components/buyer/useOrderModalPresence'
import { sellerModalOverlay, sellerModalSheet } from '../../components/seller/sellerStyles'

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

function FilterDropdown({ label, placeholder, options, value, onChange, multiple = false }) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null)
  const selected = multiple ? value : value ? [value] : []
  const labelText = selected.length === 0
    ? placeholder
    : multiple
      ? `${selected.length} seleccionado${selected.length === 1 ? '' : 's'}`
      : selected[0]

  useEffect(() => {
    if (!open) return undefined
    rootRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    function closeOnOutside(event) {
      if (!rootRef.current?.contains(event.target)) setOpen(false)
    }
    document.addEventListener('pointerdown', closeOnOutside)
    return () => document.removeEventListener('pointerdown', closeOnOutside)
  }, [open])

  return (
    <div ref={rootRef} className="relative flex flex-col gap-1.5 text-xs font-semibold text-brand-green">
      <span>{label}</span>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-haspopup="listbox"
        className="flex min-h-11 items-center justify-between gap-3 rounded-xl border border-white bg-white px-3.5 text-left text-sm font-normal text-brand-carmelita shadow-sm transition hover:border-brand-green/25 focus:outline-none focus:ring-2 focus:ring-brand-green/15"
      >
        <span className={selected.length ? 'truncate text-brand-green' : 'truncate text-brand-carmelita/55'}>{labelText}</span>
        <svg className={`h-4 w-4 shrink-0 text-brand-green/65 transition-transform ${open ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
      </button>
      <div
        role="listbox"
        aria-label={label}
        aria-multiselectable={multiple}
        aria-hidden={!open}
        className={`rounded-xl border border-white bg-white shadow-[0_14px_36px_rgba(41,55,29,0.18)] transition-[max-height,opacity,margin,padding] duration-300 ease-out motion-reduce:transition-none ${open ? 'mt-1 max-h-48 overflow-y-auto p-1.5 opacity-100' : 'pointer-events-none mt-0 max-h-0 overflow-hidden border-transparent p-0 opacity-0 shadow-none'}`}
      >
          {!multiple ? (
            <button type="button" role="option" aria-selected={!value} onClick={() => { onChange(''); setOpen(false) }} className="w-full rounded-lg px-3 py-2.5 text-left text-sm font-normal text-brand-carmelita/75 hover:bg-brand-green/5">{placeholder}</button>
          ) : null}
          {options.map((option) => {
            const checked = selected.includes(option)
            return (
              <button
                key={option}
                type="button"
                role="option"
                aria-selected={checked}
                onClick={() => {
                  if (multiple) onChange(checked ? value.filter((item) => item !== option) : [...value, option])
                  else { onChange(option); setOpen(false) }
                }}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-normal transition ${checked ? 'bg-brand-green/8 text-brand-green' : 'text-brand-carmelita hover:bg-brand-green/5'}`}
              >
                {multiple ? (
                  <span className={`grid h-4 w-4 shrink-0 place-items-center rounded-[4px] border transition-colors ${checked ? 'border-brand-green bg-brand-green' : 'border-brand-green/30 bg-white'}`} aria-hidden="true">
                    {checked ? <svg viewBox="0 0 16 16" className="h-3 w-3" fill="none"><path d="m3.25 8.25 3 3L12.75 4.75" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg> : null}
                  </span>
                ) : null}
                <span className="truncate">{option}</span>
              </button>
            )
          })}
          {options.length === 0 ? <p className="px-3 py-2 text-sm font-normal text-brand-carmelita/60">No hay opciones disponibles</p> : null}
      </div>
    </div>
  )
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
  const [orders, setOrders] = useState([])
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
  const [search, setSearch] = useState('')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const { present: filtersPresent, closing: filtersClosing } = useOrderModalPresence(filtersOpen)
  const [clientFilter, setClientFilter] = useState('')
  const [productFilters, setProductFilters] = useState([])
  const [currencyFilter, setCurrencyFilter] = useState('')
  const [deliveryFilter, setDeliveryFilter] = useState('')
  const [datePeriod, setDatePeriod] = useState('daily')
  const [dateRange, setDateRange] = useState(() => rangeForPeriod('daily'))

  const loadOrders = useCallback(async ({ silent = false } = {}) => {
    if (!silent) {
      setLoading(true)
      setError('')
    }

    try {
      const token = getSellerToken()
      const data = await fetchSellerOrders(token)
      setOrders(data)
      setSelectedOrder((current) =>
        current ? data.find((order) => order.id === current.id) ?? null : null,
      )
    } catch (err) {
      if (!silent) {
        setOrders([])
        setError(getUserFacingMessage(err, 'No pudimos cargar los pedidos. Inténtalo de nuevo.'))
      }
    } finally {
      if (!silent) {
        setLoading(false)
      }
    }
  }, [])

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
    if (loading || tabInitialized) return
    setActiveTab(pendingOrders.length > 0 ? 'pending' : 'completed')
    setTabInitialized(true)
  }, [loading, tabInitialized, pendingOrders.length])

  const visibleOrders = useMemo(() => {
    const tabOrders = activeTab === 'pending' ? pendingOrders : completedOrders
    const query = search.trim().toLocaleLowerCase('es')
    return tabOrders.filter((order) => {
      const clientName = String(order.buyer_name || '').toLocaleLowerCase('es')
      const searchable = [order.buyer_name, order.buyer_phone, order.buyer_email, order.id]
        .filter(Boolean).join(' ').toLocaleLowerCase('es')
      if (query && !searchable.includes(query)) return false
      if (clientFilter && clientName !== clientFilter) return false
      if (productFilters.length && !order.items?.some((item) => productFilters.includes(item.name))) return false
      if (currencyFilter && order.payment_currency !== currencyFilter) return false
      if (deliveryFilter === 'yes' && !order.delivery_requested) return false
      if (deliveryFilter === 'no' && order.delivery_requested) return false
      return isInRange(order, activeTab, dateRange)
    })
  }, [activeTab, pendingOrders, completedOrders, search, clientFilter, productFilters, currencyFilter, deliveryFilter, dateRange])

  const filterOptions = useMemo(() => {
    const allOrders = [...pendingOrders, ...completedOrders]
    return {
      clients: [...new Set(allOrders.map((order) => order.buyer_name).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'es')),
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
            pendingCount={pendingOrders.length}
            completedCount={completedOrders.length}
          />

          <div className="mb-3 flex">
            <div className="relative min-w-0 flex-1">
              <label>
                <span className="sr-only">Buscar pedidos</span>
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Buscar por cliente, teléfono, correo o pedido"
                  className="min-h-11 w-full rounded-xl border border-brand-green/15 bg-brand-white py-2 pl-4 pr-24 text-sm text-brand-carmelita placeholder:text-brand-carmelita/45 focus:border-brand-green/40 focus:outline-none focus:ring-2 focus:ring-brand-green/15"
                />
              </label>
              <button
                type="button"
                onClick={() => setFiltersOpen((value) => !value)}
                aria-expanded={filtersOpen}
                className="absolute right-1.5 top-1/2 min-h-9 -translate-y-1/2 rounded-lg border border-brand-green/15 bg-brand-white px-3 text-sm font-semibold text-brand-green shadow-sm"
              >
                Filtros{[clientFilter, ...productFilters, currencyFilter, deliveryFilter].filter(Boolean).length ? ` (${[clientFilter, ...productFilters, currencyFilter, deliveryFilter].filter(Boolean).length})` : ''}
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
                    <FilterDropdown label="Cliente" placeholder="Todos los clientes" options={filterOptions.clients} value={clientFilter} onChange={setClientFilter} />
                    <FilterDropdown label="Productos · selección múltiple" placeholder="Todos los productos" options={filterOptions.products} value={productFilters} onChange={setProductFilters} multiple />
                    <FilterDropdown label="Moneda" placeholder="Todas las monedas" options={filterOptions.currencies} value={currencyFilter} onChange={setCurrencyFilter} />
                    <FilterDropdown label="Domicilio" placeholder="Todos" options={['Sí', 'No']} value={deliveryFilter === 'yes' ? 'Sí' : deliveryFilter === 'no' ? 'No' : ''} onChange={(value) => setDeliveryFilter(value === 'Sí' ? 'yes' : value === 'No' ? 'no' : '')} />
                  </div>
                  <footer className="flex justify-between gap-3 border-t border-brand-green/10 p-4">
                    <button type="button" onClick={() => { setClientFilter(''); setProductFilters([]); setCurrencyFilter(''); setDeliveryFilter('') }} className="min-h-10 rounded-xl border border-brand-green/15 px-4 text-sm font-semibold text-brand-green">Limpiar filtros</button>
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

      <AdminDateRangeControls
        period={datePeriod}
        onPeriodChange={setDatePeriod}
        range={dateRange}
        onRangeChange={(nextRange, nextPeriod) => {
          if (nextRange) {
            setDateRange(nextRange)
            setDatePeriod(nextPeriod || 'custom')
          } else {
            setDatePeriod('daily')
            setDateRange(rangeForPeriod('daily'))
          }
        }}
        applyPeriodToRange
      />
    </section>
  )
}

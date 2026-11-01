import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchStoreCustomers } from '../../auth/api'
import { getSellerToken } from '../../lib/sellerAuth'
import { getUserFacingMessage } from '../../lib/userFacingError'
import { SELLER_ORDERS_REFRESH_EVENT } from '../../lib/sellerOrdersRefresh'
import SellerModalPortal from '../../components/seller/SellerModalPortal'
import SellerFilterDropdown from '../../components/seller/SellerFilterDropdown'
import AdminDateRangeControls, { isoDate, rangeForPeriod } from '../../components/admin/AdminDateRangeControls'
import {
  sellerModalBody,
  sellerModalOverlay,
  sellerModalSheet,
  sellerModalFooter,
  sellerModalTitle,
} from '../../components/seller/sellerStyles'
import { useDismissibleModal } from '../../buyer/components/useOrderModalPresence'

const statusLabel = { pending_confirmation: 'Pendiente', completed: 'Confirmado', cancelled: 'Cancelado' }

function orderIdentifier(order) {
  return String(order?.id ?? '').slice(-6).toUpperCase()
}

function dateLabel(value) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('es', { dateStyle: 'medium' }).format(date)
}

function CustomerFiltersModal({ locationOptions, productOptions, currencyOptions, locationFilter, productFilters, currencyFilter, datePeriod, dateRange, dateFilterEnabled, onClose, onApply }) {
  const { dismiss, motionClass } = useDismissibleModal(onClose)
  const [draftLocation, setDraftLocation] = useState(locationFilter)
  const [draftProducts, setDraftProducts] = useState(productFilters)
  const [draftCurrency, setDraftCurrency] = useState(currencyFilter)
  const [draftDatePeriod, setDraftDatePeriod] = useState(datePeriod)
  const [draftDateRange, setDraftDateRange] = useState(dateRange)
  const [draftDateFilterEnabled, setDraftDateFilterEnabled] = useState(dateFilterEnabled)

  useEffect(() => {
    function onKeyDown(event) {
      if (event.key === 'Escape') dismiss()
    }
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [dismiss])

  function apply() {
    onApply(draftLocation, draftProducts, draftCurrency, draftDatePeriod, draftDateRange, draftDateFilterEnabled)
    dismiss()
  }

  function clear() {
    setDraftLocation('')
    setDraftProducts([])
    setDraftCurrency('')
    setDraftDatePeriod('daily')
    setDraftDateRange(rangeForPeriod('daily'))
    setDraftDateFilterEnabled(false)
    onApply('', [], '', 'daily', rangeForPeriod('daily'), false)
    dismiss()
  }

  return (
    <SellerModalPortal>
      <div
        className={`${sellerModalOverlay} ${motionClass}`}
        role="presentation"
        onMouseDown={(event) => {
          if (event.target === event.currentTarget) dismiss()
        }}
      >
        <section
          className={`${sellerModalSheet} max-h-[min(88dvh,42rem)] max-w-xl`}
          role="dialog"
          aria-modal="true"
          aria-labelledby="seller-customer-filters-title"
        >
          <header className="shrink-0 border-b border-brand-green/10 px-5 py-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="seller-customer-filters-title" className={sellerModalTitle}>Filtrar clientes</h2>
                <p className="mt-1 text-sm text-brand-carmelita/70">Combina ubicación, productos, moneda y fecha.</p>
              </div>
              <button type="button" onClick={dismiss} aria-label="Cerrar filtros" className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-2xl leading-none text-brand-carmelita/65 hover:bg-brand-green/8">×</button>
            </div>
          </header>

          <div className={`${sellerModalBody} space-y-5`}>
            <SellerFilterDropdown
              label="Ubicación"
              placeholder="Todas las ubicaciones"
              options={locationOptions}
              value={draftLocation}
              onChange={setDraftLocation}
            />
            <SellerFilterDropdown
              label="Moneda"
              placeholder="Todas las monedas"
              options={currencyOptions}
              value={draftCurrency}
              onChange={setDraftCurrency}
            />
            <SellerFilterDropdown
              label="Productos · selección múltiple"
              placeholder="Todos los productos"
              options={productOptions}
              value={draftProducts}
              onChange={setDraftProducts}
              multiple
            />
            <div className="border-t border-brand-green/10 pt-4">
              <p className="mb-2 text-xs font-semibold text-brand-green">Fecha de los pedidos</p>
              <AdminDateRangeControls
                inline
                period={draftDatePeriod}
                onPeriodChange={(period) => { setDraftDatePeriod(period); setDraftDateFilterEnabled(true) }}
                range={draftDateRange}
                onRangeChange={(nextRange, nextPeriod) => {
                  if (nextRange) {
                    setDraftDateRange(nextRange)
                    setDraftDatePeriod(nextPeriod || 'custom')
                    setDraftDateFilterEnabled(true)
                  } else {
                    setDraftDatePeriod('daily')
                    setDraftDateRange(rangeForPeriod('daily'))
                    setDraftDateFilterEnabled(false)
                  }
                }}
                applyPeriodToRange
              />
            </div>
          </div>

          <footer className={`${sellerModalFooter} flex flex-row gap-2`}>
            <button type="button" onClick={clear} className="min-h-11 flex-1 rounded-full border border-brand-green/20 bg-brand-white px-4 text-sm font-semibold text-brand-green">Limpiar filtros</button>
            <button type="button" onClick={apply} className="min-h-11 flex-1 rounded-full bg-brand-green px-4 text-sm font-semibold text-brand-white shadow-sm">Ver clientes</button>
          </footer>
        </section>
      </div>
    </SellerModalPortal>
  )
}

function CustomerOrdersModal({ customer, onClose, onSelectOrder, onLoadMore, loadingMore }) {
  const { dismiss, motionClass } = useDismissibleModal(onClose)

  useEffect(() => {
    function onKeyDown(event) {
      if (event.key === 'Escape') dismiss()
    }
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [dismiss])

  return (
    <SellerModalPortal>
      <div
        className={`${sellerModalOverlay} ${motionClass}`}
        role="presentation"
        onMouseDown={(event) => {
          if (event.target === event.currentTarget) dismiss()
        }}
      >
        <section
          className={`${sellerModalSheet} max-h-[min(90dvh,46rem)] max-w-xl`}
          role="dialog"
          aria-modal="true"
          aria-labelledby="seller-customer-detail-title"
        >
          <header className="flex shrink-0 items-start justify-between gap-4 border-b border-brand-green/10 px-5 py-4">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-brand-carmelita/60">Detalle del cliente</p>
              <h2 id="seller-customer-detail-title" className={`${sellerModalTitle} mt-1 truncate`}>{customer.full_name}</h2>
            </div>
            <button
              type="button"
              onClick={dismiss}
              aria-label="Cerrar detalle del cliente"
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-2xl leading-none text-brand-carmelita/65 transition hover:bg-brand-green/8"
            >
              ×
            </button>
          </header>

          <div className={sellerModalBody}>
            <div className="grid gap-2 rounded-2xl border border-brand-green/10 bg-brand-green/[0.025] p-4 text-sm">
              <a href={`tel:${customer.phone}`} className="font-semibold text-brand-green">{customer.phone || 'Teléfono no disponible'}</a>
              {customer.email ? <a href={`mailto:${customer.email}`} className="break-all text-brand-green">{customer.email}</a> : <span className="text-brand-carmelita/60">Correo no disponible</span>}
              <p className="text-xs text-brand-carmelita/65">Último pedido: {dateLabel(customer.last_order_at)}</p>
            </div>

            <div className="mt-5 flex items-center justify-between gap-3">
              <h3 className="font-display text-base font-bold text-brand-carmelita">Pedidos del cliente</h3>
              <span className="rounded-full bg-brand-green/8 px-2.5 py-1 text-xs font-bold text-brand-green">
                {customer.orders_count} pedido{customer.orders_count === 1 ? '' : 's'}
              </span>
            </div>

            {customer.orders?.length ? (
              <ul className="mt-3 space-y-2">
                {customer.orders.map((order) => (
                  <li key={order.id}>
                    <button
                      type="button"
                      onClick={() => onSelectOrder(order)}
                      className="w-full rounded-xl border border-brand-green/10 bg-brand-white p-3 text-left shadow-sm transition hover:border-brand-green/25 hover:bg-brand-green/[0.025] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green/25"
                    >
                      <span className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-xs font-bold text-brand-green">Pedido #{orderIdentifier(order)} · {dateLabel(order.created_at)}</span>
                        <span className={`rounded-full px-2.5 py-1 text-[0.7rem] font-bold ${order.status === 'completed' ? 'bg-brand-green/10 text-brand-green' : order.status === 'cancelled' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-800'}`}>
                          {statusLabel[order.status] || order.status}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 rounded-xl bg-brand-green/[0.025] p-4 text-sm text-brand-carmelita/65">No hay pedidos disponibles.</p>
            )}
            {customer.orders_has_more ? (
              <button type="button" onClick={onLoadMore} disabled={loadingMore} className="mt-3 min-h-10 w-full rounded-xl border border-brand-green/20 bg-brand-white px-4 text-sm font-semibold text-brand-green disabled:opacity-60">
                {loadingMore ? 'Cargando…' : 'Cargar más pedidos'}
              </button>
            ) : null}
          </div>
        </section>
      </div>
    </SellerModalPortal>
  )
}

export default function SellerCustomers() {
  const navigate = useNavigate()
  const [customers, setCustomers] = useState([])
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [locationFilter, setLocationFilter] = useState('')
  const [productFilters, setProductFilters] = useState([])
  const [currencyFilter, setCurrencyFilter] = useState('')
  const [datePeriod, setDatePeriod] = useState('daily')
  const [dateRange, setDateRange] = useState(() => rangeForPeriod('daily'))
  const [dateFilterEnabled, setDateFilterEnabled] = useState(false)
  const [locationOptions, setLocationOptions] = useState([])
  const [productOptions, setProductOptions] = useState([])
  const [currencyOptions, setCurrencyOptions] = useState([])
  const [customersHasMore, setCustomersHasMore] = useState(false)
  const [loadingMoreCustomers, setLoadingMoreCustomers] = useState(false)
  const [loadingCustomerOrders, setLoadingCustomerOrders] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    let cancelled = false
    const timer = window.setTimeout(async () => {
      try {
        setError('')
        const data = await fetchStoreCustomers(getSellerToken(), {
          offset: 0,
          limit: 20,
          search,
          location: locationFilter,
          products: productFilters,
          currency: currencyFilter,
          date_from: dateFilterEnabled ? isoDate(dateRange?.from) : '',
          date_to: dateFilterEnabled ? isoDate(dateRange?.to) : '',
        })
        if (cancelled) return
        setCustomers(data.items)
        setCustomersHasMore(data.has_more)
        setLocationOptions(data.location_options ?? [])
        setProductOptions(data.product_options ?? [])
        setCurrencyOptions(data.currency_options ?? [])
      } catch (cause) {
        if (!cancelled) setError(getUserFacingMessage(cause, 'No se pudo cargar la lista de clientes.'))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }, search ? 250 : 0)
    const refresh = () => setRefreshKey((current) => current + 1)
    window.addEventListener(SELLER_ORDERS_REFRESH_EVENT, refresh)
    return () => {
      cancelled = true
      window.clearTimeout(timer)
      window.removeEventListener(SELLER_ORDERS_REFRESH_EVENT, refresh)
    }
  }, [search, locationFilter, productFilters, currencyFilter, dateRange, dateFilterEnabled, refreshKey])

  async function loadMoreCustomers() {
    if (loadingMoreCustomers || !customersHasMore) return
    setLoadingMoreCustomers(true)
    try {
      const data = await fetchStoreCustomers(getSellerToken(), {
        offset: customers.length,
        limit: 20,
        search,
        location: locationFilter,
        products: productFilters,
        currency: currencyFilter,
        date_from: dateFilterEnabled ? isoDate(dateRange?.from) : '',
        date_to: dateFilterEnabled ? isoDate(dateRange?.to) : '',
      })
      setCustomers((current) => [...current, ...data.items])
      setCustomersHasMore(data.has_more)
    } catch (cause) {
      setError(getUserFacingMessage(cause, 'No se pudieron cargar más clientes.'))
    } finally {
      setLoadingMoreCustomers(false)
    }
  }

  async function loadMoreCustomerOrders() {
    if (!selectedCustomer?.orders_has_more || loadingCustomerOrders) return
    setLoadingCustomerOrders(true)
    try {
      const data = await fetchStoreCustomers(getSellerToken(), {
        customer_id: selectedCustomer.id,
        orders_offset: selectedCustomer.orders.length,
        orders_limit: 10,
        search,
        location: locationFilter,
        products: productFilters,
        currency: currencyFilter,
        date_from: dateFilterEnabled ? isoDate(dateRange?.from) : '',
        date_to: dateFilterEnabled ? isoDate(dateRange?.to) : '',
      })
      const nextCustomer = data.customer
      setSelectedCustomer((current) => current?.id === nextCustomer.id ? {
        ...current,
        orders: [...current.orders, ...nextCustomer.orders],
        orders_has_more: nextCustomer.orders_has_more,
      } : current)
    } catch (cause) {
      setError(getUserFacingMessage(cause, 'No se pudieron cargar más pedidos del cliente.'))
    } finally {
      setLoadingCustomerOrders(false)
    }
  }

  function openOrder(order) {
    navigate(`/tienda/pedidos?search=${encodeURIComponent(orderIdentifier(order))}`)
  }

  return (
    <main className="mx-auto w-full max-w-6xl p-4 sm:p-6">
      <header className="mb-5">
        <h1 className="mt-1 font-display text-2xl font-bold text-brand-carmelita sm:text-3xl">Clientes</h1>
        <p className="mt-1 text-sm text-brand-carmelita/70">Clientes que han realizado pedidos en tu tienda.</p>
      </header>
      {error ? <p role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p> : null}
      {loading ? <p className="rounded-2xl bg-brand-white p-5 text-sm">Cargando clientes…</p> : !customers.length && !search && !locationFilter && !productFilters.length && !currencyFilter && !dateFilterEnabled ? <p className="rounded-2xl bg-brand-white p-5 text-sm text-brand-carmelita/70">Aún no tienes clientes registrados por pedidos.</p> : (
        <>
        <div className="mb-4 flex">
          <div className="relative min-w-0 flex-1">
            <label>
              <span className="sr-only">Buscar clientes</span>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar por cliente, teléfono, correo, pedido o producto"
                className="min-h-11 w-full rounded-xl border border-brand-green/15 bg-brand-white py-2 pl-11 pr-28 text-sm text-brand-carmelita placeholder:text-brand-carmelita/45 focus:border-brand-green/40 focus:outline-none focus:ring-2 focus:ring-brand-green/15"
              />
            </label>
            {search ? (
              <button
                type="button"
                onClick={() => setSearch('')}
                aria-label="Limpiar búsqueda"
                title="Limpiar búsqueda"
                className="absolute left-1.5 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-brand-carmelita/60 transition hover:bg-brand-green/8 hover:text-brand-green focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green/25"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg>
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => setFiltersOpen(true)}
              aria-expanded={filtersOpen}
              aria-label="Filtrar clientes"
              title="Filtrar clientes"
              className="absolute right-1.5 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-lg border border-brand-green/15 bg-brand-white text-brand-green shadow-sm"
            >
              <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 5h16l-6.2 7v5l-3.6 2v-7L4 5Z" /></svg>
              {locationFilter || productFilters.length || currencyFilter || dateFilterEnabled ? <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-brand-green px-1 text-[9px] font-bold leading-none text-white">{(locationFilter ? 1 : 0) + productFilters.length + (currencyFilter ? 1 : 0) + (dateFilterEnabled ? 1 : 0)}</span> : null}
            </button>
          </div>
        </div>
        {customers.length ? (
        <ul className="grid gap-3 md:grid-cols-2">
          {customers.map((customer) => (
            <li key={customer.id}>
              <button
                type="button"
                onClick={() => setSelectedCustomer(customer)}
                className="w-full rounded-2xl border border-brand-green/10 bg-brand-white p-4 text-left shadow-sm transition hover:border-brand-green/25 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green/25 lg:p-6"
                aria-label={`Ver cliente ${customer.full_name} y sus pedidos`}
              >
                <span className="flex items-start justify-between gap-3">
                  <span className="font-bold text-brand-carmelita lg:text-lg">{customer.full_name}</span>
                  <span className="shrink-0 rounded-full bg-brand-green/8 px-2.5 py-1 text-xs font-bold text-brand-green lg:px-3 lg:py-1.5">{customer.orders_count} pedido{customer.orders_count === 1 ? '' : 's'}</span>
                </span>
                <span className="mt-3 block text-sm text-brand-green lg:mt-4 lg:text-base">{customer.phone || 'Teléfono no disponible'}</span>
                <span className="mt-1 block break-all text-sm text-brand-green lg:text-base">{customer.email || 'Correo no disponible'}</span>
                <span className="mt-2 block text-xs text-brand-carmelita/60 lg:mt-3 lg:text-sm">Último pedido: {dateLabel(customer.last_order_at)}</span>
              </button>
            </li>
          ))}
        </ul>
        ) : (
          <p className="rounded-2xl bg-brand-white p-5 text-sm text-brand-carmelita/70">No hay clientes que coincidan con la búsqueda y los filtros.</p>
        )}
        {customersHasMore ? (
          <div className="mt-4 flex justify-center">
            <button type="button" onClick={loadMoreCustomers} disabled={loadingMoreCustomers} className="min-h-11 rounded-xl border border-brand-green/20 bg-brand-white px-5 text-sm font-semibold text-brand-green disabled:opacity-60">
              {loadingMoreCustomers ? 'Cargando…' : 'Cargar más clientes'}
            </button>
          </div>
        ) : null}
        </>
      )}
      {filtersOpen ? (
        <CustomerFiltersModal
          locationOptions={locationOptions}
          productOptions={productOptions}
          currencyOptions={currencyOptions}
          locationFilter={locationFilter}
          productFilters={productFilters}
          currencyFilter={currencyFilter}
          datePeriod={datePeriod}
          dateRange={dateRange}
          dateFilterEnabled={dateFilterEnabled}
          onClose={() => setFiltersOpen(false)}
          onApply={(location, products, currency, period, range, dateEnabled) => {
            setLocationFilter(location)
            setProductFilters(products)
            setCurrencyFilter(currency)
            setDatePeriod(period)
            setDateRange(range)
            setDateFilterEnabled(dateEnabled)
          }}
        />
      ) : null}
      {selectedCustomer ? (
        <CustomerOrdersModal
          customer={selectedCustomer}
          onClose={() => setSelectedCustomer(null)}
          onSelectOrder={openOrder}
          onLoadMore={loadMoreCustomerOrders}
          loadingMore={loadingCustomerOrders}
        />
      ) : null}
    </main>
  )
}

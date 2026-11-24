import { useMemo, useState } from 'react'
import SearchBar from '../../buyer/componentes/SearchBar.jsx'
import FilterModal from '../../shared/componentes/FilterModal.jsx'
import { clearedDateFilter, countActiveFilters } from '../../shared/componentes/filterState.js'
import { rangeForPeriod } from '../../admin/componentes/AdminDateRangeControls.jsx'
import QvaPayReleaseCountdown from '../componentes/QvaPayReleaseCountdown.jsx'
import { formatDate, getBuyerOrderStatusLabel, needsBuyerOrderAttention, orderIsInRange } from '../utils/constants.js'
import { formatPrice } from '../../shared/utils/money.js'
import { useCustomerAccount } from '../context/CustomerAccountContext.jsx'

const CUSTOMER_ORDER_HINTS = [
  'buscar por tienda',
  'buscar por producto',
  'buscar por pedido',
]

export default function CustomerOrdersPage() {
  const {
    orders,
    ordersHasMore,
    loadingMoreOrders,
    loadMoreOrders,
    setSelectedOrder,
  } = useCustomerAccount()
  const [orderSearch, setOrderSearch] = useState('')
  const [orderFiltersOpen, setOrderFiltersOpen] = useState(false)
  const [storeFilter, setStoreFilter] = useState('')
  const [productFilters, setProductFilters] = useState([])
  const [statusFilter, setStatusFilter] = useState('')
  const [currencyFilter, setCurrencyFilter] = useState('')
  const [deliveryFilter, setDeliveryFilter] = useState('')
  const [datePeriod, setDatePeriod] = useState('daily')
  const [dateRange, setDateRange] = useState(() => rangeForPeriod('daily'))
  const [dateFilterEnabled, setDateFilterEnabled] = useState(false)

  const orderFilterOptions = useMemo(() => ({
    stores: [...new Set(orders.map((order) => order.store_name).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'es')),
    products: [...new Set(orders.flatMap((order) => (order.items || []).map((item) => item.name).filter(Boolean)))].sort((a, b) => a.localeCompare(b, 'es')),
    statuses: [...new Set(orders.map(getBuyerOrderStatusLabel).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'es')),
    currencies: [...new Set(orders.flatMap((order) => [order.payment_currency, ...(order.subtotals || []).map((entry) => entry.currency)].filter(Boolean)))].sort(),
  }), [orders])

  const visibleCustomerOrders = useMemo(() => {
    const query = orderSearch.trim().toLocaleLowerCase('es')
    return orders.filter((order) => {
      const searchable = [
        order.store_name,
        order.id?.slice(-6),
        getBuyerOrderStatusLabel(order),
        ...(order.items || []).map((item) => item.name),
      ].filter(Boolean).join(' ').toLocaleLowerCase('es')
      if (query && !searchable.includes(query)) return false
      if (storeFilter && order.store_name !== storeFilter) return false
      if (productFilters.length && !order.items?.some((item) => productFilters.includes(item.name))) return false
      if (statusFilter && getBuyerOrderStatusLabel(order) !== statusFilter) return false
      if (currencyFilter && order.payment_currency !== currencyFilter && !order.subtotals?.some((entry) => entry.currency === currencyFilter)) return false
      if (deliveryFilter === 'yes' && !order.delivery_requested) return false
      if (deliveryFilter === 'no' && order.delivery_requested) return false
      if (dateFilterEnabled && !orderIsInRange(order, dateRange)) return false
      return true
    })
  }, [orders, orderSearch, storeFilter, productFilters, statusFilter, currencyFilter, deliveryFilter, dateFilterEnabled, dateRange])

  const orderFilterValues = {
    store: storeFilter,
    products: productFilters,
    status: statusFilter,
    currency: currencyFilter,
    delivery: deliveryFilter,
    datePeriod,
    dateRange,
    dateEnabled: dateFilterEnabled,
  }
  const emptyOrderFilters = {
    store: '',
    products: [],
    status: '',
    currency: '',
    delivery: '',
    ...clearedDateFilter(),
  }
  const activeOrderFilterCount = countActiveFilters(orderFilterValues, ['store', 'products', 'status', 'currency', 'delivery'])

  function updateOrderFilters(next) {
    setStoreFilter(next.store)
    setProductFilters(next.products)
    setStatusFilter(next.status)
    setCurrencyFilter(next.currency)
    setDeliveryFilter(next.delivery)
    setDatePeriod(next.datePeriod)
    setDateRange(next.dateRange)
    setDateFilterEnabled(next.dateEnabled)
  }

  return (
    <>
      <section className="space-y-3">
        {orders.length ? (
          <>
            <SearchBar
              id="customer-orders-search"
              value={orderSearch}
              onChange={(event) => setOrderSearch(event.target.value)}
              onClear={() => setOrderSearch('')}
              label="Buscar pedidos"
              phrases={CUSTOMER_ORDER_HINTS}
              filter={{
                count: activeOrderFilterCount,
                label: 'Filtrar pedidos',
                expanded: orderFiltersOpen,
                onClick: () => setOrderFiltersOpen(true),
              }}
            />
            {visibleCustomerOrders.length ? (
              <ul className="flex flex-col divide-y divide-neutral-300">
                {visibleCustomerOrders.map((order) => {
                  const evidenceStatus = order.payment_method === 'qvapay' ? order.qvapay?.evidence?.status : null
                  const highlighted = needsBuyerOrderAttention(order)
                  const statusTone = order.status === 'completed' || order.status === 'in_transit'
                    ? 'bg-brand-green'
                    : order.status === 'cancelled'
                      ? 'bg-red-600'
                      : 'bg-brand-yellow'
                  const statusLabel = getBuyerOrderStatusLabel(order)
                  const statusText = order.status === 'completed' || order.status === 'in_transit'
                    ? 'text-brand-green'
                    : order.status === 'cancelled'
                      ? 'text-red-700'
                      : statusLabel === 'Por procesar'
                        ? 'text-yellow-600'
                        : 'text-amber-800'
                  const orderCode = String(order.id || '').slice(-6).toUpperCase()
                  return (
                    <li key={order.id}>
                      <button type="button" onClick={() => setSelectedOrder(order)} aria-label={`Ver detalle del pedido de ${order.store_name}`} className="flex w-full items-stretch text-left transition active:bg-black/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green/40">
                        <span className={`my-3.5 w-1 shrink-0 rounded-full ${statusTone}`} aria-hidden="true" />
                        <span className="min-w-0 flex-1 py-3.5 pl-3">
                          <div className="flex justify-between gap-3">
                            <span className="min-w-0">
                              <strong className="block truncate">{order.store_name}</strong>
                              <span className="mt-0.5 block text-xs font-bold text-brand-green">#{orderCode}</span>
                            </span>
                            <span className={`inline-flex shrink-0 items-center gap-1 text-right text-xs font-bold ${statusText}`}>
                              {highlighted ? <span className={`flex h-4 w-4 items-center justify-center rounded-full text-[0.65rem] font-extrabold leading-none text-white ${evidenceStatus === 'rejected' ? 'bg-red-700' : 'bg-amber-700'}`} aria-hidden="true">!</span> : null}
                              {statusLabel}
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-brand-carmelita/60">{formatDate(order.created_at)}</p>
                          {evidenceStatus === 'pending' ? <QvaPayReleaseCountdown deadline={order.qvapay?.evidence?.deadline} compact /> : null}
                          <p className="mt-2 text-sm">{order.items?.map((item) => `${item.quantity} × ${item.name}`).join(', ')}</p>
                          <p className="mt-2 text-xs text-brand-carmelita/70">{order.subtotals?.map((entry) => formatPrice(entry.amount, entry.currency)).join(' · ')}</p>
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            ) : (
              <p className="rounded-2xl border border-brand-green/10 bg-brand-white p-4 text-sm text-brand-carmelita/70">No hay pedidos que coincidan con la búsqueda o los filtros.</p>
            )}
            {ordersHasMore ? (
              <div className="flex justify-center">
                <button type="button" onClick={loadMoreOrders} disabled={loadingMoreOrders} className="min-h-11 rounded-xl border border-brand-green/20 bg-brand-white px-5 text-sm font-semibold text-brand-green disabled:opacity-60">
                  {loadingMoreOrders ? 'Cargando…' : 'Cargar más pedidos'}
                </button>
              </div>
            ) : null}
          </>
        ) : (
          <p className="text-sm text-brand-carmelita/70">Aún no tienes pedidos.</p>
        )}
      </section>
      <FilterModal
        open={orderFiltersOpen}
        onClose={() => setOrderFiltersOpen(false)}
        title="Filtrar pedidos"
        description="Combina los criterios que quieras aplicar."
        titleId="customer-order-filters-title"
        applyLabel="Ver pedidos"
        fields={[
          { key: 'store', label: 'Tienda', placeholder: 'Todas las tiendas', options: orderFilterOptions.stores },
          { key: 'products', label: 'Productos · selección múltiple', placeholder: 'Todos los productos', options: orderFilterOptions.products, multiple: true },
          { key: 'status', label: 'Estado', placeholder: 'Todos los estados', options: orderFilterOptions.statuses },
          { key: 'currency', label: 'Moneda', placeholder: 'Todas las monedas', options: orderFilterOptions.currencies },
          { key: 'delivery', label: 'Domicilio', placeholder: 'Todos', options: [{ value: 'yes', label: 'Sí' }, { value: 'no', label: 'No' }] },
        ]}
        values={orderFilterValues}
        onValuesChange={updateOrderFilters}
        dateLabel="Fecha del pedido"
        emptyValues={emptyOrderFilters}
      />
    </>
  )
}

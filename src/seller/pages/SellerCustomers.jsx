import { useEffect, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import SearchBar from '../../buyer/componentes/SearchBar.jsx'
import { useNavigate, useOutletContext } from 'react-router-dom'
import { guardPlugin } from '../../subscriptions/utils/planPluginGate.js'
import { fetchStoreCustomerNotices, fetchStoreCustomers, sendStoreCustomerNotice, suggestStoreCustomers } from '../../auth/api'
import { getSellerToken } from '../utils/sellerAuth.js'
import { beginSectionRefresh, endSectionRefresh } from '../../session/sectionStore'
import { useRegisterSectionRefresh } from '../../session/useSectionRefresh'
import { useSectionSnapshot } from '../../session/useSectionSnapshot'
import { getUserFacingMessage } from '../../shared/utils/userFacingError.js'
import { SELLER_ORDERS_REFRESH_EVENT } from '../utils/sellerOrdersRefresh.js'
import SellerModalPortal from '../componentes/SellerModalPortal.jsx'
import { isoDate, rangeForPeriod } from '../../admin/componentes/AdminDateRangeControls.jsx'
import FilterModal from '../../shared/componentes/FilterModal.jsx'
import { clearedDateFilter, countActiveFilters } from '../../shared/componentes/filterState.js'
import LoadingState from '../../shared/componentes/LoadingState.jsx'
import { useSellerReadOnly } from '../componentes/sellerReadOnly.js'
import NoticeDateFilter from '../../shared/componentes/NoticeDateFilter.jsx'
import {
  sellerModalBody,
  sellerModalFooter,
  sellerModalSheet,
  sellerModalTitle,
} from '../componentes/sellerStyles.js'
import SellerMotionSheet, { useSellerSheet } from '../../motion/SellerMotionSheet'
import { monthPageShift } from '../../motion/presets'
import MethodTabs from '../../auth/componentes/MethodTabs.jsx'

import { isCustomerPaidOrder } from '../../orders/utils/orderStatus.js'

const statusLabel = { pending_confirmation: 'Pendiente', in_transit: 'En tránsito', completed: 'Confirmado', cancelled: 'Cancelado' }
const NOTICE_PAGE = 10
const CUSTOMER_TABS = [
  { id: 'customers', label: 'Clientes' },
  { id: 'notices', label: 'Avisos' },
]

function recipientLabel(notice) {
  if (notice.all_customers) return `Todos los clientes · ${notice.recipient_count}`
  const names = (notice.recipients ?? []).map((item) => item.full_name).filter(Boolean)
  const extra = Math.max(0, (notice.recipient_count ?? 0) - names.length)
  if (!names.length) return `${notice.recipient_count ?? 0} clientes`
  return extra ? `${names.join(', ')} y ${extra} más` : names.join(', ')
}

const NOTICE_CUSTOMER_HINTS = [
  'buscar por nombre',
  'buscar por cliente',
]

const CUSTOMER_SEARCH_HINTS = [
  'buscar por cliente',
  'buscar por teléfono',
  'buscar por correo',
  'buscar por pedido',
  'buscar por producto',
]

function orderIdentifier(order) {
  return String(order?.id ?? '').slice(-6).toUpperCase()
}

function dateLabel(value) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('es', { dateStyle: 'medium' }).format(date)
}

function CustomerOrdersModal({ customer, onClose, onSelectOrder, onLoadMore, loadingMore }) {
  const { dismiss, closing, sheetProps } = useSellerSheet(onClose)

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
      <SellerMotionSheet
        onClose={dismiss}
        closing={closing}
        sheetProps={sheetProps}
        labelledBy="seller-customer-detail-title"
        panelAs="section"
        panelClassName={`${sellerModalSheet} max-h-[min(90dvh,46rem)] max-w-xl`}
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
                        <span className={`rounded-full px-2.5 py-1 text-[0.7rem] font-bold ${order.status === 'completed' || isCustomerPaidOrder(order) ? 'bg-brand-green/10 text-brand-green' : order.status === 'cancelled' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-800'}`}>
                          {isCustomerPaidOrder(order) ? 'Pagado' : statusLabel[order.status] || order.status}
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
      </SellerMotionSheet>
    </SellerModalPortal>
  )
}

function CustomerNoticeModal({ onClose, onSent }) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [allCustomers, setAllCustomers] = useState(true)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [selected, setSelected] = useState([])
  const [sending, setSending] = useState(false)
  const [formError, setFormError] = useState('')
  const { dismiss, closing, sheetProps } = useSellerSheet(onClose)

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

  useEffect(() => {
    const text = query.trim()
    if (allCustomers || text.length < 2) {
      setResults([])
      setSearching(false)
      return undefined
    }
    let cancelled = false
    setSearching(true)
    const timer = window.setTimeout(async () => {
      try {
        const data = await suggestStoreCustomers(getSellerToken(), text)
        if (!cancelled) setResults(data.items ?? [])
      } catch (cause) {
        if (!cancelled) setFormError(getUserFacingMessage(cause, 'No se pudo buscar clientes.'))
      } finally {
        if (!cancelled) setSearching(false)
      }
    }, 250)
    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [allCustomers, query])

  function toggleCustomer(customer) {
    setSelected((current) => (
      current.some((item) => item.id === customer.id)
        ? current.filter((item) => item.id !== customer.id)
        : [...current, { id: customer.id, full_name: customer.full_name, phone: customer.phone }]
    ))
  }

  async function submit(event) {
    event.preventDefault()
    if (sending) return
    setSending(true)
    setFormError('')
    try {
      const result = await sendStoreCustomerNotice(getSellerToken(), {
        title: title.trim(),
        content: content.trim(),
        all_customers: allCustomers,
        customer_ids: allCustomers ? [] : selected.map((item) => item.id),
      })
      onSent(result.sent_count ?? 0)
      dismiss()
    } catch (cause) {
      setFormError(getUserFacingMessage(cause, 'No se pudo enviar el aviso.'))
    } finally {
      setSending(false)
    }
  }

  const canSend = title.trim().length >= 2 && content.trim().length >= 2 && (allCustomers || selected.length > 0)

  return (
    <SellerModalPortal>
      <SellerMotionSheet
        onClose={dismiss}
        closing={closing}
        sheetProps={sheetProps}
        labelledBy="seller-customer-notice-title"
        panelAs="section"
        panelClassName={`${sellerModalSheet} max-h-[min(92dvh,44rem)] max-w-xl`}
      >
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-brand-green/10 px-5 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-carmelita/60">Avisos</p>
            <h2 id="seller-customer-notice-title" className={`${sellerModalTitle} mt-1`}>Enviar aviso</h2>
          </div>
          <button type="button" onClick={dismiss} aria-label="Cerrar aviso" className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-2xl leading-none text-brand-carmelita/65 hover:bg-brand-green/8">×</button>
        </header>
        <div className={sellerModalBody}>
          <MethodTabs
            ariaLabel="Destinatarios del aviso"
            value={allCustomers ? 'all' : 'selected'}
            onChange={(next) => setAllCustomers(next === 'all')}
            options={[
              { id: 'all', label: 'Todos' },
              { id: 'selected', label: 'Ciertos clientes' },
            ]}
          />
          {allCustomers ? (
            <p className="mb-4 text-sm text-brand-carmelita/70">El aviso llegará a todos los clientes que han pedido en tu tienda.</p>
          ) : (
            <div className="relative mb-4">
              <SearchBar
                id="seller-notice-customer-search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onClear={() => { setQuery(''); setResults([]) }}
                label="Buscar clientes"
                phrases={NOTICE_CUSTOMER_HINTS}
              />
              {selected.length ? (
                <ul className="mt-3 flex flex-wrap gap-2">
                  {selected.map((customer) => (
                    <li key={customer.id}>
                      <button type="button" onClick={() => toggleCustomer(customer)} className="inline-flex min-h-8 items-center gap-1 rounded-full bg-brand-green/10 px-3 text-xs font-semibold text-brand-green">
                        {customer.full_name}
                        <span aria-hidden="true">×</span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
              {query.trim().length >= 2 ? (
                <ul className="mt-2 max-h-52 overflow-y-auto rounded-2xl border border-brand-green/12 bg-brand-white py-1 shadow-[0_12px_32px_rgba(89,128,44,0.16)]" aria-label="Sugerencias de clientes">
                  {searching ? <li className="px-4 py-3 text-sm text-brand-carmelita">Buscando…</li> : null}
                  {!searching && !results.length ? <li className="px-4 py-3 text-sm text-brand-carmelita">Sin coincidencias.</li> : null}
                  {results.map((customer) => {
                    const checked = selected.some((item) => item.id === customer.id)
                    return (
                      <li key={customer.id}>
                        <button
                          type="button"
                          onClick={() => toggleCustomer(customer)}
                          className={`flex w-full items-center gap-3 px-4 py-2.5 text-left touch-manipulation active:bg-brand-yellow/15 ${checked ? 'bg-brand-green/[0.05]' : ''}`}
                        >
                          <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-md border text-[0.7rem] font-bold ${checked ? 'border-brand-green bg-brand-green text-brand-white' : 'border-brand-green/25 text-transparent'}`} aria-hidden="true">✓</span>
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-semibold text-brand-green">{customer.full_name}</span>
                            <span className="block truncate text-xs text-brand-carmelita">{customer.phone || customer.email || 'Sin contacto'}</span>
                          </span>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              ) : null}
            </div>
          )}
          <label className="block text-sm font-semibold text-brand-carmelita">
            Título
            <input value={title} maxLength={80} onChange={(event) => setTitle(event.target.value)} className="mt-1 min-h-11 w-full rounded-xl border border-brand-green/15 bg-white px-3 py-2 font-normal" />
          </label>
          <label className="mt-3 block text-sm font-semibold text-brand-carmelita">
            Mensaje
            <textarea value={content} maxLength={500} rows={4} onChange={(event) => setContent(event.target.value)} className="mt-1 w-full rounded-xl border border-brand-green/15 bg-white px-3 py-2 font-normal" />
          </label>
          {formError ? <p role="alert" className="mt-3 text-sm text-red-700">{formError}</p> : null}
        </div>
        <div className={sellerModalFooter}>
          <button type="button" onClick={submit} disabled={!canSend || sending} className="min-h-11 w-full rounded-xl bg-brand-green px-4 font-bold text-brand-white disabled:opacity-50">
            {sending ? 'Enviando…' : 'Enviar aviso'}
          </button>
        </div>
      </SellerMotionSheet>
    </SellerModalPortal>
  )
}

export default function SellerCustomers() {
  const navigate = useNavigate()
  const { profile } = useOutletContext()
  const readOnly = useSellerReadOnly()
  const reducedMotion = useReducedMotion()
  const { snapshot, commit, skipInitialRef } = useSectionSnapshot('seller', 'customers')
  const cached = snapshot?.data
  const savedQuery = snapshot?.query ?? {}
  const savedRef = useRef(cached ?? {})
  const [sectionTab, setSectionTab] = useState(savedQuery.sectionTab ?? 'customers')
  const [tabDirection, setTabDirection] = useState(1)
  const [tabMotion, setTabMotion] = useState(false)
  const [noticeOpen, setNoticeOpen] = useState(false)
  const [notices, setNotices] = useState(cached?.notices ?? [])
  const [noticesLoading, setNoticesLoading] = useState(false)
  const [noticesHasMore, setNoticesHasMore] = useState(cached?.noticesHasMore ?? false)
  const [loadingMoreNotices, setLoadingMoreNotices] = useState(false)
  const [noticesRefresh, setNoticesRefresh] = useState(0)
  const [noticeDateFrom, setNoticeDateFrom] = useState(savedQuery.noticeDateFrom ?? '')
  const [noticeDateTo, setNoticeDateTo] = useState(savedQuery.noticeDateTo ?? '')
  const [customers, setCustomers] = useState(cached?.customers ?? [])
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [loading, setLoading] = useState(!cached)
  const [error, setError] = useState('')
  const [search, setSearch] = useState(savedQuery.search ?? '')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [locationFilter, setLocationFilter] = useState(savedQuery.locationFilter ?? '')
  const [productFilters, setProductFilters] = useState(savedQuery.productFilters ?? [])
  const [currencyFilter, setCurrencyFilter] = useState(savedQuery.currencyFilter ?? '')
  const [datePeriod, setDatePeriod] = useState(savedQuery.datePeriod ?? 'daily')
  const [dateRange, setDateRange] = useState(() => savedQuery.dateRange ?? rangeForPeriod('daily'))
  const [dateFilterEnabled, setDateFilterEnabled] = useState(savedQuery.dateFilterEnabled ?? false)
  const [locationOptions, setLocationOptions] = useState(cached?.locationOptions ?? [])
  const [productOptions, setProductOptions] = useState(cached?.productOptions ?? [])
  const [currencyOptions, setCurrencyOptions] = useState(cached?.currencyOptions ?? [])
  const [customersHasMore, setCustomersHasMore] = useState(cached?.customersHasMore ?? false)
  const [loadingMoreCustomers, setLoadingMoreCustomers] = useState(false)
  const [loadingCustomerOrders, setLoadingCustomerOrders] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const loadedNoticeQueryRef = useRef(
    Array.isArray(cached?.notices)
      ? `${savedQuery.noticeDateFrom ?? ''}|${savedQuery.noticeDateTo ?? ''}`
      : null,
  )
  const appliedNoticeRefreshRef = useRef(0)

  function rememberCustomers(patch) {
    savedRef.current = { ...savedRef.current, ...patch }
    commit(savedRef.current, {
      sectionTab,
      search,
      locationFilter,
      productFilters,
      currencyFilter,
      datePeriod,
      dateRange,
      dateFilterEnabled,
      noticeDateFrom,
      noticeDateTo,
    })
  }

  useRegisterSectionRefresh(() => {
    setRefreshKey((current) => current + 1)
    setNoticesRefresh((current) => current + 1)
  })

  useEffect(() => {
    if (skipInitialRef.current) return undefined
    let cancelled = false
    const markRefresh = refreshKey > 0 || customers.length > 0
    let started = false
    if (markRefresh) beginSectionRefresh('seller', 'customers')
    const timer = window.setTimeout(async () => {
      started = true
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
        rememberCustomers({
          customers: data.items,
          customersHasMore: data.has_more,
          locationOptions: data.location_options ?? [],
          productOptions: data.product_options ?? [],
          currencyOptions: data.currency_options ?? [],
        })
      } catch (cause) {
        if (!cancelled) setError(getUserFacingMessage(cause, 'No se pudo cargar la lista de clientes.'))
      } finally {
        if (!cancelled) setLoading(false)
        if (markRefresh) endSectionRefresh('seller', 'customers')
      }
    }, search ? 250 : 0)
    return () => {
      cancelled = true
      window.clearTimeout(timer)
      if (markRefresh && !started) endSectionRefresh('seller', 'customers')
    }
  }, [search, locationFilter, productFilters, currencyFilter, dateRange, dateFilterEnabled, refreshKey])

  useEffect(() => {
    const refresh = () => setRefreshKey((current) => current + 1)
    window.addEventListener(SELLER_ORDERS_REFRESH_EVENT, refresh)
    return () => window.removeEventListener(SELLER_ORDERS_REFRESH_EVENT, refresh)
  }, [])

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
      const next = [...customers, ...data.items]
      setCustomers(next)
      setCustomersHasMore(data.has_more)
      rememberCustomers({ customers: next, customersHasMore: data.has_more })
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

  useEffect(() => {
    if (sectionTab !== 'notices') return undefined
    const queryKey = `${noticeDateFrom}|${noticeDateTo}`
    const pull = noticesRefresh !== appliedNoticeRefreshRef.current
    if (!pull && loadedNoticeQueryRef.current === queryKey) return undefined
    appliedNoticeRefreshRef.current = noticesRefresh
    let cancelled = false
    if (pull) beginSectionRefresh('seller', 'customers')
    else if (loadedNoticeQueryRef.current !== queryKey) setNoticesLoading(true)
    ;(async () => {
      try {
        const data = await fetchStoreCustomerNotices(getSellerToken(), {
          offset: 0,
          limit: NOTICE_PAGE,
          dateFrom: noticeDateFrom,
          dateTo: noticeDateTo,
        })
        if (cancelled) return
        const items = data.items ?? []
        setNotices(items)
        setNoticesHasMore(Boolean(data.has_more))
        loadedNoticeQueryRef.current = queryKey
        rememberCustomers({ notices: items, noticesHasMore: Boolean(data.has_more) })
        setError('')
      } catch (cause) {
        if (!cancelled) setError(getUserFacingMessage(cause, 'No se pudieron cargar los avisos enviados.'))
      } finally {
        if (!cancelled) setNoticesLoading(false)
        if (pull) endSectionRefresh('seller', 'customers')
      }
    })()
    return () => { cancelled = true }
  }, [sectionTab, noticesRefresh, noticeDateFrom, noticeDateTo])

  async function loadMoreNotices() {
    if (loadingMoreNotices || !noticesHasMore) return
    setLoadingMoreNotices(true)
    try {
      const data = await fetchStoreCustomerNotices(getSellerToken(), { offset: notices.length, limit: NOTICE_PAGE })
      const next = [...notices, ...(data.items ?? [])]
      setNotices(next)
      setNoticesHasMore(Boolean(data.has_more))
      rememberCustomers({ notices: next, noticesHasMore: Boolean(data.has_more) })
    } catch (cause) {
      setError(getUserFacingMessage(cause, 'No se pudieron cargar más avisos.'))
    } finally {
      setLoadingMoreNotices(false)
    }
  }

  function selectSection(next) {
    if (next === sectionTab) return
    setTabDirection(next === 'notices' ? 1 : -1)
    setTabMotion(true)
    setSectionTab(next)
  }

  function openOrder(order) {
    navigate(`/tienda/pedidos?search=${encodeURIComponent(orderIdentifier(order))}`)
  }

  const tabShift = monthPageShift(tabDirection, reducedMotion || !tabMotion)
  const customersEmpty = !customers.length && !search && !locationFilter && !productFilters.length && !currencyFilter && !dateFilterEnabled

  const showCustomerSearch = sectionTab === 'customers' && !loading && !customersEmpty

  return (
    <main className="mx-auto w-full max-w-6xl p-4 sm:p-6">
      <header className="mb-5 text-center">
        <h1 className="font-script text-7xl leading-[1.05] text-brand-carmelita sm:text-8xl">Clientes</h1>
        <p className="mt-1 text-sm text-brand-carmelita/70">Clientes que han realizado pedidos en tu tienda.</p>
      </header>
      <MethodTabs
        ariaLabel="Sección de clientes"
        value={sectionTab}
        onChange={selectSection}
        options={CUSTOMER_TABS}
      />
      {showCustomerSearch ? (
        <div className="mb-4">
          <SearchBar
            id="seller-customers-search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            onClear={() => setSearch('')}
            label="Buscar clientes"
            phrases={CUSTOMER_SEARCH_HINTS}
            filter={{
              count: countActiveFilters({
                location: locationFilter,
                products: productFilters,
                currency: currencyFilter,
                dateEnabled: dateFilterEnabled,
              }, ['location', 'products', 'currency']),
              label: 'Filtrar clientes',
              expanded: filtersOpen,
              onClick: () => setFiltersOpen(true),
            }}
          />
        </div>
      ) : null}
      {error ? <p role="alert" className="mb-4 rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p> : null}
      <motion.div key={sectionTab} className={tabMotion && !reducedMotion ? 'screen-step' : ''} {...tabShift}>
      {sectionTab === 'notices' ? (
        <>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            <NoticeDateFilter
              from={noticeDateFrom}
              to={noticeDateTo}
              onChange={(from, to) => {
                setNoticeDateFrom(from)
                setNoticeDateTo(to)
              }}
            />
          </div>
          <button
            type="button"
            onClick={() => { if (!guardPlugin(profile, 'customer_notices', navigate)) setNoticeOpen(true) }}
            disabled={readOnly}
            className="shrink-0 rounded-xl bg-brand-green px-4 py-2 text-sm font-bold text-brand-white disabled:opacity-50"
          >
            Enviar aviso
          </button>
        </div>
        {noticesLoading && !notices.length ? <LoadingState message="Cargando avisos…" /> : notices.length ? (
          <>
            <ul className="grid gap-3">
              {notices.map((notice) => (
                <li key={notice.id} className="rounded-2xl border border-brand-green/10 bg-brand-white p-4 shadow-sm lg:p-6">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <h2 className="font-bold text-brand-carmelita lg:text-lg">{notice.title}</h2>
                    <span className="text-xs text-brand-carmelita/60">{dateLabel(notice.created_at)}</span>
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-brand-carmelita/80">{notice.content}</p>
                  <p className="mt-3 text-sm font-semibold text-brand-green">{recipientLabel(notice)}</p>
                  <p className="mt-1 text-xs text-brand-carmelita/60">Leído por {notice.read_count} de {notice.recipient_count}</p>
                </li>
              ))}
            </ul>
            {noticesHasMore ? (
              <div className="mt-4 flex justify-center">
                <button type="button" onClick={loadMoreNotices} disabled={loadingMoreNotices} className="min-h-11 rounded-xl border border-brand-green/20 bg-brand-white px-5 text-sm font-semibold text-brand-green disabled:opacity-60">
                  {loadingMoreNotices ? 'Cargando…' : 'Cargar más avisos'}
                </button>
              </div>
            ) : null}
          </>
        ) : (
          <p className="rounded-2xl bg-brand-white p-5 text-sm text-brand-carmelita/70">{noticeDateFrom || noticeDateTo ? 'No hay avisos en esas fechas.' : 'Aún no has enviado avisos a tus clientes.'}</p>
        )}
        </>
      ) : loading ? <LoadingState message="Cargando clientes…" /> : customersEmpty ? <p className="rounded-2xl bg-brand-white p-5 text-sm text-brand-carmelita/70">Aún no tienes clientes registrados por pedidos.</p> : (
        <>
        {customers.length ? (
        <ul className="flex flex-col divide-y divide-neutral-300">
          {customers.map((customer) => (
            <li key={customer.id}>
              <button
                type="button"
                onClick={() => setSelectedCustomer(customer)}
                className="w-full py-3.5 text-left transition active:bg-black/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green/25"
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
      </motion.div>
      <FilterModal
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        title="Filtrar clientes"
        description="Combina ubicación, productos, moneda y fecha."
        titleId="seller-customer-filters-title"
        applyLabel="Ver clientes"
        columns={1}
        fields={[
          { key: 'location', label: 'Ubicación', placeholder: 'Todas las ubicaciones', options: locationOptions },
          { key: 'currency', label: 'Moneda', placeholder: 'Todas las monedas', options: currencyOptions },
          { key: 'products', label: 'Productos · selección múltiple', placeholder: 'Todos los productos', options: productOptions, multiple: true },
        ]}
        dateLabel="Fecha de los pedidos"
        values={{
          location: locationFilter,
          products: productFilters,
          currency: currencyFilter,
          datePeriod,
          dateRange,
          dateEnabled: dateFilterEnabled,
        }}
        emptyValues={{
          location: '',
          products: [],
          currency: '',
          ...clearedDateFilter(),
        }}
        onApply={(next) => {
          setLocationFilter(next.location)
          setProductFilters(next.products)
          setCurrencyFilter(next.currency)
          setDatePeriod(next.datePeriod)
          setDateRange(next.dateRange)
          setDateFilterEnabled(next.dateEnabled)
        }}
      />
      {noticeOpen ? (
        <CustomerNoticeModal
          onClose={() => setNoticeOpen(false)}
          onSent={() => {
            setTabDirection(1)
            setTabMotion(true)
            setSectionTab('notices')
            setNoticesRefresh((current) => current + 1)
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

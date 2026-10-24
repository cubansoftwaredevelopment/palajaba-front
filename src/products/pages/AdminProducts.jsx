import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { adminAlertError, adminFocusRing, adminSection, adminSubtle } from '../../components/admin/adminStyles'
import AdminPillSelect from '../../components/admin/AdminPillSelect'
import LoadingState from '../../components/ui/LoadingState'
import { clearAdminToken, getAdminToken } from '../../lib/adminAuth'
import { fetchAdminProducts } from '../api.js'
import { getUserFacingMessage, isSessionError } from '../../lib/userFacingError'

const PAGE_SIZE = 25

const EMPTY_FILTERS = {
  name: '',
  category: '',
  store: '',
  cost: '',
  currency: '',
  delivery: 'all',
  subscription: 'all',
  location: '',
  sales: '',
}

function uniqueLabels(values) {
  return [...new Set(values.filter(Boolean))].sort((left, right) => left.localeCompare(right, 'es'))
}

function toOptions(labels) {
  return labels.map((label) => ({ value: label, label }))
}

function maxNumber(value) {
  const text = String(value ?? '').trim().replace(',', '.')
  if (!text) return null
  const amount = Number(text)
  return Number.isFinite(amount) ? amount : null
}

function LocationSelect({ locations }) {
  const [open, setOpen] = useState(false)
  const count = locations?.length ?? 0
  const label = count === 0 ? 'Sin ubicación' : count === 1 ? '1 ubicación' : `${count} ubicaciones`

  return (
    <div>
      <button
        type="button"
        aria-expanded={open}
        disabled={count === 0}
        onClick={() => setOpen((current) => !current)}
        className={`inline-flex min-h-9 w-full items-center justify-between gap-1 rounded-full border border-brand-green/40 bg-brand-green/10 px-3 text-left text-xs font-semibold text-brand-green disabled:opacity-70 ${adminFocusRing}`}
      >
        <span className="min-w-0 truncate">{label}</span>
        {count > 0 ? (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" className={`shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}>
            <path d="m6 9 6 6 6-6" />
          </svg>
        ) : null}
      </button>
      {open && count > 0 ? (
        <div className="mt-1.5 flex flex-wrap gap-1 rounded-xl border border-brand-green/20 bg-zinc-950/40 p-1.5">
          {locations.map((item) => (
            <span
              key={item}
              className="rounded-full border border-brand-green bg-brand-green px-2.5 py-1 text-[0.65rem] font-semibold text-brand-white"
            >
              {item}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  )
}

export default function AdminProducts() {
  const navigate = useNavigate()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filters, setFilters] = useState(EMPTY_FILTERS)
  const [page, setPage] = useState(1)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError('')
      try {
        const data = await fetchAdminProducts(getAdminToken())
        if (!cancelled) setProducts(data.products ?? [])
      } catch (err) {
        if (cancelled) return
        if (isSessionError(err)) {
          clearAdminToken()
          navigate('/admin', { replace: true })
          return
        }
        setError(getUserFacingMessage(err, 'No pudimos cargar los productos.'))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [navigate])

  const visible = useMemo(
    () =>
      products.filter((product) => {
        if (filters.name && product.name !== filters.name) return false
        if (filters.category && product.category_name !== filters.category) return false
        if (filters.store && product.store_name !== filters.store) return false
        if (filters.cost) {
          const minPrice = maxNumber(filters.cost)
          if (minPrice !== null && Number(product.price) < minPrice) return false
        }
        if (filters.currency && product.currency !== filters.currency) return false
        if (filters.sales !== '') {
          const minSales = maxNumber(filters.sales)
          if (minSales !== null && Number(product.sales_count ?? 0) < minSales) return false
        }
        if (filters.delivery === 'si' && !product.offers_delivery) return false
        if (filters.delivery === 'no' && product.offers_delivery) return false
        if (filters.subscription === 'activa' && !product.subscription_active) return false
        if (filters.subscription === 'inactiva' && product.subscription_active) return false
        if (filters.location && !product.locations.includes(filters.location)) return false
        return true
      }),
    [filters, products],
  )

  const nameOptions = useMemo(() => toOptions(uniqueLabels(products.map((product) => product.name))), [products])
  const categoryOptions = useMemo(
    () => toOptions(uniqueLabels(products.map((product) => product.category_name))),
    [products],
  )
  const storeOptions = useMemo(
    () => toOptions(uniqueLabels(products.map((product) => product.store_name))),
    [products],
  )
  const locationOptions = useMemo(
    () => toOptions(uniqueLabels(products.flatMap((product) => product.locations))),
    [products],
  )
  const currencyOptions = useMemo(
    () => toOptions(uniqueLabels(products.map((product) => product.currency || 'CUP'))),
    [products],
  )

  const pageCount = Math.max(1, Math.ceil(visible.length / PAGE_SIZE))
  const currentPage = Math.min(page, pageCount)
  const pageStart = visible.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE
  const pageItems = visible.slice(pageStart, pageStart + PAGE_SIZE)

  const numberInput =
    'w-full min-h-9 rounded-full border border-brand-green/40 bg-brand-green/10 px-3 text-xs font-semibold text-brand-green outline-none placeholder:text-brand-green/45 focus:border-brand-green'

  function updateFilter(field, value) {
    setFilters((current) => ({ ...current, [field]: value }))
    setPage(1)
  }

  return (
    <div className={adminSection}>
      <p className={`mb-4 text-sm leading-relaxed ${adminSubtle}`}>
        {loading
          ? 'Cargando productos…'
          : visible.length === 0
            ? `0 de ${products.length} productos`
            : `${pageStart + 1}–${pageStart + pageItems.length} de ${visible.length} productos`}
      </p>

      {error ? (
        <p className={`mb-4 ${adminAlertError}`} role="alert">
          {error}
        </p>
      ) : null}

      {loading ? <LoadingState variant="admin" message="Cargando productos…" /> : null}

      {!loading && !error ? (
        <div className="overflow-x-auto rounded-2xl border border-brand-green/10">
          <table className="w-full min-w-[48rem] table-fixed border-collapse text-left text-sm xl:min-w-full">
            <colgroup>
              <col className="w-[14%]" />
              <col className="w-[11%]" />
              <col className="w-[13%]" />
              <col className="w-[10%]" />
              <col className="w-[8%]" />
              <col className="w-[8%]" />
              <col className="w-[8%]" />
              <col className="w-[10%]" />
              <col />
            </colgroup>
            <thead>
              <tr className="border-b border-zinc-800 text-[0.65rem] font-semibold uppercase tracking-wide text-zinc-400">
                <th className="px-3 py-2">Nombre</th>
                <th className="px-3 py-2">Categoría</th>
                <th className="px-3 py-2">Negocio</th>
                <th className="px-3 py-2">Costo</th>
                <th className="px-3 py-2">Moneda</th>
                <th className="px-3 py-2">Ventas</th>
                <th className="px-3 py-2">Domicilio</th>
                <th className="px-3 py-2">Suscripción</th>
                <th className="px-3 py-2">Ubicaciones disponibles</th>
              </tr>
              <tr className="border-b border-zinc-800 bg-zinc-950/40">
                <th className="px-2 py-2">
                  <AdminPillSelect
                    value={filters.name}
                    onChange={(value) => updateFilter('name', value)}
                    options={nameOptions}
                    allLabel="Todos"
                    ariaLabel="Filtrar por nombre"
                  />
                </th>
                <th className="px-2 py-2">
                  <AdminPillSelect
                    value={filters.category}
                    onChange={(value) => updateFilter('category', value)}
                    options={categoryOptions}
                    allLabel="Todas"
                    ariaLabel="Filtrar por categoría"
                  />
                </th>
                <th className="px-2 py-2">
                  <AdminPillSelect
                    value={filters.store}
                    onChange={(value) => updateFilter('store', value)}
                    options={storeOptions}
                    allLabel="Todos"
                    ariaLabel="Filtrar por negocio"
                  />
                </th>
                <th className="px-2 py-2">
                  <input
                    value={filters.cost}
                    onChange={(event) => updateFilter('cost', event.target.value)}
                    className={numberInput}
                    placeholder="≥ costo"
                    aria-label="Filtrar por costo igual o mayor"
                    inputMode="decimal"
                  />
                </th>
                <th className="px-2 py-2">
                  <AdminPillSelect
                    value={filters.currency}
                    onChange={(value) => updateFilter('currency', value)}
                    options={currencyOptions}
                    allLabel="Todas"
                    ariaLabel="Filtrar por moneda"
                  />
                </th>
                <th className="px-2 py-2">
                  <input
                    value={filters.sales}
                    onChange={(event) => updateFilter('sales', event.target.value)}
                    className={numberInput}
                    placeholder="≥ ventas"
                    aria-label="Filtrar por ventas iguales o mayores"
                    inputMode="numeric"
                  />
                </th>
                <th className="px-2 py-2">
                  <AdminPillSelect
                    value={filters.delivery === 'all' ? '' : filters.delivery}
                    onChange={(value) => updateFilter('delivery', value || 'all')}
                    options={[
                      { value: 'si', label: 'Sí' },
                      { value: 'no', label: 'No' },
                    ]}
                    allLabel="Todos"
                    ariaLabel="Filtrar por domicilio"
                  />
                </th>
                <th className="px-2 py-2">
                  <AdminPillSelect
                    value={filters.subscription === 'all' ? '' : filters.subscription}
                    onChange={(value) => updateFilter('subscription', value || 'all')}
                    options={[
                      { value: 'activa', label: 'Activa' },
                      { value: 'inactiva', label: 'Inactiva' },
                    ]}
                    allLabel="Todas"
                    ariaLabel="Filtrar por suscripción"
                  />
                </th>
                <th className="px-2 py-2">
                  <AdminPillSelect
                    value={filters.location}
                    onChange={(value) => updateFilter('location', value)}
                    options={locationOptions}
                    allLabel="Todas"
                    ariaLabel="Filtrar por ubicación"
                  />
                </th>
              </tr>
            </thead>
            <tbody>
              {pageItems.length === 0 ? (
                <tr>
                  <td colSpan={9} className={`px-3 py-8 text-center text-sm ${adminSubtle}`}>
                    Ningún producto coincide con estos filtros.
                  </td>
                </tr>
              ) : (
                pageItems.map((product) => (
                  <tr key={product.id} className="border-b border-zinc-800/80 align-top">
                    <td className="px-3 py-3 font-medium break-words text-zinc-50">{product.name}</td>
                    <td className="px-3 py-3 break-words text-zinc-300">{product.category_name}</td>
                    <td className="px-3 py-3 break-words text-zinc-300">{product.store_name}</td>
                    <td className="px-3 py-3 tabular-nums text-zinc-100">
                      {Number(product.price).toLocaleString('es')}
                    </td>
                    <td className="px-3 py-3 font-semibold text-brand-green">{product.currency || 'CUP'}</td>
                    <td className="px-3 py-3 tabular-nums text-zinc-100">{product.sales_count ?? 0}</td>
                    <td className="px-3 py-3 text-zinc-300">{product.offers_delivery ? 'Sí' : 'No'}</td>
                    <td className="px-3 py-3 text-zinc-300">
                      {product.subscription_active ? 'Activa' : 'Inactiva'}
                    </td>
                    <td className="px-3 py-3">
                      <LocationSelect locations={product.locations} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : null}

      {!loading && !error && visible.length > 0 ? (
        <div className="mt-4 flex items-center justify-between gap-3">
          <p className={`text-sm ${adminSubtle}`}>
            Página {currentPage} de {pageCount}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              className="inline-flex min-h-9 items-center rounded-xl border border-zinc-800/90 bg-zinc-900/70 px-3 text-xs font-medium text-zinc-100 disabled:opacity-40"
              disabled={currentPage <= 1}
              onClick={() => setPage(currentPage - 1)}
            >
              Anterior
            </button>
            <button
              type="button"
              className="inline-flex min-h-9 items-center rounded-xl border border-zinc-800/90 bg-zinc-900/70 px-3 text-xs font-medium text-zinc-100 disabled:opacity-40"
              disabled={currentPage >= pageCount}
              onClick={() => setPage(currentPage + 1)}
            >
              Siguiente
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}

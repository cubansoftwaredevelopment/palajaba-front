import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { adminAlertError, adminInput, adminMuted, adminSubtle } from '../components/admin/adminStyles'
import LoadingState from '../components/ui/LoadingState'
import { clearAdminToken, getAdminToken } from '../lib/adminAuth'
import { fetchAdminProducts } from '../lib/api'
import { formatPrice } from '../lib/money'
import { getUserFacingMessage, isSessionError } from '../lib/userFacingError'

const EMPTY_FILTERS = {
  name: '',
  category: '',
  store: '',
  cost: '',
  delivery: 'all',
  subscription: 'all',
  location: '',
}

function includesText(value, query) {
  const needle = query.trim().toLowerCase()
  if (!needle) return true
  return String(value ?? '').toLowerCase().includes(needle)
}

function matchesCost(product, query) {
  const needle = query.trim().toLowerCase().replace(',', '.')
  if (!needle) return true
  const amount = String(product.price)
  const label = formatPrice(product.price, product.currency).toLowerCase()
  return amount.includes(needle) || label.includes(needle) || product.currency.toLowerCase().includes(needle)
}

function LocationChips({ locations }) {
  if (!locations?.length) {
    return <span className={`text-xs ${adminMuted}`}>Sin ubicación</span>
  }
  return (
    <div
      className="flex min-w-44 flex-wrap gap-1 rounded-xl border border-brand-green/20 bg-zinc-950/40 p-1.5"
      aria-readonly="true"
    >
      {locations.map((label) => (
        <span
          key={label}
          className="rounded-full border border-brand-green bg-brand-green px-2.5 py-1 text-[0.65rem] font-semibold text-brand-white"
        >
          {label}
        </span>
      ))}
    </div>
  )
}

export default function AdminProducts() {
  const navigate = useNavigate()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filters, setFilters] = useState(EMPTY_FILTERS)

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
        if (!includesText(product.name, filters.name)) return false
        if (!includesText(product.category_name, filters.category)) return false
        if (!includesText(product.store_name, filters.store)) return false
        if (!matchesCost(product, filters.cost)) return false
        if (filters.delivery === 'si' && !product.offers_delivery) return false
        if (filters.delivery === 'no' && product.offers_delivery) return false
        if (filters.subscription === 'activa' && !product.subscription_active) return false
        if (filters.subscription === 'inactiva' && product.subscription_active) return false
        if (filters.location.trim()) {
          const needle = filters.location.trim().toLowerCase()
          if (!product.locations.some((label) => label.toLowerCase().includes(needle))) return false
        }
        return true
      }),
    [filters, products],
  )

  function updateFilter(field, value) {
    setFilters((current) => ({ ...current, [field]: value }))
  }

  const filterInput = `${adminInput} min-h-9 px-2 py-1.5 text-xs`

  return (
    <div className="w-full px-4 pb-28 pt-5 sm:px-6">
      <p className={`mb-4 text-sm leading-relaxed ${adminSubtle}`}>
        {loading ? 'Cargando productos…' : `${visible.length} de ${products.length} productos`}
      </p>

      {error ? (
        <p className={`mb-4 ${adminAlertError}`} role="alert">
          {error}
        </p>
      ) : null}

      {loading ? <LoadingState variant="admin" message="Cargando productos…" /> : null}

      {!loading && !error ? (
        <div className="overflow-x-auto rounded-2xl border border-brand-green/10">
          <table className="w-full min-w-[64rem] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-800 text-[0.65rem] font-semibold uppercase tracking-wide text-zinc-400">
                <th className="px-3 py-2">Nombre</th>
                <th className="px-3 py-2">Categoría</th>
                <th className="px-3 py-2">Negocio</th>
                <th className="px-3 py-2">Costo</th>
                <th className="px-3 py-2">Domicilio</th>
                <th className="px-3 py-2">Suscripción</th>
                <th className="px-3 py-2">Ubicaciones disponibles</th>
              </tr>
              <tr className="border-b border-zinc-800 bg-zinc-950/40">
                <th className="px-2 py-2">
                  <input
                    value={filters.name}
                    onChange={(event) => updateFilter('name', event.target.value)}
                    className={filterInput}
                    placeholder="Filtrar nombre"
                    aria-label="Filtrar por nombre"
                  />
                </th>
                <th className="px-2 py-2">
                  <input
                    value={filters.category}
                    onChange={(event) => updateFilter('category', event.target.value)}
                    className={filterInput}
                    placeholder="Filtrar categoría"
                    aria-label="Filtrar por categoría"
                  />
                </th>
                <th className="px-2 py-2">
                  <input
                    value={filters.store}
                    onChange={(event) => updateFilter('store', event.target.value)}
                    className={filterInput}
                    placeholder="Filtrar negocio"
                    aria-label="Filtrar por negocio"
                  />
                </th>
                <th className="px-2 py-2">
                  <input
                    value={filters.cost}
                    onChange={(event) => updateFilter('cost', event.target.value)}
                    className={filterInput}
                    placeholder="Filtrar costo"
                    aria-label="Filtrar por costo"
                    inputMode="decimal"
                  />
                </th>
                <th className="px-2 py-2">
                  <select
                    value={filters.delivery}
                    onChange={(event) => updateFilter('delivery', event.target.value)}
                    className={filterInput}
                    aria-label="Filtrar por domicilio"
                  >
                    <option value="all">Todos</option>
                    <option value="si">Sí</option>
                    <option value="no">No</option>
                  </select>
                </th>
                <th className="px-2 py-2">
                  <select
                    value={filters.subscription}
                    onChange={(event) => updateFilter('subscription', event.target.value)}
                    className={filterInput}
                    aria-label="Filtrar por suscripción"
                  >
                    <option value="all">Todas</option>
                    <option value="activa">Activa</option>
                    <option value="inactiva">Inactiva</option>
                  </select>
                </th>
                <th className="px-2 py-2">
                  <input
                    value={filters.location}
                    onChange={(event) => updateFilter('location', event.target.value)}
                    className={filterInput}
                    placeholder="Filtrar ubicación"
                    aria-label="Filtrar por ubicación"
                  />
                </th>
              </tr>
            </thead>
            <tbody>
              {visible.length === 0 ? (
                <tr>
                  <td colSpan={7} className={`px-3 py-8 text-center text-sm ${adminSubtle}`}>
                    Ningún producto coincide con estos filtros.
                  </td>
                </tr>
              ) : (
                visible.map((product) => (
                  <tr key={product.id} className="border-b border-zinc-800/80 align-top">
                    <td className="px-3 py-3 font-medium text-zinc-50">{product.name}</td>
                    <td className="px-3 py-3 text-zinc-300">{product.category_name}</td>
                    <td className="px-3 py-3 text-zinc-300">{product.store_name}</td>
                    <td className="px-3 py-3 tabular-nums text-zinc-100">
                      {formatPrice(product.price, product.currency)}
                    </td>
                    <td className="px-3 py-3 text-zinc-300">{product.offers_delivery ? 'Sí' : 'No'}</td>
                    <td className="px-3 py-3 text-zinc-300">
                      {product.subscription_active ? 'Activa' : 'Inactiva'}
                    </td>
                    <td className="px-3 py-3">
                      <LocationChips locations={product.locations} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  )
}

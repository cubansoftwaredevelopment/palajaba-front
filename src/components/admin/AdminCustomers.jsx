import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AdminAppDownloadsCell, { formatAppDownloadsText } from './AdminAppDownloadsCell'
import AdminPillSelect from './AdminPillSelect'
import ConfirmDialog from './ConfirmDialog'
import AdminSelect from './AdminSelect'
import {
  adminAlertError,
  adminBadgeApproved,
  adminBadgeRejected,
  adminInput,
  adminSubtle,
} from './adminStyles'
import { fetchAdminCustomers, updateAdminCustomerAccess } from '../../auth/api.js'
import { formatDateTime } from '../../lib/dates'
import { getUserFacingMessage, isSessionError } from '../../lib/userFacingError'
import { clearAdminToken, getAdminToken } from '../../lib/adminAuth'
import LoadingState from '../ui/LoadingState'

const PAGE_SIZES = [10, 15, 20]
const PAGE_SIZE_OPTIONS = PAGE_SIZES.map((size) => ({ value: String(size), label: `${size} por página` }))
const pagerButton =
  'inline-flex min-h-9 items-center rounded-xl border border-zinc-800/90 bg-zinc-900/70 px-3 text-xs font-medium text-zinc-100 disabled:opacity-40'
const actionButton =
  'inline-flex min-h-9 items-center rounded-xl border border-zinc-700 px-3 text-xs font-semibold text-zinc-100 transition-colors hover:border-zinc-500 disabled:opacity-40'
const EMPTY_FILTERS = {
  customer: '',
  phone: '',
  qvapay: '',
  identity: '',
  created: '',
  orders: '',
  app: '',
  access: 'all',
}

function includesText(value, query) {
  const needle = query.trim().toLowerCase()
  if (!needle) return true
  return String(value ?? '').toLowerCase().includes(needle)
}

export default function AdminCustomers() {
  const navigate = useNavigate()
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filters, setFilters] = useState(EMPTY_FILTERS)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [pending, setPending] = useState(null)
  const [saving, setSaving] = useState(false)

  const loadCustomers = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await fetchAdminCustomers(getAdminToken())
      setCustomers(Array.isArray(data) ? data : [])
    } catch (err) {
      if (isSessionError(err)) {
        clearAdminToken()
        navigate('/admin', { replace: true })
        return
      }
      setError(getUserFacingMessage(err, 'No pudimos cargar los clientes. Inténtalo de nuevo.'))
    } finally {
      setLoading(false)
    }
  }, [navigate])

  useEffect(() => {
    loadCustomers()
  }, [loadCustomers])

  const filtered = useMemo(
    () => customers.filter((item) => {
      if (!includesText(item.full_name, filters.customer) && !includesText(item.email, filters.customer)) return false
      if (!includesText(item.phone, filters.phone)) return false
      if (!includesText(item.qvapay_username, filters.qvapay)) return false
      if (!includesText(item.identity_card, filters.identity)) return false
      if (!includesText(item.created_at ? formatDateTime(item.created_at) : '', filters.created)) return false
      if (!includesText(item.order_count ?? 0, filters.orders)) return false
      if (!includesText(formatAppDownloadsText(item.app_downloads), filters.app)) return false
      if (filters.access === 'revoked' && !item.purchase_revoked) return false
      if (filters.access === 'allowed' && item.purchase_revoked) return false
      return true
    }),
    [customers, filters],
  )

  useEffect(() => {
    setPage(1)
  }, [pageSize, filters])

  function updateFilter(field, value) {
    setFilters((current) => ({ ...current, [field]: value }))
    setPage(1)
  }

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize))
  const currentPage = Math.min(page, pageCount)
  const pageStart = filtered.length === 0 ? 0 : (currentPage - 1) * pageSize
  const pageItems = filtered.slice(pageStart, pageStart + pageSize)
  const filterInput = `${adminInput} min-h-9 px-2 py-1.5 text-xs`

  async function confirmAccessChange() {
    if (!pending) return
    setSaving(true)
    setError('')
    try {
      const updated = await updateAdminCustomerAccess(
        getAdminToken(),
        pending.id,
        !pending.purchase_revoked,
      )
      setCustomers((current) => current.map((item) => (item.id === updated.id ? updated : item)))
      setPending(null)
    } catch (err) {
      if (isSessionError(err)) {
        clearAdminToken()
        navigate('/admin', { replace: true })
        return
      }
      setError(getUserFacingMessage(err, 'No pudimos actualizar el acceso del cliente.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <p className={`mb-4 text-sm leading-relaxed ${adminSubtle}`}>
        {loading
          ? 'Cargando clientes…'
          : filtered.length === 0
            ? `0 de ${customers.length} clientes`
            : `${pageStart + 1}–${pageStart + pageItems.length} de ${filtered.length} clientes`}
      </p>

      {error ? (
        <p className={`mb-4 ${adminAlertError}`} role="alert">{error}</p>
      ) : null}

      {loading ? <LoadingState variant="admin" message="Cargando clientes…" /> : (
        <div className="overflow-x-auto rounded-2xl border border-brand-green/10">
          <table className="w-full min-w-[60rem] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-800 text-[0.65rem] font-semibold uppercase tracking-wide text-zinc-400">
                <th className="px-3 py-2">Cliente</th>
                <th className="px-3 py-2">Teléfono</th>
                <th className="px-3 py-2">QvaPay</th>
                <th className="px-3 py-2">Carnet</th>
                <th className="px-3 py-2">Alta</th>
                <th className="px-3 py-2">Pedidos</th>
                <th className="px-3 py-2">Dispositivo</th>
                <th className="px-3 py-2">Acceso</th>
                <th className="px-3 py-2">Acciones</th>
              </tr>
              <tr className="border-b border-zinc-800 bg-zinc-950/40">
                <th className="px-2 py-2">
                  <input
                    value={filters.customer}
                    onChange={(event) => updateFilter('customer', event.target.value)}
                    className={filterInput}
                    placeholder="Filtrar cliente"
                    aria-label="Filtrar por cliente"
                  />
                </th>
                <th className="px-2 py-2">
                  <input
                    value={filters.phone}
                    onChange={(event) => updateFilter('phone', event.target.value)}
                    className={filterInput}
                    placeholder="Filtrar teléfono"
                    aria-label="Filtrar por teléfono"
                  />
                </th>
                <th className="px-2 py-2">
                  <input
                    value={filters.qvapay}
                    onChange={(event) => updateFilter('qvapay', event.target.value)}
                    className={filterInput}
                    placeholder="Filtrar QvaPay"
                    aria-label="Filtrar por usuario de QvaPay"
                  />
                </th>
                <th className="px-2 py-2">
                  <input
                    value={filters.identity}
                    onChange={(event) => updateFilter('identity', event.target.value)}
                    className={filterInput}
                    placeholder="Filtrar carnet"
                    aria-label="Filtrar por carnet"
                  />
                </th>
                <th className="px-2 py-2">
                  <input
                    value={filters.created}
                    onChange={(event) => updateFilter('created', event.target.value)}
                    className={filterInput}
                    placeholder="Filtrar fecha"
                    aria-label="Filtrar por fecha de alta"
                  />
                </th>
                <th className="px-2 py-2">
                  <input
                    value={filters.orders}
                    onChange={(event) => updateFilter('orders', event.target.value)}
                    className={filterInput}
                    placeholder="Filtrar pedidos"
                    aria-label="Filtrar por cantidad de pedidos"
                  />
                </th>
                <th className="px-2 py-2">
                  <input
                    value={filters.app}
                    onChange={(event) => updateFilter('app', event.target.value)}
                    className={filterInput}
                    placeholder="Android / iOS"
                    aria-label="Filtrar por dispositivo"
                  />
                </th>
                <th className="px-2 py-2">
                  <AdminPillSelect
                    value={filters.access === 'all' ? '' : filters.access}
                    onChange={(value) => updateFilter('access', value || 'all')}
                    allLabel="Todos"
                    ariaLabel="Filtrar por acceso"
                    options={[
                      { value: 'allowed', label: 'Puede comprar' },
                      { value: 'revoked', label: 'Revocado' },
                    ]}
                  />
                </th>
                <th className="px-2 py-2" />
              </tr>
            </thead>
            <tbody>
              {pageItems.length === 0 ? (
                <tr>
                  <td colSpan={9} className={`px-3 py-8 text-center text-sm ${adminSubtle}`}>
                    {customers.length === 0 ? 'Aún no hay clientes.' : 'Ningún cliente coincide con este filtro.'}
                  </td>
                </tr>
              ) : pageItems.map((item) => (
                <tr key={item.id} className="border-b border-zinc-800/80 align-top">
                  <td className="px-3 py-3 font-medium text-zinc-50">
                    <div>{item.full_name}</div>
                    {item.email ? (
                      <div className="mt-1 text-xs font-normal break-all text-zinc-400">{item.email}</div>
                    ) : null}
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap text-zinc-300">{item.phone || '—'}</td>
                  <td className="px-3 py-3 font-mono text-xs break-all text-zinc-300">{item.qvapay_username || '—'}</td>
                  <td className="px-3 py-3 whitespace-nowrap text-zinc-300">{item.identity_card || '—'}</td>
                  <td className="px-3 py-3 whitespace-nowrap text-zinc-300">
                    {item.created_at ? formatDateTime(item.created_at) : '—'}
                  </td>
                  <td className="px-3 py-3 tabular-nums text-zinc-100">{item.order_count ?? 0}</td>
                  <td className="px-3 py-3">
                    <AdminAppDownloadsCell downloads={item.app_downloads} />
                  </td>
                  <td className="px-3 py-3">
                    <span className={item.purchase_revoked ? adminBadgeRejected : adminBadgeApproved}>
                      {item.purchase_revoked ? 'Revocado' : 'Puede comprar'}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <button
                      type="button"
                      className={actionButton}
                      onClick={() => setPending(item)}
                    >
                      {item.purchase_revoked ? 'Restaurar acceso' : 'Revocar acceso'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && filtered.length > 0 ? (
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className={`text-sm ${adminSubtle}`}>Página {currentPage} de {pageCount}</p>
          <div className="flex flex-wrap items-center gap-2">
            <AdminSelect
              className="w-[9.5rem]"
              triggerClassName="min-h-9 py-1.5 text-xs"
              ariaLabel="Clientes por página"
              value={String(pageSize)}
              onChange={(value) => setPageSize(Number(value))}
              options={PAGE_SIZE_OPTIONS}
            />
            <button type="button" className={pagerButton} disabled={currentPage <= 1} onClick={() => setPage((current) => current - 1)}>
              Anterior
            </button>
            <button type="button" className={pagerButton} disabled={currentPage >= pageCount} onClick={() => setPage((current) => current + 1)}>
              Siguiente
            </button>
          </div>
        </div>
      ) : null}

      {pending ? (
        <ConfirmDialog
          title={pending.purchase_revoked ? 'Restaurar acceso' : 'Revocar acceso'}
          subtitle={pending.full_name}
          confirmLabel={pending.purchase_revoked ? 'Restaurar acceso' : 'Revocar acceso'}
          confirmVariant={pending.purchase_revoked ? 'primary' : 'danger'}
          loading={saving}
          onConfirm={confirmAccessChange}
          onClose={() => { if (!saving) setPending(null) }}
        >
          <p className="text-sm text-zinc-300">
            {pending.purchase_revoked
              ? 'El cliente podrá volver a hacer pedidos.'
              : 'El cliente podrá entrar a su cuenta y ver sus pedidos, pero no podrá comprar.'}
          </p>
        </ConfirmDialog>
      ) : null}
    </>
  )
}

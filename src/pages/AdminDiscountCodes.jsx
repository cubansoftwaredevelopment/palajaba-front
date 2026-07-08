import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AdminButton from '../components/admin/AdminButton'
import AdminDiscountCodeCard from '../components/admin/AdminDiscountCodeCard'
import AdminDiscountCodeForm from '../components/admin/AdminDiscountCodeForm'
import ConfirmDialog from '../components/admin/ConfirmDialog'
import {
  adminAlertError,
  adminAlertSuccess,
  adminCard,
  adminCardHighlight,
  adminFocusRing,
  adminInput,
  adminMuted,
  adminSubtle,
} from '../components/admin/adminStyles'
import {
  createAdminDiscountCode,
  deleteAdminDiscountCode,
  fetchAdminDiscountCodes,
  updateAdminDiscountCode,
} from '../lib/api'
import { getUserFacingMessage, isSessionError } from '../lib/userFacingError'
import { clearAdminToken, getAdminToken } from '../lib/adminAuth'
import LoadingState from '../components/ui/LoadingState'

const FILTER_TABS = [
  { id: 'all', label: 'Todos' },
  { id: 'active', label: 'Activos' },
  { id: 'inactive', label: 'Inactivos' },
]

function filterTabClass(active) {
  return `rounded-xl border px-3 py-2 text-xs font-medium transition-colors sm:text-sm ${adminFocusRing} ${
    active
      ? 'border-brand-green/40 bg-brand-green/12 text-brand-green'
      : 'border-zinc-800 bg-zinc-900/50 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
  }`
}

function SummaryCard({ label, value, hint, accentClass }) {
  return (
    <article className={`${adminCard} border-t-2 ${accentClass}`}>
      <p className={`text-xs font-medium uppercase tracking-wide ${adminMuted}`}>{label}</p>
      <p className="mt-2 text-3xl font-semibold tabular-nums text-zinc-50">{value}</p>
      <p className={`mt-2 text-xs leading-relaxed ${adminSubtle}`}>{hint}</p>
    </article>
  )
}

function matchesFilter(item, filter) {
  if (filter === 'active') return item.is_active
  if (filter === 'inactive') return !item.is_active
  return true
}

function matchesSearch(item, query) {
  const normalized = query.trim().toLowerCase()
  if (!normalized) return true
  return item.code.toLowerCase().includes(normalized)
}

export default function AdminDiscountCodes() {
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [actionId, setActionId] = useState(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')

  const loadCodes = useCallback(async () => {
    setError('')
    setLoading(true)
    try {
      const token = getAdminToken()
      const data = await fetchAdminDiscountCodes(token)
      setItems(data)
    } catch (err) {
      if (isSessionError(err)) {
        clearAdminToken()
        navigate('/admin', { replace: true })
        return
      }
      setError(getUserFacingMessage(err, 'No pudimos cargar los códigos.'))
    } finally {
      setLoading(false)
    }
  }, [navigate])

  useEffect(() => {
    loadCodes()
  }, [loadCodes])

  const stats = useMemo(() => {
    const activeCount = items.filter((item) => item.is_active).length
    return {
      total: items.length,
      activeCount,
      inactiveCount: items.length - activeCount,
    }
  }, [items])

  const visibleItems = useMemo(
    () =>
      items
        .filter((item) => matchesFilter(item, filter))
        .filter((item) => matchesSearch(item, search))
        .sort((a, b) => a.code.localeCompare(b.code)),
    [filter, items, search],
  )

  async function handleCreate(payload) {
    setActionId('create')
    setSuccess('')
    setError('')
    try {
      const token = getAdminToken()
      const created = await createAdminDiscountCode(token, payload)
      setItems((current) => [...current, created].sort((a, b) => a.code.localeCompare(b.code)))
      setCreateOpen(false)
      setSuccess('Código creado.')
    } catch (err) {
      if (isSessionError(err)) {
        clearAdminToken()
        navigate('/admin', { replace: true })
        return
      }
      setError(getUserFacingMessage(err, 'No pudimos crear el código.'))
      throw err
    } finally {
      setActionId(null)
    }
  }

  async function handleUpdate(payload) {
    if (!editTarget) return
    setActionId(editTarget.id)
    setSuccess('')
    setError('')
    try {
      const token = getAdminToken()
      const updated = await updateAdminDiscountCode(token, editTarget.id, payload)
      setItems((current) =>
        current
          .map((row) => (row.id === updated.id ? updated : row))
          .sort((a, b) => a.code.localeCompare(b.code)),
      )
      setEditTarget(null)
      setSuccess('Código actualizado.')
    } catch (err) {
      if (isSessionError(err)) {
        clearAdminToken()
        navigate('/admin', { replace: true })
        return
      }
      setError(getUserFacingMessage(err, 'No pudimos actualizar el código.'))
      throw err
    } finally {
      setActionId(null)
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    setActionId(deleteTarget.id)
    setSuccess('')
    setError('')
    try {
      const token = getAdminToken()
      await deleteAdminDiscountCode(token, deleteTarget.id)
      setItems((current) => current.filter((row) => row.id !== deleteTarget.id))
      setDeleteTarget(null)
      setSuccess('Código eliminado.')
    } catch (err) {
      if (isSessionError(err)) {
        clearAdminToken()
        navigate('/admin', { replace: true })
        return
      }
      setError(getUserFacingMessage(err, 'No pudimos eliminar el código.'))
    } finally {
      setActionId(null)
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-5 pb-28 sm:px-6">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className={`text-sm leading-relaxed ${adminSubtle}`}>
            Gestiona los códigos promocionales que los vendedores pueden aplicar durante el registro.
          </p>
          <p className={`mt-2 text-xs ${adminMuted}`}>
            {stats.activeCount > 0
              ? `${stats.activeCount} código${stats.activeCount === 1 ? '' : 's'} activo${stats.activeCount === 1 ? '' : 's'} visible${stats.activeCount === 1 ? '' : 's'} en el registro.`
              : 'Sin códigos activos: el registro no mostrará el campo de descuento.'}
          </p>
        </div>
        <AdminButton type="button" className="sm:w-auto sm:shrink-0" onClick={() => setCreateOpen(true)}>
          Nuevo código
        </AdminButton>
      </div>

      {!loading && items.length > 0 ? (
        <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <SummaryCard
            label="Total"
            value={stats.total}
            hint="Códigos guardados en la plataforma."
            accentClass="border-t-zinc-500/70"
          />
          <SummaryCard
            label="Activos"
            value={stats.activeCount}
            hint="Visibles para nuevos registros."
            accentClass="border-t-brand-green"
          />
          <SummaryCard
            label="Inactivos"
            value={stats.inactiveCount}
            hint="Archivados sin mostrarse al público."
            accentClass="border-t-zinc-600"
          />
        </div>
      ) : null}

      {!loading && items.length > 0 ? (
        <div className={`${adminCardHighlight} mb-4 flex flex-col gap-3 sm:flex-row sm:items-center`}>
          <div className="min-w-0 flex-1">
            <label htmlFor="discount-code-search" className="sr-only">
              Buscar código
            </label>
            <input
              id="discount-code-search"
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por código…"
              className={adminInput}
              autoComplete="off"
            />
          </div>
          <AdminButton
            type="button"
            variant="secondary"
            className="sm:w-auto sm:shrink-0"
            onClick={() => loadCodes()}
            disabled={loading}
          >
            Actualizar
          </AdminButton>
        </div>
      ) : null}

      {!loading && items.length > 0 ? (
        <div className="mb-4 flex flex-wrap gap-2">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilter(tab.id)}
              className={filterTabClass(filter === tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      ) : null}

      {success ? (
        <p className={`mb-4 ${adminAlertSuccess}`} role="status">
          {success}
        </p>
      ) : null}

      {error ? (
        <p className={`mb-4 ${adminAlertError}`} role="alert">
          {error}
        </p>
      ) : null}

      {loading ? <LoadingState variant="admin" message="Cargando códigos…" /> : null}

      {!loading && items.length === 0 ? (
        <article className={`${adminCard} text-center`}>
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-brand-green/20 bg-brand-green/10 text-brand-green">
            <span className="text-xl font-bold">%</span>
          </div>
          <p className="text-sm font-medium text-white">Aún no hay códigos de descuento</p>
          <p className={`mt-2 text-sm ${adminSubtle}`}>
            Crea el primero para que los vendedores puedan aplicarlo al registrarse.
          </p>
          <AdminButton type="button" className="mx-auto mt-5 max-w-xs" onClick={() => setCreateOpen(true)}>
            Crear primer código
          </AdminButton>
        </article>
      ) : null}

      {!loading && items.length > 0 && visibleItems.length === 0 ? (
        <article className={`${adminCard} text-center`}>
          <p className="text-sm font-medium text-white">No hay códigos en esta vista</p>
          <p className={`mt-2 text-sm ${adminSubtle}`}>
            Prueba otro filtro o limpia la búsqueda.
          </p>
        </article>
      ) : null}

      {!loading && visibleItems.length > 0 ? (
        <ul className="flex flex-col gap-3">
          {visibleItems.map((item) => (
            <AdminDiscountCodeCard
              key={item.id}
              item={item}
              busy={actionId === item.id}
              onEdit={setEditTarget}
              onDelete={setDeleteTarget}
            />
          ))}
        </ul>
      ) : null}

      {createOpen ? (
        <AdminDiscountCodeForm
          onClose={() => setCreateOpen(false)}
          onSubmit={handleCreate}
          submitLabel="Crear código"
          loading={actionId === 'create'}
        />
      ) : null}

      {editTarget ? (
        <AdminDiscountCodeForm
          initial={editTarget}
          onClose={() => setEditTarget(null)}
          onSubmit={handleUpdate}
          submitLabel="Guardar cambios"
          loading={actionId === editTarget.id}
        />
      ) : null}

      {deleteTarget ? (
        <ConfirmDialog
          title="Eliminar código"
          subtitle={deleteTarget.code}
          confirmLabel="Eliminar"
          confirmVariant="danger"
          loading={actionId === deleteTarget.id}
          onClose={() => setDeleteTarget(null)}
          onConfirm={confirmDelete}
        >
          <p className={`text-sm ${adminSubtle}`}>
            Los nuevos registros ya no podrán usar este código. Esta acción no se puede deshacer.
          </p>
        </ConfirmDialog>
      ) : null}
    </div>
  )
}

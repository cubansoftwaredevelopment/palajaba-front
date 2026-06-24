import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AdminButton from '../components/admin/AdminButton'
import AdminModal from '../components/admin/AdminModal'
import ConfirmDialog from '../components/admin/ConfirmDialog'
import {
  adminAlertError,
  adminAlertSuccess,
  adminCard,
  adminFocusRing,
  adminInput,
  adminLabel,
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

function DiscountCodeForm({ initial, onSubmit, onClose, submitLabel, loading }) {
  const [code, setCode] = useState(initial?.code ?? '')
  const [percentOff, setPercentOff] = useState(String(initial?.percent_off ?? ''))
  const [isActive, setIsActive] = useState(initial?.is_active ?? true)
  const [error, setError] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()
    const parsedPercent = Number.parseInt(percentOff, 10)
    if (!code.trim()) {
      setError('El código es obligatorio.')
      return
    }
    if (!Number.isFinite(parsedPercent) || parsedPercent < 1 || parsedPercent > 100) {
      setError('El descuento debe estar entre 1 y 100.')
      return
    }

    setError('')
    await onSubmit({
      code: code.trim().toUpperCase(),
      percent_off: parsedPercent,
      is_active: isActive,
    })
  }

  return (
    <AdminModal
      title={initial ? 'Editar código' : 'Nuevo código de descuento'}
      subtitle={initial ? initial.code : 'Los vendedores lo usarán al registrarse'}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label htmlFor="discount-code-value" className={adminLabel}>
            Código
          </label>
          <input
            id="discount-code-value"
            type="text"
            value={code}
            onChange={(event) => setCode(event.target.value.toUpperCase())}
            className={adminInput}
            placeholder="Ej. AMIGO20"
            required
          />
        </div>

        <div>
          <label htmlFor="discount-code-percent" className={adminLabel}>
            Descuento (%)
          </label>
          <input
            id="discount-code-percent"
            type="number"
            min={1}
            max={100}
            value={percentOff}
            onChange={(event) => setPercentOff(event.target.value)}
            className={adminInput}
            required
          />
        </div>

        <label className="flex items-center gap-2 text-sm text-zinc-200">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(event) => setIsActive(event.target.checked)}
            className="h-4 w-4 rounded border-zinc-700 bg-zinc-900"
          />
          Código activo (visible en el registro)
        </label>

        {error ? (
          <p className={adminAlertError} role="alert">
            {error}
          </p>
        ) : null}

        <div className="flex flex-col gap-2 sm:flex-row">
          <AdminButton type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </AdminButton>
          <AdminButton type="submit" disabled={loading}>
            {loading ? 'Guardando…' : submitLabel}
          </AdminButton>
        </div>
      </form>
    </AdminModal>
  )
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

  const activeCount = items.filter((item) => item.is_active).length

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className={`text-sm ${adminSubtle}`}>
            {activeCount > 0
              ? `${activeCount} código${activeCount === 1 ? '' : 's'} activo${activeCount === 1 ? '' : 's'} en el registro.`
              : 'Sin códigos activos: el registro no mostrará el campo de descuento.'}
          </p>
        </div>
        <AdminButton onClick={() => setCreateOpen(true)}>Nuevo código</AdminButton>
      </div>

      {success ? <p className={adminAlertSuccess}>{success}</p> : null}
      {error ? <p className={adminAlertError}>{error}</p> : null}

      {loading ? <LoadingState message="Cargando códigos…" /> : null}

      {!loading && items.length === 0 ? (
        <div className={`${adminCard} p-6 text-center`}>
          <p className="text-sm text-zinc-300">Aún no hay códigos de descuento.</p>
        </div>
      ) : null}

      {!loading && items.length > 0 ? (
        <div className="flex flex-col gap-3">
          {items.map((item) => (
            <article key={item.id} className={`${adminCard} p-4`}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-mono text-lg font-bold text-white">{item.code}</p>
                  <p className={`mt-1 text-sm ${adminMuted}`}>{item.percent_off}% de descuento</p>
                  <p className={`mt-1 text-xs ${item.is_active ? 'text-brand-green' : 'text-zinc-500'}`}>
                    {item.is_active ? 'Activo' : 'Inactivo'}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setEditTarget(item)}
                    className={`rounded-xl border border-zinc-700 px-3 py-2 text-sm font-medium text-zinc-200 ${adminFocusRing}`}
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(item)}
                    disabled={actionId === item.id}
                    className={`rounded-xl border border-red-500/30 px-3 py-2 text-sm font-medium text-red-300 ${adminFocusRing}`}
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : null}

      {createOpen ? (
        <DiscountCodeForm
          onClose={() => setCreateOpen(false)}
          onSubmit={handleCreate}
          submitLabel="Crear código"
          loading={actionId === 'create'}
        />
      ) : null}

      {editTarget ? (
        <DiscountCodeForm
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
          message={`¿Eliminar el código ${deleteTarget.code}? Los nuevos registros ya no podrán usarlo.`}
          confirmLabel="Eliminar"
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
          loading={actionId === deleteTarget.id}
        />
      ) : null}
    </div>
  )
}

import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AdminButton from '../components/admin/AdminButton'
import ConfirmDialog from '../components/admin/ConfirmDialog'
import { FEEDBACK_FILTER_TABS, FEEDBACK_TYPE_LABELS } from '../constants/admin'
import {
  adminAlertError,
  adminAlertSuccess,
  adminCard,
  adminFocusRing,
  adminMuted,
  adminSubtle,
} from '../components/admin/adminStyles'
import {
  deleteAdminFeedback,
  fetchAdminFeedback,
  markAdminFeedbackRead,
} from '../lib/api'
import { getUserFacingMessage, isSessionError } from '../lib/userFacingError'
import { clearAdminToken, getAdminToken } from '../lib/adminAuth'
import { formatDateTime } from '../lib/dates'
import LoadingState from '../components/ui/LoadingState'

function filterTabClass(active) {
  return `rounded-xl border px-3 py-2 text-xs font-medium transition-colors sm:text-sm ${adminFocusRing} ${
    active
      ? 'border-brand-green/40 bg-brand-green/12 text-brand-green'
      : 'border-zinc-800 bg-zinc-900/50 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
  }`
}

export default function AdminFeedback() {
  const navigate = useNavigate()
  const [filter, setFilter] = useState('all')
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [actionId, setActionId] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const loadFeedback = useCallback(async () => {
    setError('')
    setLoading(true)
    try {
      const token = getAdminToken()
      const data = await fetchAdminFeedback(token, filter)
      setItems(data)
    } catch (err) {
      if (isSessionError(err)) {
        clearAdminToken()
        navigate('/admin', { replace: true })
        return
      }
      setError(getUserFacingMessage(err, 'No pudimos cargar los mensajes.'))
    } finally {
      setLoading(false)
    }
  }, [filter, navigate])

  useEffect(() => {
    loadFeedback()
  }, [loadFeedback])

  async function handleMarkRead(item) {
    if (item.read_at) return
    setActionId(item.id)
    setSuccess('')
    setError('')
    try {
      const token = getAdminToken()
      const updated = await markAdminFeedbackRead(token, item.id)
      setItems((current) => current.map((row) => (row.id === updated.id ? updated : row)))
    } catch (err) {
      if (isSessionError(err)) {
        clearAdminToken()
        navigate('/admin', { replace: true })
        return
      }
      setError(getUserFacingMessage(err, 'No pudimos marcar el mensaje como leído.'))
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
      await deleteAdminFeedback(token, deleteTarget.id)
      setItems((current) => current.filter((row) => row.id !== deleteTarget.id))
      setDeleteTarget(null)
      setSuccess('Mensaje eliminado.')
    } catch (err) {
      if (isSessionError(err)) {
        clearAdminToken()
        navigate('/admin', { replace: true })
        return
      }
      setError(getUserFacingMessage(err, 'No pudimos eliminar el mensaje.'))
    } finally {
      setActionId(null)
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-5 pb-28 sm:px-6">
      <p className={`mb-4 text-sm leading-relaxed ${adminSubtle}`}>
        Quejas y sugerencias enviadas desde el perfil de las tiendas.
      </p>

      <div className="mb-4 flex flex-wrap gap-2">
        {FEEDBACK_FILTER_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setFilter(tab.id)}
            className={filterTabClass(filter === tab.id)}
          >
            {tab.label}
          </button>
        ))}
        <AdminButton
          variant="secondary"
          className="!w-auto sm:ml-auto"
          onClick={() => loadFeedback()}
          disabled={loading}
        >
          {loading ? '…' : 'Actualizar'}
        </AdminButton>
      </div>

      {success && (
        <p className={`mb-4 ${adminAlertSuccess}`} role="status">
          {success}
        </p>
      )}

      {error && (
        <p className={`mb-4 ${adminAlertError}`} role="alert">
          {error}
        </p>
      )}

      {loading ? <LoadingState variant="admin" message="Cargando mensajes…" /> : null}

      {!loading && !error && items.length === 0 && (
        <article className={`${adminCard} text-center`}>
          <p className="text-sm font-medium text-white">No hay mensajes en esta vista</p>
          <p className={`mt-2 text-sm ${adminSubtle}`}>
            Cuando una tienda envíe una queja o sugerencia, aparecerá aquí.
          </p>
        </article>
      )}

      {!loading && items.length > 0 && (
        <ul className="flex flex-col gap-3">
          {items.map((item) => {
            const unread = !item.read_at
            return (
              <li
                key={item.id}
                className={`${adminCard} ${unread ? 'border-brand-green/30 ring-1 ring-brand-green/15' : ''}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="truncate text-base font-semibold text-white">{item.store_name}</h2>
                      {unread ? (
                        <span className="rounded-md bg-brand-green/20 px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide text-emerald-200">
                          Nueva
                        </span>
                      ) : null}
                    </div>
                    <p className={`mt-1 text-xs ${adminMuted}`}>{formatDateTime(item.created_at)}</p>
                  </div>
                  <span className="shrink-0 rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1 text-[0.65rem] font-semibold text-zinc-300">
                    {FEEDBACK_TYPE_LABELS[item.feedback_type] ?? item.feedback_type}
                  </span>
                </div>

                <p className={`mt-3 whitespace-pre-wrap text-sm leading-relaxed ${adminSubtle}`}>
                  {item.message}
                </p>

                {item.store_slug ? (
                  <p className={`mt-2 font-mono text-xs ${adminMuted}`}>/{item.store_slug}</p>
                ) : null}

                <div className="mt-4 flex flex-wrap gap-2">
                  {unread ? (
                    <AdminButton
                      variant="secondary"
                      className="!w-auto"
                      disabled={actionId === item.id}
                      onClick={() => handleMarkRead(item)}
                    >
                      {actionId === item.id ? '…' : 'Marcar leída'}
                    </AdminButton>
                  ) : (
                    <span className={`self-center text-xs ${adminMuted}`}>Leída</span>
                  )}
                  <AdminButton
                    variant="danger"
                    className="!w-auto"
                    disabled={actionId === item.id}
                    onClick={() => setDeleteTarget(item)}
                  >
                    Eliminar
                  </AdminButton>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Eliminar mensaje"
          subtitle={deleteTarget.store_name}
          confirmLabel="Eliminar"
          confirmVariant="danger"
          loading={actionId === deleteTarget.id}
          onClose={() => setDeleteTarget(null)}
          onConfirm={confirmDelete}
        >
          <p className={`text-sm ${adminSubtle}`}>
            Se borrará este mensaje de forma permanente. No se puede deshacer.
          </p>
        </ConfirmDialog>
      )}
    </div>
  )
}

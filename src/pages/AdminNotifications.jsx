import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AdminButton from '../components/admin/AdminButton'
import SendNotificationModal from '../components/admin/SendNotificationModal'
import { notificationAudienceDisplay } from '../constants/admin'
import { adminAlertError, adminAlertSuccess, adminCard, adminMuted, adminSubtle } from '../components/admin/adminStyles'
import { fetchAdminNotifications, sendAdminNotification } from '../lib/api'
import { getUserFacingMessage, isSessionError } from '../lib/userFacingError'
import { clearAdminToken, getAdminToken } from '../lib/adminAuth'
import { formatDateTime } from '../lib/dates'
import LoadingState from '../components/ui/LoadingState'

export default function AdminNotifications() {
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showModal, setShowModal] = useState(false)

  const loadNotifications = useCallback(async () => {
    setError('')
    setLoading(true)
    try {
      const token = getAdminToken()
      const data = await fetchAdminNotifications(token)
      setItems(data)
    } catch (err) {
      if (isSessionError(err)) {
        clearAdminToken()
        navigate('/admin', { replace: true })
        return
      }
      setError(getUserFacingMessage(err, 'No pudimos cargar las notificaciones.'))
    } finally {
      setLoading(false)
    }
  }, [navigate])

  useEffect(() => {
    loadNotifications()
  }, [loadNotifications])

  async function handleSend(payload) {
    setSuccess('')
    const token = getAdminToken()
    const result = await sendAdminNotification(token, payload)
    const targetLabel = notificationAudienceDisplay(result)
    setSuccess(
      result.audience === 'single'
        ? `Notificación enviada a ${result.target_store_name || 'la tienda'}.`
        : `Notificación enviada a ${result.recipient_count} vendedor${result.recipient_count === 1 ? '' : 'es'} (${targetLabel}).`,
    )
    await loadNotifications()
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-5 pb-28 sm:px-6">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className={`text-sm leading-relaxed ${adminSubtle}`}>
          Envía avisos a todos, por plan/facturación, o a un negocio concreto.
        </p>
        <AdminButton type="button" className="sm:w-auto" onClick={() => setShowModal(true)}>
          Nueva notificación
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

      {loading ? (
        <LoadingState variant="admin" message="Cargando historial…" />
      ) : null}

      {!loading && !error && items.length === 0 && (
        <article className={`${adminCard} text-center`}>
          <p className="text-sm font-medium text-white">Aún no has enviado notificaciones</p>
          <p className={`mt-2 text-sm ${adminSubtle}`}>
            Usa el botón «Nueva notificación» para avisar a los vendedores.
          </p>
        </article>
      )}

      {!loading && items.length > 0 && (
        <ul className="flex flex-col gap-3">
          {items.map((item) => (
            <li key={item.batch_id} className={adminCard}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h2 className="truncate text-base font-semibold text-white">{item.title}</h2>
                  <p className={`mt-1 text-xs ${adminMuted}`}>{formatDateTime(item.created_at)}</p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <span className="rounded-md border border-brand-green/25 bg-brand-green/10 px-2 py-1 text-[0.65rem] font-semibold text-emerald-200/90">
                    {item.recipient_count} vendedor{item.recipient_count === 1 ? '' : 'es'}
                  </span>
                  <span className="text-[0.65rem] text-zinc-500">
                    {notificationAudienceDisplay(item)}
                  </span>
                </div>
              </div>
              <p className={`mt-3 whitespace-pre-wrap text-sm leading-relaxed ${adminSubtle}`}>
                {item.content}
              </p>
            </li>
          ))}
        </ul>
      )}

      {showModal && (
        <SendNotificationModal
          onClose={() => setShowModal(false)}
          onSubmit={handleSend}
        />
      )}
    </div>
  )
}

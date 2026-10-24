import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AdminButton from '../components/admin/AdminButton'
import AdminToastStack from '../components/admin/AdminToastStack'
import SendNotificationModal from '../components/admin/SendNotificationModal'
import { notificationAudienceDetails, notificationAudienceDisplay } from '../constants/admin'
import { adminAlertError, adminCard, adminMuted, adminSubtle } from '../components/admin/adminStyles'
import { fetchAdminNotifications, sendAdminNotification, sendAdminNotificationSms } from '../lib/api'
import { smsSendCountLabel } from '../lib/adminNotificationStores'
import { getUserFacingMessage, isSessionError } from '../lib/userFacingError'
import { clearAdminToken, getAdminToken } from '../lib/adminAuth'
import { formatDateTime } from '../lib/dates'
import LoadingState from '../components/ui/LoadingState'

export default function AdminNotifications({ embedded = false }) {
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [toasts, setToasts] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [smsSendingId, setSmsSendingId] = useState('')

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

  function pushEvents(events) {
    const stamped = (events ?? []).map((event, index) => ({
      id: `${Date.now()}-${index}-${event.message}`,
      type: event.type === 'error' ? 'error' : 'success',
      message: event.message,
    }))
    if (!stamped.length) return
    setToasts((current) => [...current, ...stamped])
  }

  function dismissToast(id) {
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }

  async function handleSend(payload) {
    const token = getAdminToken()
    const result = await sendAdminNotification(token, payload)
    if (result.events?.length) {
      pushEvents(result.events)
    } else {
      const targetLabel = notificationAudienceDisplay(result)
      const avisoLabel =
        result.audience === 'single' && result.recipient_count === 1
          ? `Aviso enviado a ${result.target_store_name || 'la tienda'}`
          : `Aviso enviado a ${result.recipient_count} vendedor${result.recipient_count === 1 ? '' : 'es'} (${targetLabel})`
      pushEvents([{ type: 'success', message: avisoLabel }])
    }
    await loadNotifications()
  }

  async function handleSendSms(batchId) {
    setSmsSendingId(batchId)
    try {
      const token = getAdminToken()
      const result = await sendAdminNotificationSms(token, batchId)
      if (result.events?.length) {
        pushEvents(result.events)
      } else if (result.sms_sent) {
        pushEvents([{ type: 'success', message: 'SMS enviado.' }])
      } else {
        pushEvents([
          {
            type: 'error',
            message: result.sms_error
              ? `El SMS no se pudo enviar: ${result.sms_error}`
              : 'El SMS no se pudo enviar.',
          },
        ])
      }
      if (typeof result.sms_send_count === 'number') {
        setItems((current) =>
          current.map((item) =>
            item.batch_id === batchId ? { ...item, sms_send_count: result.sms_send_count } : item,
          ),
        )
      }
    } catch (err) {
      if (isSessionError(err)) {
        clearAdminToken()
        navigate('/admin', { replace: true })
        return
      }
      pushEvents([{ type: 'error', message: getUserFacingMessage(err, 'No pudimos enviar el SMS.') }])
    } finally {
      setSmsSendingId('')
    }
  }

  return (
    <div className={embedded ? '' : 'mx-auto w-full max-w-5xl px-4 py-5 sm:px-6 lg:px-8'}>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className={`text-sm leading-relaxed ${adminSubtle}`}>
          Envía avisos a uno o varios grupos (plan y facturación) y a negocios concretos.
          Cada aviso llega al panel del vendedor. El SMS se envía después, desde cada fila.
        </p>
        <AdminButton type="button" className="sm:w-auto" onClick={() => setShowModal(true)}>
          Nueva notificación
        </AdminButton>
      </div>

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
          {items.map((item) => {
            const { plans, stores } = notificationAudienceDetails(item)
            return (
            <li key={item.batch_id} className={adminCard}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h2 className="truncate text-base font-semibold text-white">{item.title}</h2>
                  <p className={`mt-1 text-xs ${adminMuted}`}>{formatDateTime(item.created_at)}</p>
                </div>
                <span className="shrink-0 rounded-md border border-brand-green/25 bg-brand-green/10 px-2 py-1 text-[0.65rem] font-semibold text-emerald-200/90">
                  {item.recipient_count} vendedor{item.recipient_count === 1 ? '' : 'es'}
                </span>
              </div>
              {plans.length || stores.length ? (
                <div className="mt-3 flex flex-col gap-2">
                  {plans.length ? (
                    <div className="flex flex-wrap gap-1.5">
                      {plans.map((label) => (
                        <span
                          key={label}
                          className="rounded-md border border-brand-green/25 bg-brand-green/10 px-2 py-1 text-[0.7rem] font-medium text-emerald-100"
                        >
                          {label}
                        </span>
                      ))}
                    </div>
                  ) : null}
                  {stores.length ? (
                    <div className="flex flex-wrap gap-1.5">
                      {stores.map((name) => (
                        <span
                          key={name}
                          className="rounded-md border border-zinc-700/90 bg-zinc-950/50 px-2 py-1 text-[0.7rem] font-medium text-zinc-200"
                        >
                          {name}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>
              ) : null}
              <p className={`mt-3 whitespace-pre-wrap text-sm leading-relaxed ${adminSubtle}`}>
                {item.content}
              </p>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                <p className={`text-xs ${adminMuted}`}>{smsSendCountLabel(item.sms_send_count)}</p>
                <AdminButton
                  type="button"
                  size="sm"
                  variant="secondary"
                  className="sm:w-auto"
                  disabled={smsSendingId === item.batch_id}
                  onClick={() => handleSendSms(item.batch_id)}
                >
                  {smsSendingId === item.batch_id ? 'Enviando SMS…' : 'Enviar SMS'}
                </AdminButton>
              </div>
            </li>
            )
          })}
        </ul>
      )}

      {showModal && (
        <SendNotificationModal
          onClose={() => setShowModal(false)}
          onSubmit={handleSend}
        />
      )}
      <AdminToastStack toasts={toasts} onDismiss={dismissToast} />
    </div>
  )
}

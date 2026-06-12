import { useMemo, useState } from 'react'
import AdminButton from './AdminButton'
import AdminModal from './AdminModal'
import { adminAlertError, adminInput, adminLabel } from './adminStyles'
import { NOTIFICATION_AUDIENCE_OPTIONS } from '../../constants/admin'
import { getUserFacingMessage } from '../../lib/userFacingError'

export default function SendNotificationModal({ onClose, onSubmit }) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [audience, setAudience] = useState('all')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const audienceLabel = useMemo(
    () => NOTIFICATION_AUDIENCE_OPTIONS.find((option) => option.id === audience)?.label ?? '',
    [audience],
  )

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    const trimmedTitle = title.trim()
    const trimmedContent = content.trim()
    if (!trimmedTitle || !trimmedContent) {
      setError('Completa el título y el contenido.')
      return
    }

    setLoading(true)
    try {
      await onSubmit({ title: trimmedTitle, content: trimmedContent, audience })
      onClose()
    } catch (err) {
      setError(getUserFacingMessage(err, 'No pudimos enviar la notificación.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <AdminModal
      title="Nueva notificación"
      subtitle={`Destinatarios: ${audienceLabel}`}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label htmlFor="notification-audience" className={adminLabel}>
            Enviar a
          </label>
          <select
            id="notification-audience"
            value={audience}
            onChange={(event) => setAudience(event.target.value)}
            className={adminInput}
          >
            {NOTIFICATION_AUDIENCE_OPTIONS.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
          <p className="mt-2 text-xs text-zinc-500">
            Solo llega a vendedores con suscripción activa del plan y facturación que elijas.
          </p>
        </div>

        <div>
          <label htmlFor="notification-title" className={adminLabel}>
            Título
          </label>
          <input
            id="notification-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={adminInput}
            placeholder="Ej. Mantenimiento programado"
            maxLength={120}
            required
          />
        </div>

        <div>
          <label htmlFor="notification-content" className={adminLabel}>
            Contenido
          </label>
          <textarea
            id="notification-content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className={`${adminInput} min-h-32 resize-y py-3`}
            placeholder="Escribe el mensaje que verán los vendedores…"
            maxLength={2000}
            required
          />
        </div>

        {error && (
          <p className={adminAlertError} role="alert">
            {error}
          </p>
        )}

        <div className="flex flex-col gap-2 pt-1">
          <AdminButton type="submit" disabled={loading}>
            {loading ? 'Enviando…' : 'Enviar aviso'}
          </AdminButton>
          <AdminButton type="button" variant="ghost" onClick={onClose} disabled={loading}>
            Cancelar
          </AdminButton>
        </div>
      </form>
    </AdminModal>
  )
}

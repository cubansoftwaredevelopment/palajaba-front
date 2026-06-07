import { useState } from 'react'
import AdminButton from './AdminButton'
import AdminModal from './AdminModal'
import { adminAlertError, adminInput, adminLabel } from './adminStyles'

export default function SendNotificationModal({ onClose, onSubmit }) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

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
      await onSubmit({ title: trimmedTitle, content: trimmedContent })
      onClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AdminModal
      title="Nueva notificación"
      subtitle="Se enviará a todos los vendedores con tienda activa."
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
            placeholder="Ej. Tienes un pedido nuevo"
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
            {loading ? 'Enviando…' : 'Enviar a vendedores'}
          </AdminButton>
          <AdminButton type="button" variant="ghost" onClick={onClose} disabled={loading}>
            Cancelar
          </AdminButton>
        </div>
      </form>
    </AdminModal>
  )
}

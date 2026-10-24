import { useEffect, useMemo, useState } from 'react'
import AdminButton from './AdminButton'
import AdminModal from './AdminModal'
import AdminMultiSelect from './AdminMultiSelect'
import { useDismissibleModal } from '../buyer/useOrderModalPresence'
import { adminAlertError, adminInput, adminLabel, adminMuted, adminSubtle } from './adminStyles'
import { NOTIFICATION_AUDIENCE_LABELS, NOTIFICATION_AUDIENCE_OPTIONS } from '../../constants/admin'
import { matchesStoreQuery } from '../../lib/adminNotificationStores'
import { fetchRegistrations } from '../../auth/api.js'
import { getAdminToken } from '../../lib/adminAuth'
import { getUserFacingMessage } from '../../lib/userFacingError'

function toggleValue(list, value) {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value]
}

export default function SendNotificationModal({ onClose: requestClose, onSubmit }) {
  const { dismiss: onClose, motionClass } = useDismissibleModal(requestClose)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [audiences, setAudiences] = useState([])
  const [stores, setStores] = useState([])
  const [storesLoading, setStoresLoading] = useState(false)
  const [storesError, setStoresError] = useState('')
  const [storeQuery, setStoreQuery] = useState('')
  const [selectedSellerIds, setSelectedSellerIds] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const filteredStores = useMemo(
    () => stores.filter((store) => matchesStoreQuery(store, storeQuery)).slice(0, 40),
    [storeQuery, stores],
  )

  const selectedStores = useMemo(
    () => stores.filter((store) => selectedSellerIds.includes(store.id)),
    [selectedSellerIds, stores],
  )

  const audienceSummary = useMemo(() => {
    const groupLabels = audiences.map((id) => NOTIFICATION_AUDIENCE_LABELS[id]).filter(Boolean)
    const storeLabel =
      selectedStores.length === 1
        ? selectedStores[0].store_name
        : selectedStores.length > 1
          ? `${selectedStores.length} negocios`
          : ''
    return [...groupLabels, storeLabel].filter(Boolean).join(' · ') || 'elige destinatarios'
  }, [audiences, selectedStores])

  useEffect(() => {
    let cancelled = false
    async function loadStores() {
      setStoresError('')
      setStoresLoading(true)
      try {
        const token = getAdminToken()
        const [approved, expired] = await Promise.all([
          fetchRegistrations(token, 'approved'),
          fetchRegistrations(token, 'expired'),
        ])
        if (cancelled) return
        const merged = [...(approved ?? []), ...(expired ?? [])].sort((a, b) =>
          String(a.store_name || '').localeCompare(String(b.store_name || ''), 'es'),
        )
        setStores(merged)
      } catch (err) {
        if (!cancelled) {
          setStores([])
          setStoresError(getUserFacingMessage(err, 'No pudimos cargar los negocios.'))
        }
      } finally {
        if (!cancelled) setStoresLoading(false)
      }
    }

    loadStores()
    return () => {
      cancelled = true
    }
  }, [])

  function handleAudiencesChange(next) {
    if (next.includes('all') && !audiences.includes('all')) {
      setAudiences(['all'])
      return
    }
    setAudiences(next.filter((id) => id !== 'all'))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    const trimmedTitle = title.trim()
    const trimmedContent = content.trim()
    if (!trimmedTitle || !trimmedContent) {
      setError('Completa el título y el contenido.')
      return
    }

    if (!audiences.length && !selectedSellerIds.length) {
      setError('Elige al menos un grupo o un negocio.')
      return
    }

    setLoading(true)
    try {
      await onSubmit({
        title: trimmedTitle,
        content: trimmedContent,
        audience: audiences.length === 1 ? audiences[0] : selectedSellerIds.length ? 'single' : 'all',
        audiences,
        seller_ids: selectedSellerIds,
      })
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
      subtitle={`Destinatarios: ${audienceSummary}`}
      onClose={onClose}
      presenceClass={motionClass}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label htmlFor="notification-audience" className={adminLabel}>
            Enviar a
          </label>
          <AdminMultiSelect
            id="notification-audience"
            values={audiences}
            onChange={handleAudiencesChange}
            ariaLabel="Grupos de destinatarios"
            placeholder="Selecciona uno o varios grupos…"
            options={NOTIFICATION_AUDIENCE_OPTIONS.map((option) => ({
              value: option.id,
              label: option.label,
            }))}
          />
          <p className={`mt-2 text-xs ${adminMuted}`}>
            Puedes marcar varios. Un plan mensual y anual juntos cubren a todos los vendedores de ese plan.
          </p>
        </div>

        <div>
          <label htmlFor="notification-store-search" className={adminLabel}>
            Negocios específicos
          </label>
          <input
            id="notification-store-search"
            type="search"
            value={storeQuery}
            onChange={(event) => setStoreQuery(event.target.value)}
            className={adminInput}
            placeholder="Nombre, teléfono o transferencia…"
            autoComplete="off"
          />

          {storesLoading ? (
            <p className={`mt-2 text-xs ${adminMuted}`}>Cargando negocios…</p>
          ) : null}

          {storesError ? (
            <p className={`mt-2 ${adminAlertError}`} role="alert">
              {storesError}
            </p>
          ) : null}

          {!storesLoading && !storesError ? (
            <ul className="mt-2 max-h-48 overflow-y-auto rounded-xl border border-zinc-800/90 bg-zinc-950/40">
              {filteredStores.length === 0 ? (
                <li className={`px-3 py-4 text-center text-xs ${adminSubtle}`}>
                  No hay negocios que coincidan.
                </li>
              ) : (
                filteredStores.map((store) => {
                  const active = selectedSellerIds.includes(store.id)
                  return (
                    <li key={store.id}>
                      <button
                        type="button"
                        onClick={() => setSelectedSellerIds((current) => toggleValue(current, store.id))}
                        className={`flex w-full items-start gap-2 px-3 py-2.5 text-left transition-colors ${
                          active
                            ? 'bg-brand-green/15 text-zinc-50'
                            : 'text-zinc-300 hover:bg-zinc-900/80'
                        }`}
                      >
                        <span
                          className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                            active ? 'border-brand-green bg-brand-green text-brand-white' : 'border-zinc-500'
                          }`}
                          aria-hidden="true"
                        >
                          {active ? (
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                              <path d="M5 12l5 5L20 7" />
                            </svg>
                          ) : null}
                        </span>
                        <span className="flex min-w-0 flex-col gap-0.5">
                          <span className="text-sm font-medium">{store.store_name}</span>
                          <span className={`text-[0.65rem] ${adminMuted}`}>
                            {store.status === 'expired' ? 'Vencida · ' : ''}
                            {store.phone || 'Sin teléfono'}
                          </span>
                        </span>
                      </button>
                    </li>
                  )
                })
              )}
            </ul>
          ) : null}
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
            placeholder="Este texto llega a la app y por SMS al teléfono del negocio…"
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
          <AdminButton type="submit" disabled={loading || storesLoading}>
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

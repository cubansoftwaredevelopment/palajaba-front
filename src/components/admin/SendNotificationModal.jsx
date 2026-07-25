import { useEffect, useMemo, useState } from 'react'
import AdminButton from './AdminButton'
import AdminModal from './AdminModal'
import { adminAlertError, adminInput, adminLabel, adminMuted, adminSubtle } from './adminStyles'
import { NOTIFICATION_AUDIENCE_OPTIONS } from '../../constants/admin'
import { matchesStoreQuery } from '../../lib/adminNotificationStores'
import { fetchRegistrations } from '../../lib/api'
import { getAdminToken } from '../../lib/adminAuth'
import { getUserFacingMessage } from '../../lib/userFacingError'

export default function SendNotificationModal({ onClose, onSubmit }) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [audience, setAudience] = useState('all')
  const [stores, setStores] = useState([])
  const [storesLoading, setStoresLoading] = useState(false)
  const [storesError, setStoresError] = useState('')
  const [storeQuery, setStoreQuery] = useState('')
  const [selectedSellerId, setSelectedSellerId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const isSingle = audience === 'single'

  const audienceLabel = useMemo(
    () => NOTIFICATION_AUDIENCE_OPTIONS.find((option) => option.id === audience)?.label ?? '',
    [audience],
  )

  const filteredStores = useMemo(
    () => stores.filter((store) => matchesStoreQuery(store, storeQuery)).slice(0, 40),
    [storeQuery, stores],
  )

  const selectedStore = useMemo(
    () => stores.find((store) => store.id === selectedSellerId) ?? null,
    [selectedSellerId, stores],
  )

  useEffect(() => {
    if (!isSingle) return undefined

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
  }, [isSingle])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    const trimmedTitle = title.trim()
    const trimmedContent = content.trim()
    if (!trimmedTitle || !trimmedContent) {
      setError('Completa el título y el contenido.')
      return
    }

    if (isSingle && !selectedSellerId) {
      setError('Elige el negocio que recibirá la notificación.')
      return
    }

    setLoading(true)
    try {
      const payload = {
        title: trimmedTitle,
        content: trimmedContent,
        audience,
      }
      if (isSingle) {
        payload.seller_id = selectedSellerId
      }
      await onSubmit(payload)
      onClose()
    } catch (err) {
      setError(getUserFacingMessage(err, 'No pudimos enviar la notificación.'))
    } finally {
      setLoading(false)
    }
  }

  const subtitle = isSingle
    ? selectedStore
      ? `Destinatario: ${selectedStore.store_name}`
      : 'Destinatario: elige un negocio'
    : `Destinatarios: ${audienceLabel}`

  return (
    <AdminModal title="Nueva notificación" subtitle={subtitle} onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label htmlFor="notification-audience" className={adminLabel}>
            Enviar a
          </label>
          <select
            id="notification-audience"
            value={audience}
            onChange={(event) => {
              const next = event.target.value
              setAudience(next)
              if (next !== 'single') {
                setSelectedSellerId('')
                setStoreQuery('')
              }
            }}
            className={adminInput}
          >
            {NOTIFICATION_AUDIENCE_OPTIONS.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
          <p className={`mt-2 text-xs ${adminMuted}`}>
            {isSingle
              ? 'El mensaje llega solo a esa tienda (aprobada o con suscripción vencida).'
              : 'Solo llega a vendedores con suscripción activa del plan y facturación que elijas.'}
          </p>
        </div>

        {isSingle ? (
          <div>
            <label htmlFor="notification-store-search" className={adminLabel}>
              Buscar negocio
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
                    const active = store.id === selectedSellerId
                    return (
                      <li key={store.id}>
                        <button
                          type="button"
                          onClick={() => setSelectedSellerId(store.id)}
                          className={`flex w-full flex-col items-start gap-0.5 px-3 py-2.5 text-left transition-colors ${
                            active
                              ? 'bg-brand-green/15 text-zinc-50'
                              : 'text-zinc-300 hover:bg-zinc-900/80'
                          }`}
                        >
                          <span className="text-sm font-medium">{store.store_name}</span>
                          <span className={`text-[0.65rem] ${adminMuted}`}>
                            {store.status === 'expired' ? 'Vencida · ' : ''}
                            {store.phone || 'Sin teléfono'}
                          </span>
                        </button>
                      </li>
                    )
                  })
                )}
              </ul>
            ) : null}
          </div>
        ) : null}

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
            placeholder="Escribe el mensaje que verá el vendedor…"
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
          <AdminButton type="submit" disabled={loading || (isSingle && storesLoading)}>
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

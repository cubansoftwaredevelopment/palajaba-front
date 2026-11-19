import { useEffect, useMemo, useState } from 'react'
import AdminButton from './AdminButton'
import AdminModal from './AdminModal'
import AdminMultiSelect from './AdminMultiSelect'
import { useDismissibleModal } from '../../buyer/components/useOrderModalPresence'
import { adminAlertError, adminInput, adminLabel, adminMuted, adminSubtle } from './adminStyles'
import { NOTIFICATION_AUDIENCE_LABELS, NOTIFICATION_AUDIENCE_OPTIONS } from '../../constants/admin'
import { buildAdminNotificationPayload, matchesCustomerQuery, matchesStoreQuery } from '../../lib/adminNotificationStores'
import { fetchAdminCustomers, fetchRegistrations } from '../../auth/api.js'
import { getAdminToken } from '../../lib/adminAuth'
import { getUserFacingMessage } from '../../lib/userFacingError'
import { useFormErrorToast } from '../ui/useFormErrorToast'

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
  const [customers, setCustomers] = useState([])
  const [customersLoading, setCustomersLoading] = useState(false)
  const [customersError, setCustomersError] = useState('')
  const [customerQuery, setCustomerQuery] = useState('')
  const [selectedCustomerIds, setSelectedCustomerIds] = useState([])
  const [loading, setLoading] = useState(false)
  const { showError, toastNode } = useFormErrorToast({ variant: 'admin', layerClassName: '!z-[260]' })

  const filteredStores = useMemo(
    () => stores.filter((store) => matchesStoreQuery(store, storeQuery)).slice(0, 40),
    [storeQuery, stores],
  )

  const selectedStores = useMemo(
    () => stores.filter((store) => selectedSellerIds.includes(store.id)),
    [selectedSellerIds, stores],
  )

  const filteredCustomers = useMemo(
    () => customers.filter((customer) => matchesCustomerQuery(customer, customerQuery)).slice(0, 40),
    [customerQuery, customers],
  )

  const selectedCustomers = useMemo(
    () => customers.filter((customer) => selectedCustomerIds.includes(customer.id)),
    [customers, selectedCustomerIds],
  )

  const audienceSummary = useMemo(() => {
    const groupLabels = audiences.map((id) => NOTIFICATION_AUDIENCE_LABELS[id]).filter(Boolean)
    const storeLabel =
      selectedStores.length === 1
        ? selectedStores[0].store_name
        : selectedStores.length > 1
          ? `${selectedStores.length} negocios`
          : ''
    const customerLabel =
      selectedCustomers.length === 1
        ? selectedCustomers[0].full_name
        : selectedCustomers.length > 1
          ? `${selectedCustomers.length} clientes`
          : ''
    return [...groupLabels, storeLabel, customerLabel].filter(Boolean).join(' · ') || 'elige destinatarios'
  }, [audiences, selectedCustomers, selectedStores])

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

  useEffect(() => {
    let cancelled = false
    async function loadCustomers() {
      setCustomersError('')
      setCustomersLoading(true)
      try {
        const data = await fetchAdminCustomers(getAdminToken())
        if (cancelled) return
        const list = Array.isArray(data) ? data : []
        list.sort((a, b) => String(a.full_name || '').localeCompare(String(b.full_name || ''), 'es'))
        setCustomers(list)
      } catch (err) {
        if (!cancelled) {
          setCustomers([])
          setCustomersError(getUserFacingMessage(err, 'No pudimos cargar los clientes.'))
        }
      } finally {
        if (!cancelled) setCustomersLoading(false)
      }
    }

    loadCustomers()
    return () => {
      cancelled = true
    }
  }, [])

  function handleAudiencesChange(next) {
    const hadAll = audiences.includes('all')
    const hasAll = next.includes('all')
    const hasCustomers = next.includes('customers')
    if (hasAll && !hadAll) {
      setAudiences(hasCustomers ? ['all', 'customers'] : ['all'])
      return
    }
    if (hasAll && hadAll) {
      const plans = next.filter((id) => id !== 'all' && id !== 'customers')
      if (plans.length) {
        setAudiences(hasCustomers ? [...plans, 'customers'] : plans)
        return
      }
      setAudiences(hasCustomers ? ['all', 'customers'] : ['all'])
      return
    }
    setAudiences(next.filter((id) => id !== 'all'))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    showError('')

    const trimmedTitle = title.trim()
    const trimmedContent = content.trim()
    if (!trimmedTitle || !trimmedContent) {
      showError('Completa el título y el contenido.')
      return
    }

    if (!audiences.length && !selectedSellerIds.length && !selectedCustomerIds.length) {
      showError('Elige al menos un grupo, un negocio o un cliente.')
      return
    }

    setLoading(true)
    try {
      await onSubmit(
        buildAdminNotificationPayload({
          title: trimmedTitle,
          content: trimmedContent,
          audiences,
          sellerIds: selectedSellerIds,
          customerIds: audiences.includes('customers') ? [] : selectedCustomerIds,
        }),
      )
      onClose()
    } catch (err) {
      showError(getUserFacingMessage(err, 'No pudimos enviar la notificación.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
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
            Puedes marcar varios. Un plan mensual y anual juntos cubren a todos los vendedores de ese plan. Clientes envía el aviso a todas las cuentas de cliente.
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
          <label htmlFor="notification-customer-search" className={adminLabel}>
            Clientes específicos
          </label>
          <input
            id="notification-customer-search"
            type="search"
            value={customerQuery}
            onChange={(event) => setCustomerQuery(event.target.value)}
            className={adminInput}
            placeholder="Nombre, teléfono o correo…"
            autoComplete="off"
            disabled={audiences.includes('customers')}
          />
          {audiences.includes('customers') ? (
            <p className={`mt-2 text-xs ${adminMuted}`}>
              Ya envías el aviso a todos los clientes. Quita ese grupo para elegir algunos.
            </p>
          ) : null}

          {customersLoading ? (
            <p className={`mt-2 text-xs ${adminMuted}`}>Cargando clientes…</p>
          ) : null}

          {customersError ? (
            <p className={`mt-2 ${adminAlertError}`} role="alert">
              {customersError}
            </p>
          ) : null}

          {!customersLoading && !customersError && !audiences.includes('customers') ? (
            <ul className="mt-2 max-h-48 overflow-y-auto rounded-xl border border-zinc-800/90 bg-zinc-950/40">
              {filteredCustomers.length === 0 ? (
                <li className={`px-3 py-4 text-center text-xs ${adminSubtle}`}>
                  No hay clientes que coincidan.
                </li>
              ) : (
                filteredCustomers.map((customer) => {
                  const active = selectedCustomerIds.includes(customer.id)
                  return (
                    <li key={customer.id}>
                      <button
                        type="button"
                        onClick={() => setSelectedCustomerIds((current) => toggleValue(current, customer.id))}
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
                          <span className="text-sm font-medium">{customer.full_name || 'Cliente'}</span>
                          <span className={`text-[0.65rem] ${adminMuted}`}>
                            {customer.phone || 'Sin teléfono'}
                            {customer.email ? ` · ${customer.email}` : ''}
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
            placeholder="Este texto llega a los destinatarios del aviso…"
            maxLength={2000}
            required
          />
        </div>

        <div className="flex flex-col gap-2 pt-1">
          <AdminButton type="submit" disabled={loading || storesLoading || customersLoading}>
            {loading ? 'Enviando…' : 'Enviar aviso'}
          </AdminButton>
          <AdminButton type="button" variant="ghost" onClick={onClose} disabled={loading}>
            Cancelar
          </AdminButton>
        </div>
      </form>
    </AdminModal>
    {toastNode}
    </>
  )
}

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AdminPillSelect from '../components/admin/AdminPillSelect'
import AdminSelect from '../components/admin/AdminSelect'
import ConfirmDialog from '../components/admin/ConfirmDialog'
import PaymentModal from '../components/admin/PaymentModal'
import RegistrationActionsMenu from '../components/admin/RegistrationActionsMenu'
import SubscriptionModal from '../components/admin/SubscriptionModal'
import {
  adminAlertError,
  adminBadgeApproved,
  adminBadgeExpired,
  adminBadgePending,
  adminBadgeRejected,
  adminInput,
  adminSection,
  adminSubtle,
} from '../components/admin/adminStyles'
import { BILLING_LABELS, PLAN_TIER_LABELS, REJECTION_REASON, STATUS_LABELS } from '../constants/admin'
import { normalizePlanTier } from '../constants/plan'
import { fetchRegistrations, rejectRegistration, deleteRegistration } from '../lib/api'
import { formatDateTime } from '../lib/dates'
import { formatPrice } from '../lib/money'
import { usePlanPricing } from '../lib/usePlanPricing'
import { getUserFacingMessage, isSessionError } from '../lib/userFacingError'
import { clearAdminToken, getAdminToken } from '../lib/adminAuth'
import LoadingState from '../components/ui/LoadingState'

const PAGE_SIZES = [10, 15, 20]
const PAGE_SIZE_OPTIONS = PAGE_SIZES.map((size) => ({ value: String(size), label: `${size} por página` }))
const pagerButton =
  'inline-flex min-h-9 items-center rounded-xl border border-zinc-800/90 bg-zinc-900/70 px-3 text-xs font-medium text-zinc-100 disabled:opacity-40'

const EMPTY_FILTERS = {
  store: '',
  phone: '',
  transfer: '',
  status: 'all',
  approved: '',
  plan: 'all',
  billing: 'all',
  sales: '',
}

const STATUS_BADGES = {
  pending: adminBadgePending,
  approved: adminBadgeApproved,
  rejected: adminBadgeRejected,
  expired: adminBadgeExpired,
}

function Toast({ message, type, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000)
    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <div
      className={`admin-theme fixed bottom-[max(1.5rem,var(--safe-bottom))] left-1/2 z-50 flex max-w-sm -translate-x-1/2 items-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium shadow-xl ${
        type === 'success'
          ? 'border-brand-green/30 bg-zinc-900/95 text-zinc-100'
          : 'border-brand-carmelita/25 bg-zinc-950/95 text-zinc-300'
      }`}
      role="status"
    >
      <span className="flex-1">{message}</span>
      <button
        type="button"
        onClick={onClose}
        className="text-zinc-500 hover:text-white"
        aria-label="Cerrar"
      >
        ×
      </button>
    </div>
  )
}

function includesText(value, query) {
  const needle = query.trim().toLowerCase()
  if (!needle) return true
  return String(value ?? '').toLowerCase().includes(needle)
}

function subscriptionTime(item) {
  const period = BILLING_LABELS[item.billing_period] ?? item.billing_period
  if (item.subscription_starts_at && item.subscription_ends_at) {
    return `${period} · ${formatDateTime(item.subscription_starts_at)} – ${formatDateTime(item.subscription_ends_at)}`
  }
  if (item.subscription_ends_at) return `${period} · hasta ${formatDateTime(item.subscription_ends_at)}`
  return period
}

function inCurrentMonth(value) {
  const day = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(day.getTime())) return false
  const now = new Date()
  return day.getFullYear() === now.getFullYear() && day.getMonth() === now.getMonth()
}

function matchesSales(item, query) {
  const needle = query.trim().toLowerCase().replace(',', '.')
  if (!needle) return true
  const amount = String(item.sales_total_cup ?? 0)
  const label = formatPrice(item.sales_total_cup ?? 0, 'CUP').toLowerCase()
  return amount.includes(needle) || label.includes(needle)
}

export default function AdminDashboard() {
  const navigate = useNavigate()
  const { getPlanPrice } = usePlanPricing()
  const [registrations, setRegistrations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [toast, setToast] = useState(null)
  const [filters, setFilters] = useState(EMPTY_FILTERS)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [actionId, setActionId] = useState(null)
  const [openActionsId, setOpenActionsId] = useState(null)
  const [subscriptionModal, setSubscriptionModal] = useState(null)
  const [paymentModal, setPaymentModal] = useState(null)
  const [rejectTarget, setRejectTarget] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const loadRegistrations = useCallback(
    async (showFullLoader = true) => {
      if (showFullLoader) setLoading(true)
      setError('')

      try {
        const token = getAdminToken()
        const data = await fetchRegistrations(token, 'all')
        setRegistrations(data)
      } catch (err) {
        if (isSessionError(err)) {
          clearAdminToken()
          navigate('/admin', { replace: true })
          return
        }
        setError(getUserFacingMessage(err, 'No pudimos cargar las solicitudes. Inténtalo de nuevo.'))
      } finally {
        setLoading(false)
      }
    },
    [navigate],
  )

  useEffect(() => {
    loadRegistrations()
  }, [loadRegistrations])

  function handleMutationSuccess(message) {
    setToast({ message, type: 'success' })
    loadRegistrations(false)
  }

  async function confirmReject() {
    if (!rejectTarget) return
    setActionId(rejectTarget.id)

    try {
      const token = getAdminToken()
      await rejectRegistration(token, rejectTarget.id)
      setRejectTarget(null)
      handleMutationSuccess('Solicitud rechazada.')
    } catch (err) {
      setError(getUserFacingMessage(err, 'No pudimos completar la acción. Inténtalo de nuevo.'))
    } finally {
      setActionId(null)
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    setActionId(deleteTarget.id)

    try {
      const token = getAdminToken()
      const result = await deleteRegistration(token, deleteTarget.id)
      setDeleteTarget(null)
      setOpenActionsId(null)
      handleMutationSuccess(result?.message ?? 'Tienda eliminada.')
    } catch (err) {
      setError(getUserFacingMessage(err, 'No pudimos eliminar la tienda. Inténtalo de nuevo.'))
    } finally {
      setActionId(null)
    }
  }

  const subscriptionTotals = useMemo(() => {
    let paidAmount = 0
    let expectedAmount = 0
    for (const item of registrations) {
      const dueThisMonth =
        (item.status === 'approved' || item.status === 'expired') &&
        inCurrentMonth(item.subscription_ends_at)
      const renewedThisMonth =
        item.status === 'approved' &&
        inCurrentMonth(item.subscription_starts_at) &&
        !inCurrentMonth(item.created_at)
      if (dueThisMonth || renewedThisMonth) {
        const planAmount = getPlanPrice(normalizePlanTier(item.plan_tier), item.billing_period)?.amount
        const amount = Number(item.expected_payment_cup ?? planAmount ?? 0)
        expectedAmount += Number.isFinite(amount) ? amount : 0
      }
      if (item.payment_amount_cup == null) continue
      if (!inCurrentMonth(item.approved_at || item.created_at)) continue
      paidAmount += Number(item.payment_amount_cup) || 0
    }
    return { paidAmount, expectedAmount }
  }, [getPlanPrice, registrations])

  const filteredRegistrations = useMemo(
    () =>
      registrations.filter((item) => {
        if (
          !includesText(item.store_name, filters.store) &&
          !includesText(item.email || '', filters.store)
        ) return false
        if (!includesText(item.phone, filters.phone)) return false
        const transferLabel = item.is_trial
          ? `Prueba ${item.transfer_id}`
          : item.is_launch_promo
          ? `Promoción ${item.transfer_id}`
          : item.transfer_id
        if (!includesText(transferLabel, filters.transfer)) return false
        if (filters.status !== 'all' && item.status !== filters.status) return false
        if (!includesText(item.approved_at ? formatDateTime(item.approved_at) : '', filters.approved)) return false
        if (filters.plan !== 'all' && normalizePlanTier(item.plan_tier) !== filters.plan) return false
        if (filters.billing !== 'all' && item.billing_period !== filters.billing) return false
        if (!matchesSales(item, filters.sales)) return false
        return true
      }),
    [filters, registrations],
  )

  useEffect(() => {
    setPage(1)
  }, [pageSize])

  const pageCount = Math.max(1, Math.ceil(filteredRegistrations.length / pageSize))
  const currentPage = Math.min(page, pageCount)
  const pageStart = filteredRegistrations.length === 0 ? 0 : (currentPage - 1) * pageSize
  const pageItems = filteredRegistrations.slice(pageStart, pageStart + pageSize)

  function updateFilter(field, value) {
    setFilters((current) => ({ ...current, [field]: value }))
    setPage(1)
  }

  const filterInput = `${adminInput} min-h-9 px-2 py-1.5 text-xs`

  function closeActions() {
    setOpenActionsId(null)
  }

  return (
    <>
      <main className={adminSection}>
        <p className={`mb-4 text-sm leading-relaxed ${adminSubtle}`}>
          {loading
            ? 'Cargando solicitudes…'
            : filteredRegistrations.length === 0
              ? `0 de ${registrations.length} negocios`
              : `${pageStart + 1}–${pageStart + pageItems.length} de ${filteredRegistrations.length} negocios`}
        </p>

        {!loading ? (
          <div className="mb-4 flex flex-wrap gap-2">
            <span className="rounded-full border border-brand-green/25 bg-brand-green/10 px-2.5 py-1 text-xs font-semibold tabular-nums text-zinc-100">
              Pagado este mes {formatPrice(subscriptionTotals.paidAmount, 'CUP')}
            </span>
            <span className="rounded-full border border-brand-yellow/30 bg-brand-yellow/10 px-2.5 py-1 text-xs font-semibold tabular-nums text-zinc-100">
              A renovar este mes {formatPrice(subscriptionTotals.expectedAmount, 'CUP')}
            </span>
          </div>
        ) : null}

        {error && (
          <p className={`mb-4 ${adminAlertError}`} role="alert">
            {error}
          </p>
        )}

        {loading ? <LoadingState variant="admin" message="Cargando solicitudes…" /> : null}

        {!loading ? (
          <div className="overflow-x-auto rounded-2xl border border-brand-green/10">
            <table className="w-full min-w-[72rem] border-collapse text-left text-sm xl:min-w-full">
              <thead>
                <tr className="border-b border-zinc-800 text-[0.65rem] font-semibold uppercase tracking-wide text-zinc-400">
                  <th className="px-3 py-2">Negocio</th>
                  <th className="px-3 py-2">Teléfono</th>
                  <th className="px-3 py-2">ID transferencia</th>
                  <th className="px-3 py-2">Suscripción</th>
                  <th className="px-3 py-2">Aprobada</th>
                  <th className="px-3 py-2">Plan</th>
                  <th className="px-3 py-2">Tiempo de suscripción</th>
                  <th className="px-3 py-2">Vendido</th>
                  <th className="px-3 py-2">Acciones</th>
                </tr>
                <tr className="border-b border-zinc-800 bg-zinc-950/40">
                  <th className="px-2 py-2">
                    <input
                      value={filters.store}
                      onChange={(event) => updateFilter('store', event.target.value)}
                      className={filterInput}
                      placeholder="Filtrar negocio"
                      aria-label="Filtrar por negocio"
                    />
                  </th>
                  <th className="px-2 py-2">
                    <input
                      value={filters.phone}
                      onChange={(event) => updateFilter('phone', event.target.value)}
                      className={filterInput}
                      placeholder="Filtrar teléfono"
                      aria-label="Filtrar por teléfono"
                    />
                  </th>
                  <th className="px-2 py-2">
                    <input
                      value={filters.transfer}
                      onChange={(event) => updateFilter('transfer', event.target.value)}
                      className={filterInput}
                      placeholder="Filtrar ID"
                      aria-label="Filtrar por ID de transferencia"
                    />
                  </th>
                  <th className="px-2 py-2">
                    <AdminPillSelect
                      value={filters.status === 'all' ? '' : filters.status}
                      onChange={(value) => updateFilter('status', value || 'all')}
                      allLabel="Todas"
                      ariaLabel="Filtrar por estado de suscripción"
                      options={[
                        { value: 'pending', label: 'Pendiente' },
                        { value: 'approved', label: 'Aprobada' },
                        { value: 'expired', label: 'Vencida' },
                        { value: 'rejected', label: 'Rechazada' },
                      ]}
                    />
                  </th>
                  <th className="px-2 py-2">
                    <input
                      value={filters.approved}
                      onChange={(event) => updateFilter('approved', event.target.value)}
                      className={filterInput}
                      placeholder="Filtrar fecha"
                      aria-label="Filtrar por fecha de aprobación"
                    />
                  </th>
                  <th className="px-2 py-2">
                    <AdminPillSelect
                      value={filters.plan === 'all' ? '' : filters.plan}
                      onChange={(value) => updateFilter('plan', value || 'all')}
                      allLabel="Todos"
                      ariaLabel="Filtrar por plan"
                      options={[
                        { value: 'standard', label: 'Básico' },
                        { value: 'premium', label: 'Premium' },
                      ]}
                    />
                  </th>
                  <th className="px-2 py-2">
                    <AdminPillSelect
                      value={filters.billing === 'all' ? '' : filters.billing}
                      onChange={(value) => updateFilter('billing', value || 'all')}
                      allLabel="Todos"
                      ariaLabel="Filtrar por tiempo de suscripción"
                      options={[
                        { value: 'monthly', label: 'Mensual' },
                        { value: 'yearly', label: 'Anual' },
                      ]}
                    />
                  </th>
                  <th className="px-2 py-2">
                    <input
                      value={filters.sales}
                      onChange={(event) => updateFilter('sales', event.target.value)}
                      className={filterInput}
                      placeholder="Filtrar monto"
                      aria-label="Filtrar por vendido"
                      inputMode="decimal"
                    />
                  </th>
                  <th className="px-2 py-2" />
                </tr>
              </thead>
              <tbody>
                {pageItems.length === 0 ? (
                  <tr>
                    <td colSpan={9} className={`px-3 py-8 text-center text-sm ${adminSubtle}`}>
                      Ningún negocio coincide con estos filtros.
                    </td>
                  </tr>
                ) : (
                  pageItems.map((item) => (
                    <tr key={item.id} className="border-b border-zinc-800/80 align-top">
                      <td className="px-3 py-3 font-medium break-words text-zinc-50">
                        <div>{item.store_name}</div>
                        {item.email ? (
                          <div className="mt-1 text-xs font-normal text-zinc-400 break-all">
                            {item.email}
                          </div>
                        ) : null}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-zinc-300">{item.phone}</td>
                      <td className="px-3 py-3 font-mono text-xs break-all text-zinc-300">
                        {item.is_trial ? 'Prueba' : item.is_launch_promo ? 'Promoción' : item.transfer_id}
                      </td>
                      <td className="px-3 py-3">
                        <span className={STATUS_BADGES[item.status] ?? adminBadgePending}>
                          {STATUS_LABELS[item.status] ?? item.status}
                        </span>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-zinc-300">
                        {item.approved_at ? formatDateTime(item.approved_at) : '—'}
                      </td>
                      <td className="px-3 py-3 text-zinc-300">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span>{PLAN_TIER_LABELS[normalizePlanTier(item.plan_tier)]}</span>
                          {item.is_trial ? (
                            <span className={adminBadgePending}>Prueba</span>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-3 py-3 text-zinc-300">{subscriptionTime(item)}</td>
                      <td className="px-3 py-3 tabular-nums text-zinc-100">
                        {formatPrice(item.sales_total_cup ?? 0, 'CUP')}
                      </td>
                      <td className="px-3 py-3">
                        <RegistrationActionsMenu
                          item={item}
                          open={openActionsId === item.id}
                          onToggle={() =>
                            setOpenActionsId((current) => (current === item.id ? null : item.id))
                          }
                          onClose={closeActions}
                          onApprove={(reg) => {
                            closeActions()
                            setSubscriptionModal({ registration: reg, mode: 'approve' })
                          }}
                          onReject={(reg) => {
                            closeActions()
                            setRejectTarget(reg)
                          }}
                          onEditSubscription={(reg) => {
                            closeActions()
                            setSubscriptionModal({ registration: reg, mode: 'edit' })
                          }}
                          onEditPayment={(reg) => {
                            closeActions()
                            setPaymentModal(reg)
                          }}
                          onRenew={(reg) => {
                            closeActions()
                            setSubscriptionModal({ registration: reg, mode: 'renew' })
                          }}
                          onDelete={(reg) => {
                            closeActions()
                            setDeleteTarget(reg)
                          }}
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : null}

        {!loading && filteredRegistrations.length > 0 ? (
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className={`text-sm ${adminSubtle}`}>
              Página {currentPage} de {pageCount}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <AdminSelect
                className="w-[9.5rem]"
                triggerClassName="min-h-9 py-1.5 text-xs"
                ariaLabel="Negocios por página"
                value={String(pageSize)}
                onChange={(value) => setPageSize(Number(value))}
                options={PAGE_SIZE_OPTIONS}
              />
              <button
                type="button"
                className={pagerButton}
                disabled={currentPage <= 1}
                onClick={() => setPage(currentPage - 1)}
              >
                Anterior
              </button>
              <button
                type="button"
                className={pagerButton}
                disabled={currentPage >= pageCount}
                onClick={() => setPage(currentPage + 1)}
              >
                Siguiente
              </button>
            </div>
          </div>
        ) : null}
      </main>

      {paymentModal && (
        <PaymentModal
          registration={paymentModal}
          onClose={() => setPaymentModal(null)}
          onSuccess={() => handleMutationSuccess('Monto de pago registrado.')}
        />
      )}

      {subscriptionModal && (
        <SubscriptionModal
          registration={subscriptionModal.registration}
          mode={subscriptionModal.mode}
          onClose={() => setSubscriptionModal(null)}
          onSuccess={() =>
            handleMutationSuccess(
              subscriptionModal.mode === 'renew'
                ? 'Suscripción renovada. La tienda vuelve a Aprobadas.'
                : subscriptionModal.mode === 'edit'
                  ? 'Suscripción actualizada.'
                  : 'Tienda aprobada.',
            )
          }
        />
      )}

      {rejectTarget && (
        <ConfirmDialog
          title="Rechazar solicitud"
          subtitle={rejectTarget.store_name}
          confirmLabel="Confirmar rechazo"
          confirmVariant="danger"
          loading={actionId === rejectTarget.id}
          onClose={() => setRejectTarget(null)}
          onConfirm={confirmReject}
        >
          <p className={`text-sm ${adminSubtle}`}>Motivo que recibirá la tienda:</p>
          <p className="mt-3 rounded-lg border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-300">
            {REJECTION_REASON}
          </p>
        </ConfirmDialog>
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Eliminar tienda"
          subtitle={deleteTarget.store_name}
          confirmLabel="Eliminar definitivamente"
          confirmVariant="danger"
          loading={actionId === deleteTarget.id}
          onClose={() => setDeleteTarget(null)}
          onConfirm={confirmDelete}
        >
          <p className={`text-sm ${adminSubtle}`}>
            Se borrará la cuenta de <span className="font-medium text-zinc-200">{deleteTarget.store_name}</span>{' '}
            y todos sus datos:
          </p>
          <ul className={`mt-3 list-inside list-disc space-y-1 text-sm ${adminSubtle}`}>
            <li>Catálogo y productos</li>
            <li>Pedidos registrados</li>
            <li>Notificaciones del vendedor</li>
            <li>Estadísticas de visitas al perfil</li>
          </ul>
          <p className="mt-3 text-sm font-medium text-orange-200">
            Esta acción no se puede deshacer.
          </p>
        </ConfirmDialog>
      )}

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </>
  )
}

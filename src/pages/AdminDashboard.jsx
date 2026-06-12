import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AdminButton from '../components/admin/AdminButton'
import ConfirmDialog from '../components/admin/ConfirmDialog'
import RegistrationDetailModal from '../components/admin/RegistrationDetailModal'
import RegistrationRow from '../components/admin/RegistrationRow'
import PaymentModal from '../components/admin/PaymentModal'
import SubscriptionModal from '../components/admin/SubscriptionModal'
import {
  adminAlertError,
  adminInput,
  adminMuted,
  adminSubtle,
} from '../components/admin/adminStyles'
import { FILTER_TABS, REJECTION_REASON } from '../constants/admin'
import { fetchRegistrations, rejectRegistration } from '../lib/api'
import { getUserFacingMessage, isSessionError } from '../lib/userFacingError'
import { clearAdminToken, getAdminToken } from '../lib/adminAuth'
import LoadingState from '../components/ui/LoadingState'

function StatCard({ label, value, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border px-4 py-3 text-left transition-all ${
        active
          ? 'border-brand-green/40 bg-brand-green/12 text-brand-green shadow-[0_0_24px_rgba(89,128,44,0.12)] ring-1 ring-brand-green/25'
          : 'border-brand-green/8 bg-zinc-900/45 text-zinc-300 hover:border-brand-green/20 hover:bg-zinc-900/70'
      }`}
    >
      <p className={`text-2xl font-semibold tabular-nums ${active ? 'text-brand-green' : 'text-zinc-50'}`}>
        {value}
      </p>
      <p
        className={`text-xs font-medium uppercase tracking-wide ${
          active ? 'text-brand-green/80' : 'text-zinc-500'
        }`}
      >
        {label}
      </p>
    </button>
  )
}

function Toast({ message, type, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000)
    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <div
      className={`admin-theme fixed bottom-24 left-1/2 z-50 flex max-w-sm -translate-x-1/2 items-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium shadow-xl sm:bottom-6 ${
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

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [filter, setFilter] = useState('pending')
  const [registrations, setRegistrations] = useState([])
  const [counts, setCounts] = useState({ pending: 0, approved: 0, expired: 0, rejected: 0, all: 0 })
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const [toast, setToast] = useState(null)
  const [search, setSearch] = useState('')
  const [actionId, setActionId] = useState(null)
  const [detailTarget, setDetailTarget] = useState(null)
  const [subscriptionModal, setSubscriptionModal] = useState(null)
  const [paymentModal, setPaymentModal] = useState(null)
  const [rejectTarget, setRejectTarget] = useState(null)
  const loadCounts = useCallback(async (token) => {
    const [pending, approved, expired, rejected, all] = await Promise.all([
      fetchRegistrations(token, 'pending'),
      fetchRegistrations(token, 'approved'),
      fetchRegistrations(token, 'expired'),
      fetchRegistrations(token, 'rejected'),
      fetchRegistrations(token, 'all'),
    ])
    setCounts({
      pending: pending.length,
      approved: approved.length,
      expired: expired.length,
      rejected: rejected.length,
      all: all.length,
    })
  }, [])

  const loadRegistrations = useCallback(
    async (showFullLoader = true) => {
      if (showFullLoader) setLoading(true)
      else setRefreshing(true)
      setError('')

      try {
        const token = getAdminToken()
        const [data] = await Promise.all([
          fetchRegistrations(token, filter),
          loadCounts(token),
        ])
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
        setRefreshing(false)
      }
    },
    [filter, navigate, loadCounts],
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

  const filteredRegistrations = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return registrations
    return registrations.filter((item) =>
      [item.store_name, item.phone, item.transfer_id, item.status]
        .join(' ')
        .toLowerCase()
        .includes(query),
    )
  }, [registrations, search])

  return (
    <>
      <main className="mx-auto max-w-3xl px-4 pb-6 pt-6 sm:px-6">
        <div className="mb-6 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
          {FILTER_TABS.map((tab) => (
            <StatCard
              key={tab.id}
              label={tab.label}
              value={counts[tab.id] ?? 0}
              active={filter === tab.id}
              onClick={() => setFilter(tab.id)}
            />
          ))}
        </div>

        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <svg
              className={`pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 ${adminMuted}`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar tienda, teléfono o ID…"
              className={`${adminInput} py-3 pl-11`}
              aria-label="Buscar solicitudes"
            />
          </div>
          <AdminButton
            variant="secondary"
            onClick={() => loadRegistrations(false)}
            disabled={loading || refreshing}
            className="!w-auto shrink-0 px-5"
          >
            {refreshing ? '…' : 'Actualizar'}
          </AdminButton>
        </div>

        {error && (
          <p className={`mb-4 ${adminAlertError}`} role="alert">
            {error}
          </p>
        )}

        <div className="flex flex-col gap-2">
          {loading ? (
            <LoadingState variant="admin" message="Cargando solicitudes…" className="rounded-2xl border border-brand-green/8 bg-zinc-900/30 py-14" />
          ) : null}

          {!loading && filteredRegistrations.length === 0 && (
            <div className="rounded-2xl border border-dashed border-brand-green/15 bg-zinc-900/30 px-6 py-14 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-brand-green/15 bg-brand-green/10">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-brand-green/70" aria-hidden="true">
                  <path d="M3 7h18M3 12h18M3 17h18" />
                </svg>
              </div>
              <p className="font-medium text-zinc-50">
                {search ? 'Sin resultados' : 'Nada por aquí'}
              </p>
              <p className={`mt-1 text-sm ${adminSubtle}`}>
                {search ? 'Prueba otro término.' : 'Las nuevas solicitudes aparecerán aquí.'}
              </p>
            </div>
          )}

          {!loading &&
            filteredRegistrations.map((item) => (
              <RegistrationRow
                key={item.id}
                item={item}
                onViewDetails={setDetailTarget}
              />
            ))}
        </div>
      </main>

      {detailTarget && (
        <RegistrationDetailModal
          item={detailTarget}
          actionId={actionId}
          onClose={() => setDetailTarget(null)}
          onApprove={(reg) => {
            setDetailTarget(null)
            setSubscriptionModal({ registration: reg, mode: 'approve' })
          }}
          onReject={(reg) => {
            setDetailTarget(null)
            setRejectTarget(reg)
          }}
          onEditSubscription={(reg) => {
            setDetailTarget(null)
            setSubscriptionModal({ registration: reg, mode: 'edit' })
          }}
          onEditPayment={(reg) => {
            setDetailTarget(null)
            setPaymentModal(reg)
          }}
          onRenew={(reg) => {
            setDetailTarget(null)
            setSubscriptionModal({ registration: reg, mode: 'renew' })
          }}
        />
      )}

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

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </>
  )
}

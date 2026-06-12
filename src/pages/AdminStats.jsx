import { useCallback, useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { adminAlertError, adminCard, adminCardHighlight, adminFocusRing, adminMuted, adminSubtle } from '../components/admin/adminStyles'
import { fetchAdminStats } from '../lib/api'
import { getUserFacingMessage, isSessionError } from '../lib/userFacingError'
import { clearAdminToken, getAdminToken } from '../lib/adminAuth'
import { formatPrice } from '../lib/money'

const MONTH_NAMES = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
]

const METRIC_ACCENTS = {
  payments: 'border-t-brand-green',
  stores: 'border-t-emerald-400/70',
  pending: 'border-t-brand-yellow',
  orders: 'border-t-zinc-600',
}

function MetricCard({ label, hint, value, subvalue, comingSoon, accent = 'payments' }) {
  return (
    <article className={`${adminCard} border-t-2 ${METRIC_ACCENTS[accent] ?? METRIC_ACCENTS.payments}`}>
      <p className={`text-xs font-medium uppercase tracking-wide ${adminMuted}`}>{label}</p>
      <p
        className={`mt-3 text-3xl font-semibold tabular-nums ${
          comingSoon ? 'text-zinc-600' : 'text-zinc-50'
        }`}
      >
        {value}
      </p>
      {subvalue && <p className="mt-1 text-xs text-brand-green/80">{subvalue}</p>}
      <p className={`mt-2 text-xs leading-relaxed ${adminSubtle}`}>{hint}</p>
      {comingSoon && (
        <span className="mt-4 inline-flex rounded-md border border-brand-yellow/30 bg-brand-yellow/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-brand-yellow">
          Próximamente
        </span>
      )}
    </article>
  )
}

export default function AdminStats() {
  const navigate = useNavigate()
  const location = useLocation()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadStats = useCallback(async () => {
    setError('')
    setLoading(true)
    try {
      const token = getAdminToken()
      const data = await fetchAdminStats(token)
      setStats(data)
    } catch (err) {
      if (isSessionError(err)) {
        clearAdminToken()
        navigate('/admin', { replace: true })
        return
      }
      setError(getUserFacingMessage(err, 'No pudimos cargar las estadísticas.'))
    } finally {
      setLoading(false)
    }
  }, [navigate])

  useEffect(() => {
    loadStats()
  }, [loadStats, location.pathname])

  useEffect(() => {
    function onVisible() {
      if (document.visibilityState === 'visible') {
        loadStats()
      }
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [loadStats])

  const periodLabel = stats
    ? `${MONTH_NAMES[stats.month - 1]} ${stats.year}`
    : ''

  return (
    <main className="mx-auto max-w-3xl px-4 pt-6 sm:px-6">
      <section className={`mb-6 ${adminCardHighlight}`}>
        <div className="mb-4 flex justify-end">
          <button
            type="button"
            onClick={() => loadStats()}
            disabled={loading}
            className={`rounded-xl border border-zinc-700/80 px-3 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:border-brand-green/30 hover:bg-brand-green/10 hover:text-zinc-100 disabled:opacity-50 ${adminFocusRing}`}
          >
            {loading ? 'Actualizando…' : 'Actualizar'}
          </button>
        </div>
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-brand-green/20 bg-brand-green/10 text-brand-green">
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="text-brand-green"
              aria-hidden="true"
            >
              <path d="M3 3v18h18" />
              <path d="M7 16V9M12 16V5M17 16v-3" />
            </svg>
          </div>
          <div>
            <h2 className="font-medium text-zinc-50">Resumen de la plataforma</h2>
            <p className={`mt-1.5 text-sm leading-relaxed ${adminSubtle}`}>
              Los pagos de suscripción se registran al aprobar cada tienda. El total del mes
              suma los montos aprobados en {periodLabel || 'este mes'}.
            </p>
          </div>
        </div>
      </section>

      {error && (
        <p className={`mb-4 ${adminAlertError}`} role="alert">
          {error}
        </p>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <MetricCard
          accent="payments"
          label="Pagos del mes"
          hint="Monto total registrado al aprobar tiendas este mes"
          value={loading ? '…' : formatPrice(stats?.payments_total_cup ?? 0, 'USD')}
          subvalue={
            !loading && stats
              ? `${stats.payments_count} aprobación${stats.payments_count === 1 ? '' : 'es'}`
              : undefined
          }
        />
        <MetricCard
          accent="stores"
          label="Tiendas activas"
          hint="Suscripción vigente hoy"
          value={loading ? '…' : String(stats?.active_stores ?? 0)}
        />
        <MetricCard
          accent="pending"
          label="Solicitudes pendientes"
          hint="Por revisar y aprobar"
          value={loading ? '…' : String(stats?.pending_registrations ?? 0)}
        />
        <MetricCard
          accent="orders"
          label="Pedidos del mes"
          hint="Compras en la plataforma"
          value="—"
          comingSoon
        />
      </div>
    </main>
  )
}

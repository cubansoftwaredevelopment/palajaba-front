import { useCallback, useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import AdminBusinessesByProvinceChart from '../components/admin/AdminBusinessesByProvinceChart'
import AdminRevenueChart from '../components/admin/AdminRevenueChart'
import AdminTrafficChart from '../components/admin/AdminTrafficChart'
import AdminTrafficLocationChart from '../components/admin/AdminTrafficLocationChart'
import AdminTrafficPatternsChart from '../components/admin/AdminTrafficPatternsChart'
import { adminAlertError, adminCard, adminCardHighlight, adminFocusRing, adminMuted, adminSubtle } from '../components/admin/adminStyles'
import {
  fetchAdminBusinessesByProvince,
  fetchAdminRevenueChart,
  fetchAdminStats,
  fetchAdminTrafficChart,
  fetchAdminTrafficLocations,
  fetchAdminTrafficPatterns,
} from '../lib/api'
import { getUserFacingMessage, isSessionError } from '../lib/userFacingError'
import { clearAdminToken, getAdminToken } from '../lib/adminAuth'
import { formatPrice } from '../lib/money'
import LoadingState from '../components/ui/LoadingState'

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
  traffic: 'border-t-sky-300/80',
  stores: 'border-t-emerald-400/70',
  pending: 'border-t-brand-yellow',
  products: 'border-t-sky-400/70',
  orders: 'border-t-violet-400/70',
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
  const [provinceStats, setProvinceStats] = useState(null)
  const [revenueChart, setRevenueChart] = useState(null)
  const [revenueGranularity, setRevenueGranularity] = useState('daily')
  const [trafficChart, setTrafficChart] = useState(null)
  const [trafficGranularity, setTrafficGranularity] = useState('daily')
  const [trafficLocations, setTrafficLocations] = useState(null)
  const [trafficPatterns, setTrafficPatterns] = useState(null)
  const [loading, setLoading] = useState(true)
  const [revenueLoading, setRevenueLoading] = useState(true)
  const [trafficLoading, setTrafficLoading] = useState(true)
  const [error, setError] = useState('')
  const [revenueError, setRevenueError] = useState('')
  const [trafficError, setTrafficError] = useState('')
  const [locationsError, setLocationsError] = useState('')
  const [patternsError, setPatternsError] = useState('')

  const handleSessionError = useCallback(
    (err) => {
      if (isSessionError(err)) {
        clearAdminToken()
        navigate('/admin', { replace: true })
        return true
      }
      return false
    },
    [navigate],
  )

  const statsYearMonth = useCallback(() => {
    const now = new Date()
    return {
      year: stats?.year ?? now.getFullYear(),
      month: stats?.month ?? now.getMonth() + 1,
    }
  }, [stats?.month, stats?.year])

  const loadStats = useCallback(async () => {
    setError('')
    setLoading(true)
    try {
      const token = getAdminToken()
      const [summary, byProvince] = await Promise.all([
        fetchAdminStats(token),
        fetchAdminBusinessesByProvince(token),
      ])
      setStats(summary)
      setProvinceStats(byProvince)
    } catch (err) {
      if (handleSessionError(err)) return
      setError(getUserFacingMessage(err, 'No pudimos cargar las estadísticas.'))
    } finally {
      setLoading(false)
    }
  }, [handleSessionError])

  const loadRevenueChart = useCallback(async () => {
    setRevenueError('')
    setRevenueLoading(true)
    try {
      const token = getAdminToken()
      const { year, month } = statsYearMonth()
      const data = await fetchAdminRevenueChart(token, {
        granularity: revenueGranularity,
        year: revenueGranularity === 'monthly' ? undefined : year,
        month: revenueGranularity === 'monthly' ? undefined : month,
      })
      setRevenueChart(data)
    } catch (err) {
      if (handleSessionError(err)) return
      setRevenueChart(null)
      setRevenueError(getUserFacingMessage(err, 'No pudimos cargar el gráfico de recaudación.'))
    } finally {
      setRevenueLoading(false)
    }
  }, [handleSessionError, revenueGranularity, statsYearMonth])

  const loadTrafficChart = useCallback(async () => {
    setTrafficError('')
    setTrafficLoading(true)
    try {
      const token = getAdminToken()
      const { year, month } = statsYearMonth()
      const chart = await fetchAdminTrafficChart(token, {
        granularity: trafficGranularity,
        year: trafficGranularity === 'monthly' ? undefined : year,
        month: trafficGranularity === 'monthly' ? undefined : month,
      })
      setTrafficChart(chart)
    } catch (err) {
      if (handleSessionError(err)) return
      setTrafficChart(null)
      setTrafficError(getUserFacingMessage(err, 'No pudimos cargar el gráfico de tráfico.'))
    } finally {
      setTrafficLoading(false)
    }
  }, [handleSessionError, statsYearMonth, trafficGranularity])

  const loadTrafficBreakdown = useCallback(async () => {
    setLocationsError('')
    setPatternsError('')
    try {
      const token = getAdminToken()
      const { year, month } = statsYearMonth()
      const [locations, patterns] = await Promise.all([
        fetchAdminTrafficLocations(token, { year, month }),
        fetchAdminTrafficPatterns(token, { year, month }),
      ])
      setTrafficLocations(locations)
      setTrafficPatterns(patterns)
    } catch (err) {
      if (handleSessionError(err)) return
      setTrafficLocations(null)
      setTrafficPatterns(null)
      const message = getUserFacingMessage(err, 'No pudimos cargar el desglose de tráfico.')
      setLocationsError(message)
      setPatternsError(message)
    }
  }, [handleSessionError, statsYearMonth])

  const refreshAll = useCallback(() => {
    loadStats()
    loadRevenueChart()
    loadTrafficChart()
    loadTrafficBreakdown()
  }, [loadStats, loadRevenueChart, loadTrafficChart, loadTrafficBreakdown])

  useEffect(() => {
    loadStats()
  }, [loadStats, location.pathname])

  useEffect(() => {
    loadRevenueChart()
  }, [loadRevenueChart, location.pathname])

  useEffect(() => {
    loadTrafficChart()
  }, [loadTrafficChart, location.pathname])

  useEffect(() => {
    loadTrafficBreakdown()
  }, [loadTrafficBreakdown, location.pathname])

  useEffect(() => {
    function onVisible() {
      if (document.visibilityState === 'visible') {
        refreshAll()
      }
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [refreshAll])

  const periodLabel = stats
    ? `${MONTH_NAMES[stats.month - 1]} ${stats.year}`
    : ''

  const refreshing = loading || revenueLoading || trafficLoading

  return (
    <main className="mx-auto max-w-3xl px-4 pt-6 sm:px-6">
      <section className={`mb-6 ${adminCardHighlight}`}>
        <div className="mb-4 flex justify-end">
          <button
            type="button"
            onClick={() => refreshAll()}
            disabled={refreshing}
            className={`rounded-xl border border-zinc-700/80 px-3 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:border-brand-green/30 hover:bg-brand-green/10 hover:text-zinc-100 disabled:opacity-50 ${adminFocusRing}`}
          >
            {refreshing ? 'Actualizando…' : 'Actualizar'}
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
              Pagos, tráfico del marketplace, tiendas activas y pedidos.
              Los pagos del mes suman los montos aprobados en {periodLabel || 'este mes'}.
            </p>
          </div>
        </div>
      </section>

      {error && (
        <p className={`mb-4 ${adminAlertError}`} role="alert">
          {error}
        </p>
      )}

      {loading && !stats ? (
        <LoadingState variant="admin" message="Cargando estadísticas…" />
      ) : (
      <>
      <div className="grid gap-3 sm:grid-cols-2">
        <MetricCard
          accent="payments"
          label="Pagos del mes"
          hint="Monto total registrado al aprobar o renovar tiendas este mes"
          value={loading ? '…' : formatPrice(stats?.payments_total_cup ?? 0, 'CUP')}
          subvalue={
            !loading && stats
              ? `${stats.payments_count} pago${stats.payments_count === 1 ? '' : 's'}`
              : undefined
          }
        />
        <MetricCard
          accent="traffic"
          label="Tráfico marketplace"
          hint="Visitantes únicos (sesión/día) en /comprar este mes"
          value={loading ? '…' : String(stats?.marketplace_visits ?? 0)}
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
          accent="products"
          label="Productos publicados"
          hint="Total en catálogos de todas las tiendas"
          value={loading ? '…' : String(stats?.published_products ?? 0)}
        />
        <MetricCard
          accent="orders"
          label="Pedidos realizados"
          hint="Compras registradas en la plataforma"
          value={loading ? '…' : String(stats?.orders_total ?? 0)}
        />
      </div>

      <div className="mt-4">
        <AdminTrafficChart
          granularity={trafficGranularity}
          onGranularityChange={setTrafficGranularity}
          chart={trafficChart}
          loading={trafficLoading}
          error={trafficError}
        />
      </div>

      <div className="mt-4">
        <AdminTrafficLocationChart
          data={trafficLocations}
          loading={trafficLoading}
          error={locationsError}
        />
      </div>

      <div className="mt-4">
        <AdminTrafficPatternsChart
          data={trafficPatterns}
          loading={trafficLoading}
          error={patternsError}
        />
      </div>

      <div className="mt-4">
        <AdminRevenueChart
          granularity={revenueGranularity}
          onGranularityChange={setRevenueGranularity}
          chart={revenueChart}
          loading={revenueLoading}
          error={revenueError}
        />
      </div>

      <div className="mt-4">
        <AdminBusinessesByProvinceChart data={provinceStats} loading={loading} />
      </div>
      </>
      )}
    </main>
  )
}

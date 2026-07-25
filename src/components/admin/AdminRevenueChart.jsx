import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { formatPrice } from '../../lib/money'
import { adminCard, adminChoice, adminMuted, adminSubtle } from './adminStyles'
import AdminTrendIndicator from './AdminTrendIndicator'

const CHART_STROKE = '#59802c'
const GRANULARITY_OPTIONS = [
  { id: 'daily', label: 'Diario' },
  { id: 'weekly', label: 'Semanal' },
  { id: 'monthly', label: 'Mensual' },
]

function formatRevenueTick(value) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `${Math.round(value / 1_000)}k`
  return String(Math.round(value))
}

function RevenueTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  const amount = payload[0]?.value ?? 0

  return (
    <div className="rounded-xl border border-brand-green/20 bg-zinc-900 px-3 py-2 shadow-[0_8px_24px_rgba(0,0,0,0.45)]">
      <p className="text-[0.65rem] font-semibold uppercase tracking-[0.06em] text-zinc-400">
        {label}
      </p>
      <p className="mt-0.5 text-sm font-semibold tabular-nums text-brand-green">
        {formatPrice(amount, 'CUP')}
      </p>
    </div>
  )
}

export default function AdminRevenueChart({
  granularity,
  onGranularityChange,
  chart,
  loading,
  error,
}) {
  const monthsAvailable = chart?.months_available ?? 0
  const canShowMonthly = monthsAvailable >= 2
  const visibleOptions = GRANULARITY_OPTIONS.filter(
    (option) => option.id !== 'monthly' || canShowMonthly,
  )
  const points = chart?.points ?? []
  const hasData = points.some((point) => Number(point.amount) > 0)

  return (
    <section className={adminCard}>
      <div className="mb-4">
        <h3 className="text-sm font-medium text-zinc-50">Dinero recaudado</h3>
        <p className={`mt-1.5 text-xs leading-relaxed ${adminSubtle}`}>
          Pagos de suscripción registrados al aprobar o renovar tiendas. Cambia entre vista diaria,
          semanal o mensual.
        </p>
      </div>

      <div className="mb-4 grid grid-cols-3 gap-2">
        {visibleOptions.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => onGranularityChange(option.id)}
            className={adminChoice(granularity === option.id)}
          >
            {option.label}
          </button>
        ))}
      </div>

      {loading && !chart ? (
        <p className={`py-10 text-center text-sm ${adminMuted}`}>Cargando gráfico…</p>
      ) : null}

      {!loading && error ? (
        <p
          className="rounded-xl border border-brand-carmelita/25 bg-brand-carmelita/10 px-4 py-5 text-center text-sm text-zinc-200"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      {!loading && !error && chart && !hasData ? (
        <p className={`rounded-xl border border-zinc-800/80 bg-zinc-900/40 px-4 py-8 text-center text-sm ${adminSubtle}`}>
          Aún no hay recaudación registrada en este periodo.
        </p>
      ) : null}

      {!loading && !error && chart && hasData ? (
        <>
          <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className={`text-xs font-medium uppercase tracking-wide ${adminMuted}`}>
                Total del periodo
              </p>
              <p className="mt-1 text-2xl font-semibold tabular-nums text-zinc-50 sm:text-3xl">
                {formatPrice(chart.total_cup ?? 0, 'CUP')}
              </p>
              <AdminTrendIndicator comparison={chart.comparison} className="mt-1.5" />
            </div>
            {chart.payments_count > 0 ? (
              <p className={`text-xs tabular-nums ${adminMuted}`}>
                {chart.payments_count} pago{chart.payments_count === 1 ? '' : 's'}
              </p>
            ) : null}
          </div>

          <div className="h-56 w-full min-w-0 sm:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={points} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="admin-revenue-fill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={CHART_STROKE} stopOpacity={0.35} />
                    <stop offset="100%" stopColor={CHART_STROKE} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#59802c14" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fill: '#a1a1aa', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  interval="preserveStartEnd"
                  minTickGap={24}
                />
                <YAxis
                  tickFormatter={formatRevenueTick}
                  tick={{ fill: '#a1a1aa', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  width={42}
                />
                <Tooltip
                  cursor={{ stroke: '#59802c33', strokeWidth: 1 }}
                  content={<RevenueTooltip />}
                />
                <Area
                  type="monotone"
                  dataKey="amount"
                  stroke={CHART_STROKE}
                  strokeWidth={2.5}
                  fill="url(#admin-revenue-fill)"
                  dot={{ r: 3, fill: CHART_STROKE, strokeWidth: 0 }}
                  activeDot={{ r: 5, fill: CHART_STROKE, stroke: '#18181b', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </>
      ) : null}
    </section>
  )
}

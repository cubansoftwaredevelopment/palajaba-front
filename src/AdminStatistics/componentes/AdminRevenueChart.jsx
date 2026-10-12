import { formatPrice } from '../../lib/money'
import { adminCard, adminMuted, adminSubtle } from '../../components/admin/adminStyles'
import AdminCandleChart from './AdminCandleChart'
import AdminTrendIndicator from './AdminTrendIndicator'

function formatRevenueTick(value) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `${Math.round(value / 1_000)}k`
  return String(Math.round(value))
}

export default function AdminRevenueChart({ chart, loading, error }) {
  const points = chart?.points ?? []
  const hasData = points.some((point) => Number(point.amount) > 0 || Number(point.close) > 0)

  return (
    <section className={adminCard}>
      <div className="mb-4">
        <h3 className="text-sm font-medium text-zinc-50">Dinero recaudado</h3>
        <p className={`mt-1.5 text-xs leading-relaxed ${adminSubtle}`}>
          Pagos de suscripción registrados al aprobar o renovar tiendas.
        </p>
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
          <AdminCandleChart
            points={points.map((point) => ({ ...point, count: point.amount }))}
            formatValue={(value) => formatPrice(value, 'CUP')}
            formatTick={formatRevenueTick}
          />
        </>
      ) : null}
    </section>
  )
}

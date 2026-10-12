import { adminCard, adminMuted, adminSubtle } from '../../components/admin/adminStyles'
import AdminCandleChart from './AdminCandleChart'
import AdminTrendIndicator from './AdminTrendIndicator'

function formatCountTick(value) {
  if (value >= 1_000) return `${Math.round(value / 1_000)}k`
  return String(Math.round(value))
}

function formatOrders(count) {
  const n = Math.round(count)
  return `${n.toLocaleString('es')} pedido${n === 1 ? '' : 's'}`
}

export default function AdminOrdersChart({ chart, loading, error }) {
  const points = chart?.points ?? []
  const hasData = points.some((point) => Number(point.count) > 0 || Number(point.close) > 0)

  return (
    <section className={adminCard}>
      <div className="mb-4">
        <h3 className="text-sm font-medium text-zinc-50">Pedidos completados</h3>
        <p className={`mt-1.5 text-xs leading-relaxed ${adminSubtle}`}>
          Volumen de pedidos confirmados en la plataforma (sin pendientes). Cada vela es el % de
          cambio frente a la anterior.
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
          Aún no hay pedidos completados en este periodo.
        </p>
      ) : null}

      {!loading && !error && chart && hasData ? (
        <>
          <div className="mb-3">
            <p className={`text-xs font-medium uppercase tracking-wide ${adminMuted}`}>
              Total del periodo
            </p>
            <p className="mt-1 text-2xl font-semibold tabular-nums text-zinc-50 sm:text-3xl">
              {(chart.total_orders ?? 0).toLocaleString('es')}
            </p>
            <AdminTrendIndicator comparison={chart.comparison} className="mt-1.5" />
          </div>
          <AdminCandleChart
            points={points}
            change
            formatValue={formatOrders}
            formatTick={formatCountTick}
          />
        </>
      ) : null}
    </section>
  )
}

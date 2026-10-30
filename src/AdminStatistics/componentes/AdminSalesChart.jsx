import { formatPrice } from '../../lib/money'
import { adminCard, adminMuted, adminSubtle } from '../../components/admin/adminStyles'
import AdminCandleChart from './AdminCandleChart'

function formatMoneyTick(value) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M CUP`
  if (value >= 1_000) return `${Math.round(value / 1_000)}k CUP`
  return `${Math.round(value)} CUP`
}

export default function AdminSalesChart({ chart, loading, error }) {
  const currencies = chart?.currencies ?? []
  const deliveryCurrencies = (chart?.delivery_currencies ?? []).filter((series) => Number(series.total) > 0)
  const points = chart?.points ?? []
  const hasData = currencies.length
    ? currencies.some((series) => series.points?.some((point) => Number(point.count) > 0 || Number(point.close) > 0))
    : points.some((point) => Number(point.count) > 0 || Number(point.close) > 0)

  return (
    <>
    <section className={`${adminCard} mb-5`}>
      <div className="mb-4">
        <h3 className="text-sm font-medium text-zinc-50">Monto vendido</h3>
        <p className={`mt-1.5 text-xs leading-relaxed ${adminSubtle}`}>
          Pedidos completados, por moneda de pago. Cada vela indica el cambio frente a la anterior.
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
          Aún no hay ventas convertibles en este periodo.
        </p>
      ) : null}

      {!loading && !error && chart && hasData ? (
        <>
          <div className="mb-3">
            <p className={`text-xs font-medium uppercase tracking-wide ${adminMuted}`}>
              Total del periodo
            </p>
            <p className="mt-1 text-2xl font-semibold tabular-nums text-zinc-50 sm:text-3xl">
              {currencies.map((series) => formatPrice(series.total, series.currency)).join(' · ') || formatPrice(chart.total_cup ?? 0, 'CUP')}
            </p>
            <p className={`mt-1 text-xs tabular-nums ${adminMuted}`}>
              {(chart.orders_counted ?? 0).toLocaleString('es')} pedido
              {chart.orders_counted === 1 ? '' : 's'} con moneda convertible
            </p>
          </div>
          {currencies.length ? currencies.flatMap((series) => [
            ['Artículos', series.points, series.total],
          ].map(([name, chartPoints, total]) => (
            <div key={`${series.currency}-${name}`} className="mb-3">
              <div className="mb-1 flex justify-between gap-3">
                <p className={`text-xs font-semibold uppercase ${adminMuted}`}>{name} · {series.currency}</p>
                <p className="text-xs font-semibold text-zinc-100">{formatPrice(total, series.currency)}</p>
              </div>
              {chartPoints?.length ? <AdminCandleChart points={chartPoints} change
                formatValue={(value) => formatPrice(value, series.currency)}
                formatTick={(value) => formatMoneyTick(value).replace('CUP', series.currency)} yAxisWidth={88} /> : null}
            </div>
          ))) : <AdminCandleChart points={points} change formatValue={(value) => formatPrice(value, 'CUP')} formatTick={formatMoneyTick} yAxisWidth={78} />}
        </>
      ) : null}
    </section>
    <section className={adminCard}>
      <div className="mb-4">
        <h3 className="text-sm font-medium text-zinc-50">Mensajería</h3>
        <p className={`mt-1.5 text-xs leading-relaxed ${adminSubtle}`}>Importes diarios por moneda del envío. Los pedidos sin mensajería aportan 0.</p>
      </div>
      {!loading && !error && deliveryCurrencies.length > 0 ? (
        <div className="mb-4">
          <p className={`text-xs font-medium uppercase tracking-wide ${adminMuted}`}>Total del periodo</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-zinc-50 sm:text-3xl">
            {deliveryCurrencies.map((series) => formatPrice(series.total, series.currency)).join(' · ')}
          </p>
        </div>
      ) : null}
      {!loading && !error && chart && deliveryCurrencies.length === 0 ? <p className={`py-6 text-center text-sm ${adminMuted}`}>No hay importes de mensajería en este periodo.</p> : null}
      {!loading && !error && deliveryCurrencies.flatMap((series) => (
        <div key={series.currency} className="mb-3">
          <div className="mb-1 flex justify-between gap-3"><p className={`text-xs font-semibold uppercase ${adminMuted}`}>{series.currency}</p><p className="text-xs font-semibold text-zinc-100">{formatPrice(series.total, series.currency)}</p></div>
          <AdminCandleChart points={series.points} change formatValue={(value) => formatPrice(value, series.currency)} formatTick={(value) => formatMoneyTick(value).replace('CUP', series.currency)} yAxisWidth={88} />
        </div>
      ))}
    </section>
    </>
  )
}

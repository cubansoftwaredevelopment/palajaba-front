import { useMemo } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { adminCard, adminChoice, adminMuted, adminSubtle } from './adminStyles'

const CHART_COLOR = '#59802c'
const CHART_COLOR_DIM = '#59802c99'
const GRANULARITY_OPTIONS = [
  { id: 'daily', label: 'Diario' },
  { id: 'weekly', label: 'Semanal' },
  { id: 'monthly', label: 'Mensual' },
]

function shortenName(name, maxLength = 18) {
  if (!name || name.length <= maxLength) return name
  return `${name.slice(0, maxLength - 1)}…`
}

function formatOrders(count) {
  const n = Math.round(count)
  return `${n.toLocaleString('es')} pedido${n === 1 ? '' : 's'}`
}

function BusinessTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const item = payload[0]?.payload
  if (!item) return null

  return (
    <div className="rounded-xl border border-brand-green/20 bg-zinc-900 px-3 py-2 shadow-[0_8px_24px_rgba(0,0,0,0.45)]">
      <p className="max-w-[14rem] text-[0.65rem] font-semibold uppercase tracking-[0.06em] text-zinc-400">
        {item.store_name}
      </p>
      {(item.municipality_name || item.province_name) && (
        <p className="mt-0.5 text-[0.65rem] text-zinc-500">
          {[item.municipality_name, item.province_name].filter(Boolean).join(', ')}
        </p>
      )}
      <p className="mt-0.5 text-sm font-semibold tabular-nums text-brand-green">
        {formatOrders(item.count)}
      </p>
    </div>
  )
}

export default function AdminTopBusinessesChart({
  granularity,
  onGranularityChange,
  data,
  loading,
  error,
}) {
  const businesses = data?.businesses ?? []
  const hasData = businesses.length > 0

  const chartData = useMemo(
    () =>
      businesses.map((item) => ({
        ...item,
        label: shortenName(item.store_name),
      })),
    [businesses],
  )

  const chartHeight = Math.max(220, chartData.length * 38 + 48)

  return (
    <section className={adminCard}>
      <div className="mb-4">
        <h3 className="text-sm font-medium text-zinc-50">Top 10 negocios</h3>
        <p className={`mt-1.5 text-xs leading-relaxed ${adminSubtle}`}>
          Tiendas con más pedidos completados
          {data?.period_label ? ` · ${data.period_label}` : ''}.
        </p>
      </div>

      <div className="mb-4 grid grid-cols-3 gap-2">
        {GRANULARITY_OPTIONS.map((option) => (
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

      {loading && !data ? (
        <p className={`py-10 text-center text-sm ${adminMuted}`}>Cargando ranking…</p>
      ) : null}

      {!loading && error ? (
        <p
          className="rounded-xl border border-brand-carmelita/25 bg-brand-carmelita/10 px-4 py-5 text-center text-sm text-zinc-200"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      {!loading && !error && !hasData ? (
        <p className={`rounded-xl border border-zinc-800/80 bg-zinc-900/40 px-4 py-8 text-center text-sm ${adminSubtle}`}>
          Aún no hay pedidos completados en este periodo.
        </p>
      ) : null}

      {!loading && !error && hasData ? (
        <>
          <p className="mb-3 text-sm tabular-nums text-zinc-300">
            {(data.total_orders ?? 0).toLocaleString('es')}
            <span className={`ml-1.5 text-xs ${adminMuted}`}>pedidos en el periodo</span>
          </p>
          <div className="w-full min-w-0" style={{ height: chartHeight }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                layout="vertical"
                margin={{ top: 4, right: 16, left: 8, bottom: 4 }}
              >
                <CartesianGrid stroke="#59802c14" horizontal={false} />
                <XAxis
                  type="number"
                  allowDecimals={false}
                  tick={{ fill: '#a1a1aa', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="label"
                  width={120}
                  tick={{ fill: '#d4d4d8', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip cursor={{ fill: '#59802c12' }} content={<BusinessTooltip />} />
                <Bar dataKey="count" radius={[0, 6, 6, 0]} maxBarSize={24}>
                  {chartData.map((entry, index) => (
                    <Cell
                      key={entry.seller_id}
                      fill={index === 0 ? CHART_COLOR : CHART_COLOR_DIM}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      ) : null}
    </section>
  )
}

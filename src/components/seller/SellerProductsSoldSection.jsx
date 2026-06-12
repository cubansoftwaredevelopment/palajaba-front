import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import StatePanel from '../ui/StatePanel'
import LoadingState from '../ui/LoadingState'
import { sellerHint, sellerSection, sellerSectionGap } from './sellerStyles'
import SellerChartGranularity from './SellerChartGranularity'

const CHART_COLOR = '#59802c'
const CHART_GRADIENT = ['#59802c', '#59802c22']

function formatCountTick(value) {
  if (value >= 1_000) return `${Math.round(value / 1_000)}k`
  return String(Math.round(value))
}

function formatProductCount(value) {
  const count = Math.round(value)
  return `${count.toLocaleString('es')} ${count === 1 ? 'producto' : 'productos'}`
}

export default function SellerProductsSoldSection({
  granularity,
  onGranularityChange,
  monthsAvailable,
  loading,
  error,
  chart,
}) {
  const [stroke, fillEnd] = CHART_GRADIENT
  const gradientId = 'products-sold-fill'
  const total = chart?.total ?? 0
  const points = chart?.points ?? []
  const hasData = total > 0

  return (
    <section className={sellerSectionGap}>
      <div>
        <h3 className="font-display text-lg font-bold text-brand-green sm:text-xl">
          Productos vendidos
        </h3>
        <p className={`mt-1 ${sellerHint}`}>
          Unidades vendidas en pedidos completados. Todas las líneas del pedido se suman juntas.
        </p>
      </div>

      <SellerChartGranularity
        granularity={granularity}
        onGranularityChange={onGranularityChange}
        monthsAvailable={monthsAvailable}
      />

      {loading ? (
        <LoadingState variant="panel" message="Cargando gráfico…" />
      ) : null}

      {!loading && error ? (
        <StatePanel variant="compact" title="No se pudo cargar" message={error} />
      ) : null}

      {!loading && !error && !hasData ? (
        <p className="rounded-2xl border border-brand-yellow/25 bg-brand-yellow/15 px-4 py-5 text-center text-sm text-brand-carmelita/90">
          Aún no hay productos vendidos en este periodo.
        </p>
      ) : null}

      {!loading && !error && hasData ? (
        <div className={`${sellerSection} overflow-hidden`}>
          <div className="mb-3">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-brand-carmelita/75">
              Total vendido
            </p>
            <p className="font-display text-xl font-bold text-brand-green">
              {formatProductCount(total)}
            </p>
          </div>

          <div className="h-56 w-full min-w-0 sm:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={points} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={stroke} stopOpacity={0.28} />
                    <stop offset="100%" stopColor={fillEnd} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#59802c14" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fill: '#7b4c38aa', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  interval="preserveStartEnd"
                  minTickGap={24}
                />
                <YAxis
                  allowDecimals={false}
                  tickFormatter={formatCountTick}
                  tick={{ fill: '#7b4c38aa', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  width={42}
                />
                <Tooltip
                  cursor={{ stroke: '#59802c33', strokeWidth: 1 }}
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null
                    const count = payload[0]?.value ?? 0
                    return (
                      <div className="rounded-xl border border-brand-green/12 bg-brand-white px-3 py-2 shadow-[0_8px_24px_rgba(89,128,44,0.14)]">
                        <p className="text-[0.65rem] font-semibold uppercase tracking-[0.06em] text-brand-carmelita/75">
                          {label}
                        </p>
                        <p className="mt-0.5 font-display text-sm font-bold text-brand-green">
                          {formatProductCount(count)}
                        </p>
                      </div>
                    )
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke={stroke}
                  strokeWidth={2.5}
                  fill={`url(#${gradientId})`}
                  dot={{ r: 3, fill: stroke, strokeWidth: 0 }}
                  activeDot={{ r: 5, fill: stroke, stroke: '#fdfbf2', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : null}
    </section>
  )
}

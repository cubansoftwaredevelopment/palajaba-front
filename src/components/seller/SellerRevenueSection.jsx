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
import {
  sellerHint,
  sellerSection,
  sellerSectionGap,
} from './sellerStyles'
import SellerChartGranularity from './SellerChartGranularity'
import TrendIndicator from './TrendIndicator'

const CURRENCY_COLORS = {
  CUP: '#59802c',
  USD: '#7b4c38',
  MLC: '#c9970a',
}

const CURRENCY_GRADIENTS = {
  CUP: ['#59802c', '#59802c22'],
  USD: ['#7b4c38', '#7b4c3822'],
  MLC: ['#c9970a', '#c9970a22'],
}

function formatRevenueTick(value) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `${Math.round(value / 1_000)}k`
  return String(Math.round(value))
}

function formatRevenueAmount(value, currency) {
  if (currency === 'CUP') {
    return `${Math.round(value).toLocaleString('es')} CUP`
  }
  return `${Number(value).toLocaleString('es', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`
}

function RevenueCurrencyChart({ series }) {
  const color = CURRENCY_COLORS[series.currency] ?? '#59802c'
  const [stroke, fillEnd] = CURRENCY_GRADIENTS[series.currency] ?? CURRENCY_GRADIENTS.CUP
  const gradientId = `revenue-fill-${series.currency.toLowerCase()}`

  return (
    <div className={`${sellerSection} overflow-hidden`}>
      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-brand-carmelita/75">
            Recaudado
          </p>
          <p className="font-display text-xl font-bold text-brand-green">
            {formatRevenueAmount(series.total, series.currency)}
          </p>
          <TrendIndicator comparison={series.comparison} className="mt-1" />
        </div>
        <span
          className="rounded-full px-2.5 py-1 text-[0.65rem] font-bold uppercase tracking-[0.06em] text-brand-white"
          style={{ backgroundColor: color }}
        >
          {series.currency}
        </span>
      </div>

      <div className="h-56 w-full min-w-0 sm:h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={series.points} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
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
              tickFormatter={formatRevenueTick}
              tick={{ fill: '#7b4c38aa', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={42}
            />
            <Tooltip
              cursor={{ stroke: '#59802c33', strokeWidth: 1 }}
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null
                const amount = payload[0]?.value ?? 0
                return (
                  <div className="rounded-xl border border-brand-green/12 bg-brand-white px-3 py-2 shadow-[0_8px_24px_rgba(89,128,44,0.14)]">
                    <p className="text-[0.65rem] font-semibold uppercase tracking-[0.06em] text-brand-carmelita/75">
                      {label}
                    </p>
                    <p className="mt-0.5 font-display text-sm font-bold text-brand-green">
                      {formatRevenueAmount(amount, series.currency)}
                    </p>
                  </div>
                )
              }}
            />
            <Area
              type="monotone"
              dataKey="amount"
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
  )
}

export default function SellerRevenueSection({
  granularity,
  onGranularityChange,
  monthsAvailable,
  loading,
  error,
  chart,
}) {
  return (
    <section className={sellerSectionGap}>
      <div>
        <h3 className="font-display text-lg font-bold text-brand-green sm:text-xl">
          Dinero recaudado
        </h3>
        <p className={`mt-1 ${sellerHint}`}>
          Solo pedidos completados, productos vendidos (sin domicilio). Cada moneda se muestra por separado.
        </p>
      </div>

      <SellerChartGranularity
        granularity={granularity}
        onGranularityChange={onGranularityChange}
        monthsAvailable={monthsAvailable}
      />

      {loading ? (
        <LoadingState variant="panel" message="Cargando gráficos…" />
      ) : null}

      {!loading && error ? (
        <StatePanel variant="compact" title="No se pudo cargar" message={error} serviceError />
      ) : null}

      {!loading && !error && chart?.series?.length === 0 ? (
        <p className="rounded-2xl border border-brand-yellow/25 bg-brand-yellow/15 px-4 py-5 text-center text-sm text-brand-carmelita/90">
          Aún no hay ingresos registrados en este periodo.
        </p>
      ) : null}

      {!loading && !error && chart?.series?.length > 0 ? (
        <div className="flex flex-col gap-3 sm:gap-4">
          {chart.series.map((series) => (
            <RevenueCurrencyChart key={series.currency} series={series} />
          ))}
        </div>
      ) : null}
    </section>
  )
}

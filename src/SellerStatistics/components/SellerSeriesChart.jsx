import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { formatAxisTick, formatCount } from '../utils'
import SellerChartCard from './SellerChartCard'

const STROKE = '#59802c'

function ChartTooltip({ label, value, suffix }) {
  return (
    <div className="rounded-xl border border-brand-green/12 bg-brand-white px-3 py-2 shadow-[0_8px_24px_rgba(89,128,44,0.14)]">
      <p className="text-[0.65rem] font-semibold uppercase tracking-[0.06em] text-brand-carmelita/75">
        {label}
      </p>
      <p className="mt-0.5 font-display text-sm font-bold text-brand-green">
        {formatCount(value)}
        {suffix ? ` ${suffix}` : ''}
      </p>
    </div>
  )
}

export default function SellerSeriesChart({
  title,
  hint,
  loading,
  error,
  chart,
  emptyMessage,
  kind = 'area',
  valueLabel = '',
  color = STROKE,
  chartId = 'series',
}) {
  const points = chart?.points ?? []
  const empty = !points.some((point) => Number(point.value) > 0)

  return (
    <SellerChartCard
      title={title}
      hint={hint}
      loading={loading}
      error={error}
      empty={empty}
      emptyMessage={emptyMessage}
    >
      <p className="mb-2 font-display text-xl font-bold tabular-nums text-brand-green">
        {formatCount(chart?.total)}
        {valueLabel ? <span className="ml-1 text-sm font-semibold text-brand-carmelita/80">{valueLabel}</span> : null}
      </p>
      <div className="h-52 w-full min-w-0 sm:h-60">
        <ResponsiveContainer width="100%" height="100%">
          {kind === 'bar' ? (
            <BarChart data={points} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
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
                tickFormatter={formatAxisTick}
                tick={{ fill: '#7b4c38aa', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={36}
              />
              <Tooltip
                cursor={{ fill: '#59802c12' }}
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null
                  return <ChartTooltip label={label} value={payload[0]?.value} suffix={valueLabel} />
                }}
              />
              <Bar dataKey="value" fill={color} radius={[8, 8, 0, 0]} />
            </BarChart>
          ) : (
            <AreaChart data={points} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id={`seller-series-${chartId}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={0.28} />
                  <stop offset="100%" stopColor={color} stopOpacity={0.02} />
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
                tickFormatter={formatAxisTick}
                tick={{ fill: '#7b4c38aa', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={36}
              />
              <Tooltip
                cursor={{ stroke: '#59802c33', strokeWidth: 1 }}
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null
                  return <ChartTooltip label={label} value={payload[0]?.value} suffix={valueLabel} />
                }}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke={color}
                strokeWidth={2.5}
                fill={`url(#seller-series-${chartId})`}
                dot={{ r: 3, fill: color, strokeWidth: 0 }}
              />
            </AreaChart>
          )}
        </ResponsiveContainer>
      </div>
    </SellerChartCard>
  )
}

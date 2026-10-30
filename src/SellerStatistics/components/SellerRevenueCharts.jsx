import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { sellerSection } from '../../components/seller/sellerStyles'
import { formatAxisTick, formatRevenueAmount } from '../utils'
import SellerChartCard from './SellerChartCard'

const CURRENCY_COLORS = {
  CUP: '#59802c',
  USD: '#7b4c38',
  MLC: '#c9970a',
}

export default function SellerRevenueCharts({ loading, error, chart }) {
  const series = chart?.series ?? []

  return (
    <SellerChartCard
      title="Ingresos"
      hint="Solo pedidos completados. Cada moneda se muestra por separado."
      loading={loading}
      error={error}
      empty={!series.length}
      emptyMessage="Aún no hay ingresos en este periodo."
    >
      <div className="flex flex-col gap-3">
        {series.map((item) => {
          const color = CURRENCY_COLORS[item.currency] ?? '#59802c'
          const gradientId = `seller-revenue-${item.currency.toLowerCase()}`
          return (
            <div key={item.currency} className={`${sellerSection} !shadow-none`}>
              <div className="mb-2 flex items-end justify-between gap-3">
                <p className="font-display text-xl font-bold text-brand-green">
                  {formatRevenueAmount(item.total, item.currency)}
                </p>
                <span
                  className="rounded-full px-2.5 py-1 text-[0.65rem] font-bold uppercase tracking-[0.06em] text-brand-white"
                  style={{ backgroundColor: color }}
                >
                  {item.currency}
                </span>
              </div>
              <div className="h-48 w-full min-w-0 sm:h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={item.points} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
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
                      tickFormatter={(value) => `${formatAxisTick(value)} ${item.currency}`}
                      tick={{ fill: '#7b4c38aa', fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      width={76}
                    />
                    <Tooltip
                      cursor={{ stroke: '#59802c33', strokeWidth: 1 }}
                      content={({ active, payload, label }) => {
                        if (!active || !payload?.length) return null
                        return (
                          <div className="rounded-xl border border-brand-green/12 bg-brand-white px-3 py-2 shadow-[0_8px_24px_rgba(89,128,44,0.14)]">
                            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.06em] text-brand-carmelita/75">
                              {label}
                            </p>
                            <p className="mt-0.5 font-display text-sm font-bold text-brand-green">
                              {formatRevenueAmount(payload[0]?.value ?? 0, item.currency)}
                            </p>
                          </div>
                        )
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke={color}
                      strokeWidth={2.5}
                      fill={`url(#${gradientId})`}
                      dot={{ r: 3, fill: color, strokeWidth: 0 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )
        })}
      </div>
    </SellerChartCard>
  )
}

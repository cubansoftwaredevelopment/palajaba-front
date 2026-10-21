import {
  CartesianGrid,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from 'recharts'

import { formatCount, formatPercent } from '../utils'
import SellerChartCard from './SellerChartCard'

export default function SellerProductConversionChart({ loading, error, data }) {
  const points =
    data?.items?.map((item) => ({
      name: item.name,
      views: item.views,
      sales: item.purchases,
      z: Math.max(20, item.views),
    })) ?? []

  return (
    <SellerChartCard
      title="Conversión de producto"
      hint={
        data
          ? `Conversión global: ${formatPercent(data.global_conversion_rate)} (${formatCount(data.total_purchases)} compras / ${formatCount(data.total_views)} vistas)`
          : 'Vistas frente a compras de cada producto.'
      }
      loading={loading}
      error={error}
      empty={!points.length}
      emptyMessage="Aún no hay vistas o compras de productos en este periodo."
    >
      <div className="h-64 w-full min-w-0 sm:h-72">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 8, right: 12, left: 0, bottom: 8 }}>
            <CartesianGrid stroke="#59802c14" />
            <XAxis
              type="number"
              dataKey="views"
              name="Vistas"
              tick={{ fill: '#7b4c38aa', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              type="number"
              dataKey="sales"
              name="Compras"
              allowDecimals={false}
              tick={{ fill: '#7b4c38aa', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={36}
            />
            <ZAxis type="number" dataKey="z" range={[40, 160]} />
            <Tooltip
              cursor={{ strokeDasharray: '3 3' }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null
                const point = payload[0]?.payload
                return (
                  <div className="rounded-xl border border-brand-green/12 bg-brand-white px-3 py-2 shadow-[0_8px_24px_rgba(89,128,44,0.14)]">
                    <p className="text-sm font-semibold text-brand-green">{point?.name}</p>
                    <p className="mt-1 text-xs text-brand-carmelita/85">
                      {formatCount(point?.views)} vistas · {formatCount(point?.sales)} compras
                    </p>
                  </div>
                )
              }}
            />
            <Scatter data={points} fill="#59802c" />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </SellerChartCard>
  )
}

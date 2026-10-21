import { useState } from 'react'
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

function PointDetails({ point }) {
  if (!point) return null
  return (
    <div className="rounded-xl border border-brand-green/12 bg-brand-white px-3 py-2 shadow-[0_8px_24px_rgba(89,128,44,0.14)]">
      <p className="text-sm font-semibold text-brand-green">{point.name}</p>
      <p className="mt-1 text-xs text-brand-carmelita/85">
        {formatCount(point.views)} vistas · {formatCount(point.sales)} compras · {formatPercent(point.rate)}
      </p>
    </div>
  )
}

export default function SellerProductConversionChart({ loading, error, data }) {
  const [selected, setSelected] = useState(null)
  const points =
    data?.items?.map((item) => ({
      name: item.name,
      views: item.views,
      sales: item.purchases,
      rate: item.conversion_rate,
      z: Math.max(48, item.views),
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
      <div className="h-64 w-full min-w-0 overflow-visible sm:h-72 [&_.recharts-wrapper]:overflow-visible [&_.recharts-surface]:overflow-visible">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 16, right: 16, left: 0, bottom: 8 }}>
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
            <ZAxis type="number" dataKey="z" range={[56, 180]} />
            <Tooltip
              cursor={{ strokeDasharray: '3 3' }}
              allowEscapeViewBox={{ x: true, y: true }}
              offset={16}
              wrapperStyle={{ zIndex: 40, outline: 'none', pointerEvents: 'none' }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null
                return <PointDetails point={payload[0]?.payload} />
              }}
            />
            <Scatter
              data={points}
              fill="#59802c"
              onClick={(item) => {
                const point = item?.payload ?? item
                if (point?.name) setSelected(point)
              }}
            />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-3 min-h-[3.5rem]">
        {selected ? (
          <PointDetails point={selected} />
        ) : (
          <p className="text-xs text-brand-carmelita/75 sm:hidden">Toca una bola para ver el producto.</p>
        )}
      </div>
    </SellerChartCard>
  )
}

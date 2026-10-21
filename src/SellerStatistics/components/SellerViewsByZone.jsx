import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

import { formatAxisTick, formatCount } from '../utils'
import SellerChartCard from './SellerChartCard'

export default function SellerViewsByZone({ loading, error, data }) {
  const items = (data?.items ?? []).slice(0, 12).map((item) => ({
    ...item,
    label: item.municipality_name,
  }))

  return (
    <SellerChartCard
      title="Vistas por zona"
      hint="Visitas al perfil agrupadas por municipio del comprador."
      loading={loading}
      error={error}
      empty={!items.length}
      emptyMessage="Aún no hay visitas con zona registrada en este periodo."
    >
      <div className="h-56 w-full min-w-0 sm:h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={items} layout="vertical" margin={{ top: 4, right: 12, left: 4, bottom: 0 }}>
            <CartesianGrid stroke="#59802c14" horizontal={false} />
            <XAxis
              type="number"
              allowDecimals={false}
              tickFormatter={formatAxisTick}
              tick={{ fill: '#7b4c38aa', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="label"
              width={92}
              tick={{ fill: '#7b4c38aa', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              cursor={{ fill: '#59802c12' }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null
                const row = payload[0]?.payload
                return (
                  <div className="rounded-xl border border-brand-green/12 bg-brand-white px-3 py-2 shadow-[0_8px_24px_rgba(89,128,44,0.14)]">
                    <p className="text-sm font-semibold text-brand-green">{row?.municipality_name}</p>
                    <p className="text-xs text-brand-carmelita/85">{row?.province_name}</p>
                    <p className="mt-1 font-display text-sm font-bold text-brand-green">
                      {formatCount(row?.views)} visitas
                    </p>
                  </div>
                )
              }}
            />
            <Bar dataKey="views" fill="#7b4c38" radius={[0, 8, 8, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </SellerChartCard>
  )
}

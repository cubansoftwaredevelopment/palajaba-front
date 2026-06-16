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

import { adminCard, adminMuted, adminSubtle } from './adminStyles'

const CHART_COLOR = '#59802c'
const CHART_COLOR_DIM = '#59802c99'

function formatBusinessCount(value) {
  const count = Math.round(value)
  return `${count.toLocaleString('es')} ${count === 1 ? 'negocio' : 'negocios'}`
}

function ProvinceTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const item = payload[0]?.payload
  if (!item) return null

  return (
    <div className="rounded-xl border border-brand-green/20 bg-zinc-900 px-3 py-2 shadow-[0_8px_24px_rgba(0,0,0,0.45)]">
      <p className="text-[0.65rem] font-semibold uppercase tracking-[0.06em] text-zinc-400">
        {item.province_name}
      </p>
      <p className="mt-0.5 text-sm font-semibold tabular-nums text-brand-green">
        {formatBusinessCount(item.count)}
      </p>
    </div>
  )
}

export default function AdminBusinessesByProvinceChart({ data, loading }) {
  const provinces = data?.provinces ?? []
  const totalWithLocation = data?.total_with_location ?? 0
  const withoutLocation = data?.without_location ?? 0
  const hasData = totalWithLocation > 0
  const chartHeight = Math.max(220, provinces.length * 36 + 48)

  return (
    <section className={adminCard}>
      <div className="mb-4">
        <h3 className="text-sm font-medium text-zinc-50">Negocios por provincia</h3>
        <p className={`mt-1.5 text-xs leading-relaxed ${adminSubtle}`}>
          Tiendas aprobadas con provincia configurada en su perfil.
          {withoutLocation > 0
            ? ` ${withoutLocation} aprobada${withoutLocation === 1 ? '' : 's'} sin ubicación aún.`
            : ''}
        </p>
      </div>

      {loading && !data ? (
        <p className={`py-10 text-center text-sm ${adminMuted}`}>Cargando gráfico…</p>
      ) : null}

      {!loading && !hasData ? (
        <p className={`rounded-xl border border-zinc-800/80 bg-zinc-900/40 px-4 py-8 text-center text-sm ${adminSubtle}`}>
          Aún no hay negocios con provincia registrada.
        </p>
      ) : null}

      {hasData ? (
        <>
          <p className="mb-3 text-2xl font-semibold tabular-nums text-zinc-50">
            {totalWithLocation.toLocaleString('es')}
            <span className={`ml-2 text-sm font-normal ${adminMuted}`}>en total</span>
          </p>

          <div className="w-full min-w-0" style={{ height: chartHeight }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={provinces}
                layout="vertical"
                margin={{ top: 4, right: 12, left: 4, bottom: 4 }}
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
                  dataKey="province_name"
                  width={108}
                  tick={{ fill: '#d4d4d8', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  cursor={{ fill: '#59802c12' }}
                  content={<ProvinceTooltip />}
                />
                <Bar dataKey="count" radius={[0, 6, 6, 0]} maxBarSize={22}>
                  {provinces.map((entry, index) => (
                    <Cell
                      key={entry.province_id}
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

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

import { adminCard, adminMuted, adminSubtle } from './adminStyles'

const CHART_COLOR = '#59802c'
const CHART_COLOR_DIM = '#59802c99'

function formatVisits(count) {
  const n = Math.round(count)
  return `${n.toLocaleString('es')} visitante${n === 1 ? '' : 's'}`
}

function LocationTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const item = payload[0]?.payload
  if (!item) return null

  return (
    <div className="rounded-xl border border-brand-green/20 bg-zinc-900 px-3 py-2 shadow-[0_8px_24px_rgba(0,0,0,0.45)]">
      <p className="max-w-[14rem] text-[0.65rem] font-semibold uppercase tracking-[0.06em] text-zinc-400">
        {item.fullLabel}
      </p>
      <p className="mt-0.5 text-sm font-semibold tabular-nums text-brand-green">
        {formatVisits(item.count)}
      </p>
    </div>
  )
}

export default function AdminTrafficLocationChart({ data, loading, error }) {
  const provinces = data?.provinces ?? []
  const municipalities = data?.municipalities ?? []
  const hasData = (data?.total_visits ?? 0) > 0

  const provinceChart = useMemo(
    () =>
      provinces.map((item) => ({
        ...item,
        label: item.province_name,
        fullLabel: item.province_name,
      })),
    [provinces],
  )

  const chartHeight = Math.max(220, provinceChart.length * 36 + 48)

  return (
    <section className={adminCard}>
      <div className="mb-4">
        <h3 className="text-sm font-medium text-zinc-50">De dónde vienen</h3>
        <p className={`mt-1.5 text-xs leading-relaxed ${adminSubtle}`}>
          Provincia y municipio que eligieron al entrar a comprar este mes.
        </p>
      </div>

      {loading && !data ? (
        <p className={`py-10 text-center text-sm ${adminMuted}`}>Cargando ubicación…</p>
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
          Aún no hay visitas con ubicación este mes.
        </p>
      ) : null}

      {!loading && !error && hasData ? (
        <>
          <p className="mb-3 text-xl font-semibold tabular-nums text-zinc-50">
            {(data.total_visits ?? 0).toLocaleString('es')}
            <span className={`ml-2 text-xs font-normal ${adminMuted}`}>visitantes</span>
          </p>

          {provinceChart.length > 0 ? (
            <div className="mb-6 w-full min-w-0" style={{ height: chartHeight }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={provinceChart}
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
                    width={110}
                    tick={{ fill: '#d4d4d8', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip cursor={{ fill: '#59802c12' }} content={<LocationTooltip />} />
                  <Bar dataKey="count" radius={[0, 6, 6, 0]} maxBarSize={24}>
                    {provinceChart.map((entry, index) => (
                      <Cell
                        key={entry.province_id}
                        fill={index === 0 ? CHART_COLOR : CHART_COLOR_DIM}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : null}

          {municipalities.length > 0 ? (
            <div>
              <p className={`mb-2 text-xs font-medium uppercase tracking-wide ${adminMuted}`}>
                Top municipios
              </p>
              <ul className="divide-y divide-zinc-800/80">
                {municipalities.slice(0, 10).map((item) => (
                  <li
                    key={`${item.province_id}:${item.municipality_id}`}
                    className="flex items-center justify-between gap-3 py-2.5"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm text-zinc-100">{item.municipality_name}</p>
                      <p className={`truncate text-xs ${adminMuted}`}>{item.province_name}</p>
                    </div>
                    <p className="shrink-0 text-sm font-semibold tabular-nums text-brand-green">
                      {item.count.toLocaleString('es')}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </>
      ) : null}
    </section>
  )
}

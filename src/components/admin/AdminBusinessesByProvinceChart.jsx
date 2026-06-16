import { useEffect, useMemo, useState } from 'react'
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
const MOBILE_CHART_QUERY = '(max-width: 639px)'

function formatBusinessCount(value) {
  const count = Math.round(value)
  return `${count.toLocaleString('es')} ${count === 1 ? 'negocio' : 'negocios'}`
}

function shortenProvinceName(name, maxLength = 14) {
  if (!name || name.length <= maxLength) return name
  return `${name.slice(0, maxLength - 1)}…`
}

function useIsMobileChart() {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia(MOBILE_CHART_QUERY).matches
  })

  useEffect(() => {
    const media = window.matchMedia(MOBILE_CHART_QUERY)
    const onChange = () => setIsMobile(media.matches)
    onChange()
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [])

  return isMobile
}

function ProvinceTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const item = payload[0]?.payload
  if (!item) return null

  return (
    <div className="rounded-xl border border-brand-green/20 bg-zinc-900 px-3 py-2 shadow-[0_8px_24px_rgba(0,0,0,0.45)]">
      <p className="max-w-[12rem] text-[0.65rem] font-semibold uppercase tracking-[0.06em] text-zinc-400">
        {item.province_name}
      </p>
      <p className="mt-0.5 text-sm font-semibold tabular-nums text-brand-green">
        {formatBusinessCount(item.count)}
      </p>
    </div>
  )
}

export default function AdminBusinessesByProvinceChart({ data, loading }) {
  const isMobile = useIsMobileChart()
  const provinces = data?.provinces ?? []
  const totalWithLocation = data?.total_with_location ?? 0
  const withoutLocation = data?.without_location ?? 0
  const hasData = totalWithLocation > 0

  const chartData = useMemo(
    () =>
      provinces.map((item) => ({
        ...item,
        label: isMobile ? shortenProvinceName(item.province_name, 12) : item.province_name,
      })),
    [isMobile, provinces],
  )

  const horizontalHeight = Math.max(isMobile ? 260 : 220, chartData.length * (isMobile ? 42 : 36) + 56)
  const verticalHeight = isMobile ? 300 : 340

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
          <p className="mb-3 text-xl font-semibold tabular-nums text-zinc-50 sm:text-2xl">
            {totalWithLocation.toLocaleString('es')}
            <span className={`ml-2 text-xs font-normal sm:text-sm ${adminMuted}`}>en total</span>
          </p>

          {isMobile ? (
            <div className="-mx-1 overflow-x-auto px-1 pb-1 touch-pan-x">
              <div className="min-w-[20rem]" style={{ height: verticalHeight }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartData}
                    margin={{ top: 8, right: 8, left: 0, bottom: 72 }}
                  >
                    <CartesianGrid stroke="#59802c14" vertical={false} />
                    <XAxis
                      dataKey="label"
                      interval={0}
                      angle={-42}
                      textAnchor="end"
                      height={72}
                      tick={{ fill: '#d4d4d8', fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      allowDecimals={false}
                      width={30}
                      tick={{ fill: '#a1a1aa', fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip cursor={{ fill: '#59802c12' }} content={<ProvinceTooltip />} />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={28}>
                      {chartData.map((entry, index) => (
                        <Cell
                          key={entry.province_id}
                          fill={index === 0 ? CHART_COLOR : CHART_COLOR_DIM}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : (
            <div className="w-full min-w-0" style={{ height: horizontalHeight }}>
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
                    width={124}
                    tick={{ fill: '#d4d4d8', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip cursor={{ fill: '#59802c12' }} content={<ProvinceTooltip />} />
                  <Bar dataKey="count" radius={[0, 6, 6, 0]} maxBarSize={24}>
                    {chartData.map((entry, index) => (
                      <Cell
                        key={entry.province_id}
                        fill={index === 0 ? CHART_COLOR : CHART_COLOR_DIM}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {isMobile ? (
            <p className={`mt-2 text-center text-[0.65rem] ${adminMuted}`}>
              Toca una barra para ver el nombre completo de la provincia.
            </p>
          ) : null}
        </>
      ) : null}
    </section>
  )
}

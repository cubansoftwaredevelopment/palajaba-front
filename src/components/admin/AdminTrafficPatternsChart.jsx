import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { adminCard, adminMuted, adminSubtle } from './adminStyles'

const CHART_COLOR = '#59802c'

function formatVisits(count) {
  const n = Math.round(count)
  return `${n.toLocaleString('es')} visitante${n === 1 ? '' : 's'}`
}

function PatternTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  const count = payload[0]?.value ?? 0

  return (
    <div className="rounded-xl border border-brand-green/20 bg-zinc-900 px-3 py-2 shadow-[0_8px_24px_rgba(0,0,0,0.45)]">
      <p className="text-[0.65rem] font-semibold uppercase tracking-[0.06em] text-zinc-400">
        {label}
      </p>
      <p className="mt-0.5 text-sm font-semibold tabular-nums text-brand-green">
        {formatVisits(count)}
      </p>
    </div>
  )
}

function MiniBarChart({ data, xKey = 'label' }) {
  return (
    <div className="h-48 w-full min-w-0 sm:h-52">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="#59802c14" vertical={false} />
          <XAxis
            dataKey={xKey}
            tick={{ fill: '#a1a1aa', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            interval={0}
            angle={data.length > 10 ? -40 : 0}
            textAnchor={data.length > 10 ? 'end' : 'middle'}
            height={data.length > 10 ? 48 : 28}
          />
          <YAxis
            allowDecimals={false}
            width={28}
            tick={{ fill: '#a1a1aa', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip cursor={{ fill: '#59802c12' }} content={<PatternTooltip />} />
          <Bar dataKey="count" fill={CHART_COLOR} radius={[4, 4, 0, 0]} maxBarSize={28} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export default function AdminTrafficPatternsChart({ data, loading, error }) {
  const byHour = data?.by_hour ?? []
  const byWeekday = data?.by_weekday ?? []
  const hasData = (data?.total_visits ?? 0) > 0

  return (
    <section className={adminCard}>
      <div className="mb-4">
        <h3 className="text-sm font-medium text-zinc-50">Horarios y días</h3>
        <p className={`mt-1.5 text-xs leading-relaxed ${adminSubtle}`}>
          Distribución del mes en hora de Cuba (UTC−4) y día de la semana.
        </p>
      </div>

      {loading && !data ? (
        <p className={`py-10 text-center text-sm ${adminMuted}`}>Cargando patrones…</p>
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
          Aún no hay datos de horarios este mes.
        </p>
      ) : null}

      {!loading && !error && hasData ? (
        <div className="flex flex-col gap-6">
          <div>
            <p className={`mb-2 text-xs font-medium uppercase tracking-wide ${adminMuted}`}>
              Por hora
            </p>
            <div className="-mx-1 overflow-x-auto px-1 touch-pan-x">
              <div className="min-w-[36rem]">
                <MiniBarChart data={byHour} />
              </div>
            </div>
          </div>
          <div>
            <p className={`mb-2 text-xs font-medium uppercase tracking-wide ${adminMuted}`}>
              Por día de la semana
            </p>
            <MiniBarChart data={byWeekday} />
          </div>
        </div>
      ) : null}
    </section>
  )
}

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

import { adminCard, adminMuted, adminSubtle } from '../../components/admin/adminStyles'
import { formatPrice } from '../../lib/money'

function shortenName(name, maxLength = 18) {
  if (!name || name.length <= maxLength) return name
  return `${name.slice(0, maxLength - 1)}…`
}

function plural(count, one, many) {
  return `${count.toLocaleString('es')} ${count === 1 ? one : many}`
}

function ProductTooltip({ active, payload, lines }) {
  if (!active || !payload?.length) return null
  const item = payload[0]?.payload
  if (!item) return null
  const details = lines(item)

  return (
    <div className="rounded-xl border border-brand-green/20 bg-zinc-900 px-3 py-2 shadow-[0_8px_24px_rgba(0,0,0,0.45)]">
      <p className="max-w-[16rem] text-sm font-semibold text-zinc-50">{item.name}</p>
      {item.store_name ? <p className="mt-0.5 text-[0.65rem] text-zinc-500">{item.store_name}</p> : null}
      {details.map((line) => (
        <p key={line} className="mt-0.5 text-sm font-semibold tabular-nums text-brand-green">
          {line}
        </p>
      ))}
    </div>
  )
}

function RankBars({
  title,
  subtitle,
  empty,
  headline,
  headlineHint,
  data,
  loading,
  error,
  valueKey,
  color,
  colorDim,
  lines,
}) {
  const products = data?.products ?? []
  const hasData = products.length > 0
  const chartData = useMemo(
    () => products.map((item) => ({ ...item, label: shortenName(item.name) })),
    [products],
  )
  const chartHeight = Math.max(220, chartData.length * 36 + 48)

  return (
    <section className={adminCard}>
      <div className="mb-4">
        <h3 className="text-sm font-medium text-zinc-50">{title}</h3>
        <p className={`mt-1.5 text-xs leading-relaxed ${adminSubtle}`}>
          {subtitle}
          {data?.period_label ? ` · ${data.period_label}` : ''}.
        </p>
      </div>

      {loading && !data ? (
        <p className={`py-10 text-center text-sm ${adminMuted}`}>Cargando ranking…</p>
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
          {empty}
        </p>
      ) : null}

      {!loading && !error && hasData ? (
        <>
          <p className="mb-3 text-sm tabular-nums text-zinc-300">
            {headline}
            <span className={`ml-1.5 text-xs ${adminMuted}`}>{headlineHint}</span>
          </p>
          <div className="w-full min-w-0" style={{ height: chartHeight }}>
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
                  width={128}
                  tick={{ fill: '#d4d4d8', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip cursor={{ fill: `${color}14` }} content={<ProductTooltip lines={lines} />} />
                <Bar dataKey={valueKey} radius={[0, 6, 6, 0]} maxBarSize={22}>
                  {chartData.map((entry, index) => (
                    <Cell key={entry.product_id} fill={index === 0 ? color : colorDim} />
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

function soldLines(item) {
  const lines = [plural(item.quantity, 'unidad', 'unidades')]
  if (item.amount_cup != null) lines.push(formatPrice(item.amount_cup, 'CUP'))
  return lines
}

function popularLines(item) {
  return [
    plural(item.points, 'punto', 'puntos'),
    plural(item.views, 'vista', 'vistas'),
    plural(item.jaba, 'vez en la jaba', 'veces en la jaba'),
    plural(item.purchases, 'compra', 'compras'),
  ]
}

export function AdminTopSoldProductsChart({ data, loading, error }) {
  return (
    <RankBars
      title="Top 20 más vendidos"
      subtitle="Unidades en pedidos completados"
      empty="Nadie completó una venta de productos en este periodo."
      headline={(data?.total_units ?? 0).toLocaleString('es')}
      headlineHint="unidades vendidas en el periodo"
      data={data}
      loading={loading}
      error={error}
      valueKey="quantity"
      color="#59802c"
      colorDim="#59802c99"
      lines={soldLines}
    />
  )
}

export function AdminTopPopularProductsChart({ data, loading, error }) {
  return (
    <RankBars
      title="Top 20 más populares"
      subtitle="Vistas, guardados en la jaba y compras"
      empty="Nadie miró, guardó ni compró productos en este periodo."
      headline={(data?.total_points ?? 0).toLocaleString('es')}
      headlineHint="puntos de popularidad en el periodo"
      data={data}
      loading={loading}
      error={error}
      valueKey="points"
      color="#7eb6e0"
      colorDim="#7eb6e099"
      lines={popularLines}
    />
  )
}

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

function RevenueSeriesList({ series, title }) {
  return <div className="flex flex-col gap-3">{series.map((item) => {
    const color = CURRENCY_COLORS[item.currency] ?? '#59802c'
    const gradientId = `seller-revenue-${title}-${item.currency}`.replace(/[^a-z0-9-]/gi, '-').toLowerCase()
    return <div key={`${title}-${item.currency}`} className={`${sellerSection} !shadow-none`}>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-brand-carmelita/75">{title}</p>
      <div className="mb-2 flex items-end justify-between gap-3">
        <p className="font-display text-xl font-bold text-brand-green">{formatRevenueAmount(item.total, item.currency)}</p>
        <span className="rounded-full px-2.5 py-1 text-[0.65rem] font-bold uppercase tracking-[0.06em] text-brand-white" style={{ backgroundColor: color }}>{item.currency}</span>
      </div>
      <div className="h-48 w-full min-w-0 sm:h-56"><ResponsiveContainer width="100%" height="100%">
        <AreaChart data={item.points} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs><linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity={0.28} /><stop offset="100%" stopColor={color} stopOpacity={0.02} /></linearGradient></defs>
          <CartesianGrid stroke="#59802c14" vertical={false} />
          <XAxis dataKey="label" tick={{ fill: '#7b4c38aa', fontSize: 11 }} axisLine={false} tickLine={false} interval="preserveStartEnd" minTickGap={24} />
          <YAxis tickFormatter={(value) => `${formatAxisTick(value)} ${item.currency}`} tick={{ fill: '#7b4c38aa', fontSize: 11 }} axisLine={false} tickLine={false} width={76} />
          <Tooltip cursor={{ stroke: '#59802c33', strokeWidth: 1 }} content={({ active, payload, label }) => !active || !payload?.length ? null : <div className="rounded-xl border border-brand-green/12 bg-brand-white px-3 py-2 shadow"><p className="text-[0.65rem] font-semibold uppercase text-brand-carmelita/75">{label}</p><p className="mt-0.5 font-display text-sm font-bold text-brand-green">{formatRevenueAmount(payload[0]?.value ?? 0, item.currency)}</p></div>} />
          <Area type="monotone" dataKey="value" stroke={color} strokeWidth={2.5} fill={`url(#${gradientId})`} dot={{ r: 3, fill: color, strokeWidth: 0 }} />
        </AreaChart>
      </ResponsiveContainer></div>
    </div>
  })}</div>
}

export default function SellerRevenueCharts({ loading, error, chart }) {
  const incomeSeries = chart?.series ?? []
  const deliverySeries = (chart?.delivery_series ?? []).filter((series) => Number(series.total) > 0)

  return (
    <>
    <SellerChartCard
      title="Ingresos globales"
      hint="Artículos vendidos por moneda de pago."
      loading={loading}
      error={error}
      empty={!incomeSeries.length}
      emptyMessage="Aún no hay ingresos en este periodo."
    >
      <RevenueSeriesList series={chart?.series ?? []} title="Artículos" />
    </SellerChartCard>
    <SellerChartCard title="Mensajería" hint="Importe diario del envío, agrupado por moneda. Los pedidos sin envío suman 0." loading={loading} error={error} empty={!deliverySeries.length} emptyMessage="No hay importes de mensajería en este periodo.">
      <div className="mb-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-carmelita/75">Total del periodo</p>
        <p className="mt-1 font-display text-2xl font-bold text-brand-green">
          {deliverySeries.map((item) => formatRevenueAmount(item.total, item.currency)).join(' · ')}
        </p>
      </div>
      <RevenueSeriesList series={deliverySeries} title="Mensajería" />
    </SellerChartCard>
    </>
  )
}

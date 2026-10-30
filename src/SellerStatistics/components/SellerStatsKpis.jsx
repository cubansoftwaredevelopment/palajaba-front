import { sellerHint, sellerStatCard } from '../../components/seller/sellerStyles'
import { formatCount, formatPercent, formatRevenueAmount } from '../utils'

function KpiCard({ label, value, hint, loading }) {
  return (
    <div className={`${sellerStatCard} text-left`}>
      <p className="text-[0.65rem] font-semibold uppercase tracking-[0.08em] text-brand-carmelita/75">
        {label}
      </p>
      <p className="mt-1 break-words font-display text-lg font-bold tabular-nums text-brand-green sm:text-xl">
        {loading ? '…' : value}
      </p>
      {hint ? <p className={`mt-1 ${sellerHint}`}>{hint}</p> : null}
    </div>
  )
}

export default function SellerStatsKpis({ kpis, loading = false }) {
  const revenueItems = kpis?.revenue ?? []
  const revenueHint =
    revenueItems.length > 0
      ? revenueItems.map((item) => formatRevenueAmount(item.total, item.currency)).join(' · ')
      : 'Sin cobros en el periodo'
  const revenueValue =
    revenueItems.length === 0
      ? '0'
      : revenueItems.length === 1
        ? formatRevenueAmount(revenueItems[0].total, revenueItems[0].currency)
        : revenueItems.map((item) => formatRevenueAmount(item.total, item.currency)).join(' · ')

  return (
    <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-3">
      <KpiCard loading={loading} label="Visitantes" value={formatCount(kpis?.visitors)} hint="Visitas al perfil" />
      <KpiCard loading={loading} label="Vistas de producto" value={formatCount(kpis?.product_views)} />
      <KpiCard loading={loading} label="Pedidos entregados" value={formatCount(kpis?.delivered_orders)} />
      <KpiCard
        loading={loading}
        label="Ingresos globales"
        value={revenueValue}
        hint={revenueItems.length > 1 ? 'Total por moneda' : revenueHint}
      />
      <KpiCard
        loading={loading}
        label="Conversión sitio"
        value={formatPercent(kpis?.site_conversion_rate)}
        hint={`${formatCount(kpis?.site_jabas)} jabas / ${formatCount(kpis?.visitors)} visitas`}
      />
    </div>
  )
}

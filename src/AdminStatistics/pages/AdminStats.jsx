import AdminBusinessesByProvinceChart from '../componentes/AdminBusinessesByProvinceChart'
import AdminDeliveryMapSection from '../componentes/AdminDeliveryMapSection'
import AdminDevicesSection from '../componentes/AdminDevicesSection'
import AdminOrdersChart from '../componentes/AdminOrdersChart'
import AdminOrdersLocationChart from '../componentes/AdminOrdersLocationChart'
import AdminRevenueChart from '../componentes/AdminRevenueChart'
import AdminSalesChart from '../componentes/AdminSalesChart'
import AdminStatsPullToast from '../componentes/AdminStatsPullToast'
import AdminStatsRangeControls from '../componentes/AdminStatsRangeControls'
import AdminTopBusinessesChart from '../componentes/AdminTopBusinessesChart'
import {
  AdminTopPopularProductsChart,
  AdminTopSoldProductsChart,
} from '../componentes/AdminTopProductsCharts'
import AdminTrafficChart from '../componentes/AdminTrafficChart'
import AdminTrafficLocationChart from '../componentes/AdminTrafficLocationChart'
import AdminTrafficPatternsChart from '../componentes/AdminTrafficPatternsChart'
import {
  adminAlertError,
  adminCard,
  adminMuted,
  adminSubtle,
} from '../../components/admin/adminStyles'
import LoadingState from '../../components/ui/LoadingState'
import { formatPrice } from '../../lib/money'
import { AdminStatisticsProvider, useAdminStatistics } from '../context/AdminStatisticsContext'

const METRIC_ACCENTS = {
  payments: 'border-t-brand-green',
  traffic: 'border-t-sky-300/80',
  stores: 'border-t-emerald-400/70',
  pending: 'border-t-brand-yellow',
  products: 'border-t-sky-400/70',
  orders: 'border-t-violet-400/70',
}

function MetricCard({ label, hint, value, subvalue, comingSoon, accent = 'payments' }) {
  return (
    <article className={`${adminCard} border-t-2 ${METRIC_ACCENTS[accent] ?? METRIC_ACCENTS.payments}`}>
      <p className={`text-xs font-medium uppercase tracking-wide ${adminMuted}`}>{label}</p>
      <p
        className={`mt-3 text-3xl font-semibold tabular-nums ${
          comingSoon ? 'text-zinc-600' : 'text-zinc-50'
        }`}
      >
        {value}
      </p>
      {subvalue && <p className="mt-1 text-xs text-brand-green/80">{subvalue}</p>}
      <p className={`mt-2 text-xs leading-relaxed ${adminSubtle}`}>{hint}</p>
      {comingSoon && (
        <span className="mt-4 inline-flex rounded-md border border-brand-yellow/30 bg-brand-yellow/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-brand-yellow">
          Próximamente
        </span>
      )}
    </article>
  )
}

function AdminStatsView() {
  const {
    granularity,
    setGranularity,
    range,
    setRange,
    stats,
    provinceStats,
    revenueChart,
    trafficChart,
    trafficLocations,
    trafficPatterns,
    ordersChart,
    salesChart,
    topBusinesses,
    topSoldProducts,
    topPopularProducts,
    ordersLocations,
    deliveryMap,
    deviceStats,
    loading,
    chartsLoading,
    error,
    revenueError,
    trafficError,
    locationsError,
    patternsError,
    ordersError,
    salesError,
    topBusinessesError,
    topSoldError,
    topPopularError,
    ordersLocationsError,
    deliveryMapError,
    devicesError,
    pulling,
    multiDay,
  } = useAdminStatistics()

  return (
    <main className="mx-auto max-w-3xl px-4 pt-6 sm:px-6">
      {error && (
        <p className={`mb-4 ${adminAlertError}`} role="alert">
          {error}
        </p>
      )}

      {loading && !stats ? (
        <LoadingState variant="admin" message="Cargando estadísticas…" />
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            <MetricCard
              accent="payments"
              label="Pagos del mes"
              hint="Monto total registrado al aprobar o renovar tiendas este mes"
              value={formatPrice(stats?.payments_total_cup ?? 0, 'CUP')}
              subvalue={
                stats
                  ? `${stats.payments_count} pago${stats.payments_count === 1 ? '' : 's'}`
                  : undefined
              }
            />
            <MetricCard
              accent="traffic"
              label="Tráfico marketplace"
              hint="Visitantes únicos (sesión/día) en /comprar este mes"
              value={String(stats?.marketplace_visits ?? 0)}
            />
            <MetricCard
              accent="stores"
              label="Tiendas activas"
              hint="Suscripción vigente hoy"
              value={String(stats?.active_stores ?? 0)}
            />
            <MetricCard
              accent="pending"
              label="Solicitudes pendientes"
              hint="Por revisar y aprobar"
              value={String(stats?.pending_registrations ?? 0)}
            />
            <MetricCard
              accent="products"
              label="Productos publicados"
              hint="Total en catálogos de todas las tiendas"
              value={String(stats?.published_products ?? 0)}
            />
            <MetricCard
              accent="orders"
              label="Pedidos realizados"
              hint="Compras registradas en la plataforma"
              value={String(stats?.orders_total ?? 0)}
            />
          </div>

          <div className="mt-4">
            <AdminStatsRangeControls
              granularity={granularity}
              onGranularityChange={setGranularity}
              range={range}
              onRangeChange={setRange}
            />
          </div>

          <div className="mt-4">
            <AdminOrdersChart chart={ordersChart} loading={chartsLoading} error={ordersError} />
          </div>

          <div className="mt-4">
            <AdminSalesChart chart={salesChart} loading={chartsLoading} error={salesError} />
          </div>

          <div className="mt-4">
            <AdminDevicesSection
              data={deviceStats}
              loading={chartsLoading}
              error={devicesError}
              multiDay={multiDay}
            />
          </div>

          <div className="mt-4">
            <AdminTopBusinessesChart
              data={topBusinesses}
              loading={chartsLoading}
              error={topBusinessesError}
            />
          </div>

          <div className="mt-4">
            <AdminTopSoldProductsChart
              data={topSoldProducts}
              loading={chartsLoading}
              error={topSoldError}
            />
          </div>

          <div className="mt-4">
            <AdminTopPopularProductsChart
              data={topPopularProducts}
              loading={chartsLoading}
              error={topPopularError}
            />
          </div>

          <div className="mt-4">
            <AdminOrdersLocationChart
              data={ordersLocations}
              loading={chartsLoading}
              error={ordersLocationsError}
            />
          </div>

          <div className="mt-4">
            <AdminDeliveryMapSection
              data={deliveryMap}
              loading={chartsLoading}
              error={deliveryMapError}
            />
          </div>

          <div className="mt-4">
            <AdminTrafficChart chart={trafficChart} loading={chartsLoading} error={trafficError} />
          </div>

          <div className="mt-4">
            <AdminTrafficLocationChart
              data={trafficLocations}
              loading={chartsLoading}
              error={locationsError}
            />
          </div>

          <div className="mt-4">
            <AdminTrafficPatternsChart
              data={trafficPatterns}
              loading={chartsLoading}
              error={patternsError}
            />
          </div>

          <div className="mt-4">
            <AdminRevenueChart chart={revenueChart} loading={chartsLoading} error={revenueError} />
          </div>

          <div className="mt-4">
            <AdminBusinessesByProvinceChart data={provinceStats} loading={loading} />
          </div>
        </>
      )}
      {pulling ? <AdminStatsPullToast /> : null}
      </main>
    )
}

export default function AdminStats() {
  return (
    <AdminStatisticsProvider>
      <AdminStatsView />
    </AdminStatisticsProvider>
  )
}

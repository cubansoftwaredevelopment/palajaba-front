import UpgradeToPremiumButton from './UpgradeToPremiumButton'
import { sellerHint, sellerSection, sellerStatCard } from './sellerStyles'

const MOCK_STATS = {
  profile_views: 342,
  confirmed_orders: 18,
  active_products: 24,
}

const MOCK_REVENUE_BARS = [
  { label: 'L', value: 42 },
  { label: 'M', value: 68 },
  { label: 'X', value: 55 },
  { label: 'J', value: 82 },
  { label: 'V', value: 61 },
  { label: 'S', value: 74 },
  { label: 'D', value: 48 },
]

const MOCK_TOP_PRODUCTS = [
  { name: 'Ventilador recargable', metric: '48 visitas' },
  { name: 'Arroz 5 lb', metric: '12 vendidos' },
  { name: 'Crema facial', metric: '31 visitas' },
]

function MockStatGrid() {
  return (
    <div className="grid grid-cols-3 gap-2">
      {[
        { label: 'Visitas', value: MOCK_STATS.profile_views },
        { label: 'Pedidos', value: MOCK_STATS.confirmed_orders },
        { label: 'Productos', value: MOCK_STATS.active_products },
      ].map((stat) => (
        <div key={stat.label} className={sellerStatCard}>
          <p className="font-display text-xl font-bold tabular-nums text-brand-green">{stat.value}</p>
          <p className="mt-0.5 text-[0.65rem] font-medium text-brand-carmelita/80">{stat.label}</p>
        </div>
      ))}
    </div>
  )
}

function MockRevenueChart() {
  return (
    <div className={sellerSection}>
      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-brand-carmelita/75">
            Recaudado
          </p>
          <p className="font-display text-xl font-bold text-brand-green">1.240,00 USD</p>
        </div>
        <span className="rounded-full bg-brand-green/10 px-2.5 py-1 text-[0.65rem] font-semibold text-brand-green">
          CUP
        </span>
      </div>
      <div className="flex h-36 items-end gap-1.5 sm:h-40">
        {MOCK_REVENUE_BARS.map((bar) => (
          <div key={bar.label} className="flex min-w-0 flex-1 flex-col items-center gap-1">
            <div
              className="w-full rounded-t-lg bg-gradient-to-t from-brand-green/25 to-brand-green/70"
              style={{ height: `${bar.value}%` }}
            />
            <span className="text-[0.6rem] font-medium text-brand-carmelita/70">{bar.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function MockTopProducts() {
  return (
    <div className={sellerSection}>
      <h4 className="font-display text-base font-bold text-brand-green">Productos destacados</h4>
      <ol className="mt-3 space-y-2">
        {MOCK_TOP_PRODUCTS.map((item, index) => (
          <li
            key={item.name}
            className="flex items-center gap-3 rounded-xl border border-brand-green/10 bg-brand-white/80 px-2.5 py-2"
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-green/10 font-display text-xs font-bold text-brand-green">
              {index + 1}
            </span>
            <div className="h-11 w-11 shrink-0 rounded-lg bg-brand-yellow/20" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-brand-green">{item.name}</p>
              <p className="text-[0.65rem] font-medium text-brand-carmelita/80">{item.metric}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  )
}

export default function SellerStatsPremiumPreview({ storeName = '' }) {
  return (
    <section
      className="relative overflow-hidden rounded-3xl border border-brand-green/12 shadow-[0_8px_32px_rgba(89,128,44,0.08)]"
      aria-labelledby="premium-stats-preview-title"
    >
      <div className="relative h-[min(26rem,68dvh)] overflow-hidden sm:h-[min(28rem,72dvh)]">
        <div
          className="pointer-events-none absolute inset-0 -bottom-8 select-none blur-[6px] sm:blur-[7px]"
          aria-hidden="true"
        >
          <div className="space-y-4 px-1 pt-1">
            <div className="flex items-center justify-between gap-2 rounded-2xl border border-brand-green/10 bg-brand-white px-3 py-2.5">
              <span className="text-sm font-semibold text-brand-green">Marzo 2026</span>
              <div className="flex gap-1">
                <span className="h-8 w-8 rounded-full bg-brand-green/10" />
                <span className="h-8 w-8 rounded-full bg-brand-green/10" />
              </div>
            </div>

            <MockTopProducts />
            <MockStatGrid />
            <MockRevenueChart />
          </div>
        </div>

        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-b from-brand-white/55 via-brand-white/72 to-brand-white/96"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-brand-white via-brand-white/90 to-transparent"
          aria-hidden="true"
        />

        <div className="absolute inset-0 flex items-start justify-center px-4 pb-6 pt-8 sm:items-center sm:py-8">
          <div className="w-full max-w-sm rounded-3xl border border-brand-green/18 bg-brand-white/96 p-5 text-center shadow-[0_20px_56px_rgba(89,128,44,0.18)] backdrop-blur-md sm:p-6">
            <span className="inline-flex rounded-full bg-brand-yellow/25 px-3 py-1 text-[0.65rem] font-bold uppercase tracking-[0.08em] text-brand-green">
              Plan Premium
            </span>
            <h3
              id="premium-stats-preview-title"
              className="mt-3 font-display text-xl font-bold leading-snug text-brand-green sm:text-2xl"
            >
              Tus estadísticas te están esperando
            </h3>
            <p className={`mt-2 ${sellerHint}`}>
              Visitas, ingresos, pedidos y productos más vendidos. Pásate a Premium para verlo en
              vivo.
            </p>
            <ul className="mt-4 space-y-1.5 text-left text-sm text-brand-carmelita/90">
              <li className="flex gap-2">
                <span className="text-brand-green" aria-hidden="true">
                  ✓
                </span>
                <span>Gráficos de ingresos y ventas por día o mes</span>
              </li>
              <li className="flex gap-2">
                <span className="text-brand-green" aria-hidden="true">
                  ✓
                </span>
                <span>Ranking de productos con más interés</span>
              </li>
              <li className="flex gap-2">
                <span className="text-brand-green" aria-hidden="true">
                  ✓
                </span>
                <span>Más visibilidad en el marketplace</span>
              </li>
            </ul>
            <div className="mt-5">
              <UpgradeToPremiumButton className="w-full" storeName={storeName} />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

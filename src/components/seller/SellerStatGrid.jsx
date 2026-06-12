import { sellerStatCard } from './sellerStyles'

const STAT_ITEMS = [
  { id: 'profile_views', label: 'Visitas', key: 'profile_views' },
  { id: 'confirmed_orders', label: 'Pedidos', key: 'confirmed_orders' },
  { id: 'active_products', label: 'Productos', key: 'active_products' },
]

function formatStatValue(value, loading) {
  if (loading) return '…'
  if (value == null) return '0'
  return String(value)
}

export default function SellerStatGrid({ stats, loading = false }) {
  return (
    <div className="grid grid-cols-3 gap-2 lg:gap-4">
      {STAT_ITEMS.map((stat) => (
        <div key={stat.id} className={sellerStatCard}>
          <p className="font-display text-xl font-bold tabular-nums text-brand-green">
            {formatStatValue(stats?.[stat.key], loading)}
          </p>
          <p className="mt-0.5 text-[0.65rem] font-medium text-brand-carmelita/80">{stat.label}</p>
        </div>
      ))}
    </div>
  )
}

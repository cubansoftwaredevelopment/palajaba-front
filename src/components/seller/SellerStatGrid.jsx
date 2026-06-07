import { sellerStatCard } from './sellerStyles'

const STATS = [
  { id: 'visits', label: 'Visitas', value: '0' },
  { id: 'orders', label: 'Pedidos', value: '0' },
  { id: 'products', label: 'Productos', value: '0' },
]

export default function SellerStatGrid() {
  return (
    <div className="grid grid-cols-3 gap-2 lg:gap-4">
      {STATS.map((stat) => (
        <div key={stat.id} className={sellerStatCard}>
          <p className="font-display text-xl font-bold tabular-nums text-brand-green">{stat.value}</p>
          <p className="mt-0.5 text-[0.65rem] font-medium text-brand-carmelita/80">{stat.label}</p>
        </div>
      ))}
    </div>
  )
}

import { sellerStatCard } from './sellerStyles'

function SummaryCard({ label, value, tone = 'default' }) {
  const valueClass =
    tone === 'pending'
      ? 'text-brand-carmelita'
      : tone === 'completed'
        ? 'text-brand-green'
        : 'text-brand-green'

  const cardClass =
    tone === 'pending'
      ? `${sellerStatCard} border-brand-yellow/30 bg-brand-yellow/[0.08]`
      : tone === 'completed'
        ? `${sellerStatCard} border-brand-green/15 bg-brand-green/[0.04]`
        : sellerStatCard

  return (
    <div className={cardClass}>
      <p className={`font-display text-2xl font-bold tabular-nums ${valueClass}`}>{value}</p>
      <p className="mt-0.5 text-[0.65rem] font-semibold uppercase tracking-[0.06em] text-brand-carmelita/80">
        {label}
      </p>
    </div>
  )
}

export default function SellerOrdersSummary({ pendingCount, completedCount }) {
  return (
    <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
      <SummaryCard label="Por confirmar" value={pendingCount} tone="pending" />
      <SummaryCard label="Compras realizadas" value={completedCount} tone="completed" />
    </div>
  )
}

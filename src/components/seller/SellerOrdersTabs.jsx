import { sellerChoice, sellerFocusRing } from './sellerStyles'

function TabButton({ active, onClick, label, count, tone }) {
  const badgeClass =
    tone === 'pending'
      ? active
        ? 'bg-brand-yellow/30 text-brand-carmelita'
        : 'bg-brand-yellow/15 text-brand-carmelita/80'
      : active
        ? 'bg-brand-white/20 text-brand-white'
        : 'bg-brand-green/10 text-brand-green'

  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`${sellerChoice(active)} flex min-h-11 items-center justify-center gap-2 px-2 ${sellerFocusRing}`}
    >
      <span className="truncate">{label}</span>
      <span
        className={`shrink-0 rounded-full px-2 py-0.5 text-[0.62rem] font-bold tabular-nums ${badgeClass}`}
      >
        {count}
      </span>
    </button>
  )
}

export default function SellerOrdersTabs({ activeTab, onTabChange, pendingCount, completedCount }) {
  return (
    <div
      className="grid grid-cols-2 gap-2 rounded-2xl border border-brand-green/12 bg-brand-white p-1.5 shadow-[0_2px_10px_rgba(89,128,44,0.05)]"
      role="tablist"
      aria-label="Tipo de pedidos"
    >
      <TabButton
        active={activeTab === 'pending'}
        onClick={() => onTabChange('pending')}
        label="Por confirmar"
        count={pendingCount}
        tone="pending"
      />
      <TabButton
        active={activeTab === 'completed'}
        onClick={() => onTabChange('completed')}
        label="Realizadas"
        count={completedCount}
        tone="completed"
      />
    </div>
  )
}

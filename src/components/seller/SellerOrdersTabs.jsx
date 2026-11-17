import { motion, useReducedMotion } from 'framer-motion'
import { sellerFocusRing } from './sellerStyles'

const PILL_SPRING = { type: 'spring', stiffness: 420, damping: 34 }

const TABS = [
  { id: 'pending', label: 'Por procesar' },
  { id: 'completed', label: 'Realizadas' },
]

function badgeClass(tabId, selected) {
  if (tabId === 'pending') {
    return selected
      ? 'bg-brand-yellow/30 text-brand-carmelita'
      : 'bg-brand-yellow/15 text-brand-carmelita/80'
  }
  return selected ? 'bg-brand-white/20 text-brand-white' : 'bg-brand-green/10 text-brand-green'
}

export default function SellerOrdersTabs({ activeTab, onTabChange, pendingCount, completedCount }) {
  const reduced = useReducedMotion()
  const counts = { pending: pendingCount, completed: completedCount }
  const index = Math.max(0, TABS.findIndex((tab) => tab.id === activeTab))

  return (
    <div
      className="relative flex rounded-full border border-brand-green/12 bg-brand-white p-1 shadow-[0_2px_10px_rgba(89,128,44,0.05)]"
      role="tablist"
      aria-label="Tipo de pedidos"
    >
      <motion.span
        aria-hidden
        className="absolute top-1 bottom-1 left-1 rounded-full bg-brand-green shadow-sm"
        style={{ width: 'calc(50% - 4px)' }}
        initial={false}
        animate={{ x: `${index * 100}%` }}
        transition={reduced ? { duration: 0 } : PILL_SPRING}
      />
      {TABS.map((tab) => {
        const selected = activeTab === tab.id
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onTabChange(tab.id)}
            className={`relative z-10 flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full px-2 text-sm font-semibold transition-colors ${sellerFocusRing} ${
              selected ? 'text-brand-white' : 'text-brand-green'
            }`}
          >
            <span className="truncate">{tab.label}</span>
            <span className={`shrink-0 rounded-full px-2 py-0.5 text-[0.62rem] font-bold tabular-nums ${badgeClass(tab.id, selected)}`}>
              {counts[tab.id]}
            </span>
          </button>
        )
      })}
    </div>
  )
}

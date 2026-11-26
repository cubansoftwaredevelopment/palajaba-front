import { motion, useReducedMotion } from 'framer-motion'
import { BILLING_LABELS } from '../../admin/utils/admin.js'
import { BILLING_PERIOD_ORDER } from '../utils/constants.js'

const PILL_SPRING = { type: 'spring', stiffness: 420, damping: 34 }

export default function BillingPeriodTabs({ value, onChange, className = '' }) {
  const reduced = useReducedMotion()

  return (
    <div
      className={`relative flex rounded-full border border-brand-green/15 bg-brand-white p-1 ${className}`}
      role="radiogroup"
      aria-label="Periodo de facturación"
    >
      {BILLING_PERIOD_ORDER.map((period) => {
        const selected = value === period
        return (
          <button
            key={period}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(period)}
            className={`relative flex-1 rounded-full px-2 py-2 text-xs font-semibold transition-colors sm:px-3 sm:text-sm ${
              selected ? 'text-brand-white' : 'text-brand-green sm:hover:bg-brand-yellow/15'
            }`}
          >
            {selected ? (
              <motion.span
                layoutId="billing-period-pill"
                aria-hidden
                className="absolute inset-0 rounded-full bg-brand-green shadow-sm"
                initial={false}
                transition={reduced ? { duration: 0 } : PILL_SPRING}
              />
            ) : null}
            <span className="relative z-10">{BILLING_LABELS[period]}</span>
          </button>
        )
      })}
    </div>
  )
}

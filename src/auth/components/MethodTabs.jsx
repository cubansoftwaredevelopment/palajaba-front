import { motion, useReducedMotion } from 'framer-motion'

const PILL_SPRING = { type: 'spring', stiffness: 420, damping: 34 }

export default function MethodTabs({ options, value, onChange, ariaLabel }) {
  const reduced = useReducedMotion()
  const count = Math.max(options.length, 1)
  const index = Math.max(0, options.findIndex((option) => option.id === value))

  return (
    <div
      className="relative mb-4 flex rounded-full border border-brand-green/15 bg-brand-white p-1"
      role="tablist"
      aria-label={ariaLabel}
    >
      <motion.span
        aria-hidden
        className="absolute top-1 bottom-1 left-1 rounded-full bg-brand-green shadow-sm"
        style={{ width: `calc(${100 / count}% - 4px)` }}
        initial={false}
        animate={{ x: `${index * 100}%` }}
        transition={reduced ? { duration: 0 } : PILL_SPRING}
      />
      {options.map((option) => {
        const selected = value === option.id
        return (
          <button
            key={option.id}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(option.id)}
            className={`relative z-10 flex-1 rounded-full px-3 py-2 text-sm font-semibold transition-colors ${
              selected ? 'text-brand-white' : 'text-brand-green sm:hover:bg-brand-yellow/15'
            }`}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}

import { useId, useState } from 'react'

function InfoIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path
        fillRule="evenodd"
        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
        clipRule="evenodd"
      />
    </svg>
  )
}

export default function InfoDisclosure({ label, children, className = '' }) {
  const [open, setOpen] = useState(false)
  const panelId = useId()

  return (
    <div className={className}>
      <button
        type="button"
        className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-full text-brand-carmelita/80 transition-colors touch-manipulation active:bg-brand-yellow/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green/25 lg:hover:bg-brand-green/[0.06] lg:hover:text-brand-green"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={label}
        onClick={() => setOpen((current) => !current)}
      >
        <InfoIcon />
      </button>
      {open ? (
        <p
          id={panelId}
          className="mt-2 rounded-xl border border-brand-green/10 bg-brand-green/[0.04] px-3 py-2.5 text-xs leading-relaxed text-brand-carmelita/90 sm:text-sm"
          role="note"
        >
          {children}
        </p>
      ) : null}
    </div>
  )
}

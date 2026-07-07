import { useMemo } from 'react'

import { getTrendPresentation } from '../../lib/sellerStatsTrend'

function TrendArrow({ direction }) {
  if (direction === 'up') {
    return (
      <svg
        aria-hidden="true"
        className="h-3.5 w-3.5 shrink-0"
        viewBox="0 0 16 16"
        fill="currentColor"
      >
        <path d="M8 3.5 3.5 9h3v3.5h3V9h3L8 3.5z" />
      </svg>
    )
  }

  if (direction === 'down') {
    return (
      <svg
        aria-hidden="true"
        className="h-3.5 w-3.5 shrink-0"
        viewBox="0 0 16 16"
        fill="currentColor"
      >
        <path d="M8 12.5 12.5 7h-3V3.5H7V7h-3l5 5.5z" />
      </svg>
    )
  }

  return (
    <svg
      aria-hidden="true"
      className="h-3.5 w-3.5 shrink-0"
      viewBox="0 0 16 16"
      fill="currentColor"
    >
      <path d="M3.5 8h9v1.5h-9V8z" />
    </svg>
  )
}

export default function TrendIndicator({ comparison, className = '' }) {
  const presentation = useMemo(
    () => getTrendPresentation(comparison),
    [comparison],
  )

  if (!comparison) {
    return null
  }

  return (
    <div className={`flex flex-wrap items-center gap-1.5 ${className}`.trim()}>
      <span
        className={`inline-flex items-center gap-1 text-sm font-semibold ${presentation.textClass}`}
        aria-label={presentation.ariaLabel}
      >
        {presentation.icon ? <TrendArrow direction={presentation.icon} /> : null}
        <span>{presentation.showPercent ? presentation.text : presentation.text}</span>
      </span>
      {presentation.showPercent && presentation.label ? (
        <span className="text-xs text-brand-carmelita/70">{presentation.label}</span>
      ) : null}
    </div>
  )
}

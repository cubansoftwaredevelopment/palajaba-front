import { useMemo } from 'react'

import { formatChangePercent } from '../../lib/sellerStatsTrend'
import { adminMuted } from './adminStyles'

function TrendArrow({ direction }) {
  if (direction === 'up') {
    return (
      <svg aria-hidden="true" className="h-3.5 w-3.5 shrink-0" viewBox="0 0 16 16" fill="currentColor">
        <path d="M8 3.5 3.5 9h3v3.5h3V9h3L8 3.5z" />
      </svg>
    )
  }

  if (direction === 'down') {
    return (
      <svg aria-hidden="true" className="h-3.5 w-3.5 shrink-0" viewBox="0 0 16 16" fill="currentColor">
        <path d="M8 12.5 12.5 7h-3V3.5H7V7h-3l5 5.5z" />
      </svg>
    )
  }

  return (
    <svg aria-hidden="true" className="h-3.5 w-3.5 shrink-0" viewBox="0 0 16 16" fill="currentColor">
      <path d="M3.5 8h9v1.5h-9V8z" />
    </svg>
  )
}

function getAdminTrendPresentation(comparison) {
  if (!comparison?.comparison_available) {
    return {
      text: 'Sin datos previos',
      textClass: adminMuted,
      icon: null,
      ariaLabel: 'Comparativa no disponible',
      showPercent: false,
      label: null,
    }
  }

  const formatted = formatChangePercent(comparison.change_percent)
  const label = comparison.comparison_label || 'vs periodo anterior'

  if (comparison.direction === 'up') {
    return {
      text: formatted,
      textClass: 'text-emerald-300',
      icon: 'up',
      ariaLabel: `Crecimiento de ${formatted} ${label}`,
      showPercent: true,
      label,
    }
  }

  if (comparison.direction === 'down') {
    return {
      text: formatted,
      textClass: 'text-orange-300',
      icon: 'down',
      ariaLabel: `Disminución de ${formatted} ${label}`,
      showPercent: true,
      label,
    }
  }

  return {
    text: formatted ?? '0,0%',
    textClass: 'text-zinc-300',
    icon: 'flat',
    ariaLabel: `Sin cambio ${label}`,
    showPercent: true,
    label,
  }
}

export default function AdminTrendIndicator({ comparison, className = '' }) {
  const presentation = useMemo(
    () => getAdminTrendPresentation(comparison),
    [comparison],
  )

  if (!comparison) return null

  return (
    <div className={`flex flex-wrap items-center gap-1.5 ${className}`.trim()}>
      <span
        className={`inline-flex items-center gap-1 text-sm font-semibold tabular-nums ${presentation.textClass}`}
        aria-label={presentation.ariaLabel}
      >
        {presentation.icon ? <TrendArrow direction={presentation.icon} /> : null}
        <span>{presentation.text}</span>
      </span>
      {presentation.showPercent && presentation.label ? (
        <span className={`text-xs ${adminMuted}`}>{presentation.label}</span>
      ) : null}
    </div>
  )
}

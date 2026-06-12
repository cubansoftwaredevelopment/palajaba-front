import { sellerFocusRing } from './sellerStyles'

function formatMonthLabel(year, month) {
  const date = new Date(year, month - 1, 1)
  return new Intl.DateTimeFormat('es', { month: 'long', year: 'numeric' }).format(date)
}

function compareMonth(year, month, otherYear, otherMonth) {
  if (year !== otherYear) return year - otherYear
  return month - otherMonth
}

function shiftMonth(year, month, delta) {
  const date = new Date(year, month - 1 + delta, 1)
  return { year: date.getFullYear(), month: date.getMonth() + 1 }
}

export default function SellerStatsMonthNav({ period, year, month, onChange }) {
  if (!period) return null

  const atEarliest =
    compareMonth(year, month, period.earliest_year, period.earliest_month) <= 0
  const atCurrent = compareMonth(year, month, period.current_year, period.current_month) >= 0

  function goPrevious() {
    if (atEarliest) return
    onChange(shiftMonth(year, month, -1))
  }

  function goNext() {
    if (atCurrent) return
    onChange(shiftMonth(year, month, 1))
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-brand-green/12 bg-brand-white px-3 py-2.5 shadow-[0_2px_12px_rgba(89,128,44,0.06)] sm:px-4">
      <button
        type="button"
        onClick={goPrevious}
        disabled={atEarliest}
        className={`inline-flex h-9 w-9 items-center justify-center rounded-full text-brand-green transition-colors touch-manipulation disabled:cursor-not-allowed disabled:opacity-35 active:bg-brand-yellow/15 ${sellerFocusRing}`}
        aria-label="Mes anterior"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" aria-hidden>
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </button>

      <p className="min-w-0 flex-1 text-center font-display text-base font-bold capitalize text-brand-green sm:text-lg">
        {formatMonthLabel(year, month)}
      </p>

      <button
        type="button"
        onClick={goNext}
        disabled={atCurrent}
        className={`inline-flex h-9 w-9 items-center justify-center rounded-full text-brand-green transition-colors touch-manipulation disabled:cursor-not-allowed disabled:opacity-35 active:bg-brand-yellow/15 ${sellerFocusRing}`}
        aria-label="Mes siguiente"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" aria-hidden>
          <path d="M9 18l6-6-6-6" />
        </svg>
      </button>
    </div>
  )
}

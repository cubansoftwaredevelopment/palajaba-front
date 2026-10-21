import { useEffect, useState } from 'react'
import { DayPicker } from 'react-day-picker'
import { es } from 'date-fns/locale'
import { sellerBtnPrimary, sellerChip, sellerFocusRing, sellerHint, sellerSection } from '../../components/seller/sellerStyles'
import { DATE_RANGE_PERIODS, formatRangeLabel, rangeForPeriod, startOfToday } from '../utils'

const pickerClassNames = {
  root: 'w-full',
  months: 'flex flex-col',
  month: 'w-full',
  month_caption: 'mb-2 flex items-center justify-center',
  caption_label: 'text-sm font-semibold text-brand-green',
  nav: 'flex items-center gap-1',
  button_previous:
    'inline-flex h-7 w-7 items-center justify-center rounded-md text-brand-carmelita/80 transition-colors hover:bg-brand-green/8 hover:text-brand-green',
  button_next:
    'inline-flex h-7 w-7 items-center justify-center rounded-md text-brand-carmelita/80 transition-colors hover:bg-brand-green/8 hover:text-brand-green',
  month_grid: 'w-full border-collapse',
  weekdays: 'text-[0.65rem] font-medium uppercase text-brand-carmelita/70',
  weekday: 'pb-1 text-center',
  week: 'text-xs',
  day: 'p-0 text-center',
  day_button:
    'mx-auto flex h-8 w-8 items-center justify-center rounded-md font-medium text-brand-green transition-colors hover:bg-brand-yellow/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-green/30',
  selected: '[&>button]:bg-brand-green [&>button]:text-brand-white [&>button]:hover:bg-brand-green',
  range_start: '[&>button]:bg-brand-green [&>button]:text-brand-white',
  range_end: '[&>button]:bg-brand-green [&>button]:text-brand-white',
  range_middle: '[&>button]:bg-brand-green/15 [&>button]:text-brand-green',
  today: '[&>button]:ring-1 [&>button]:ring-brand-green/40',
  outside: 'text-brand-carmelita/40',
  disabled: '[&>button]:cursor-not-allowed [&>button]:text-brand-carmelita/30 [&>button]:hover:bg-transparent',
}

export default function SellerDateRangeControls({ period, range, onPeriodChange, onRangeChange }) {
  const [draft, setDraft] = useState(range)
  const customOpen = period === 'custom'

  useEffect(() => {
    setDraft(range)
  }, [range])

  function handlePeriod(nextPeriod) {
    if (nextPeriod === 'custom') {
      onPeriodChange('custom', range ?? rangeForPeriod('monthly'))
      return
    }
    onPeriodChange(nextPeriod, rangeForPeriod(nextPeriod))
  }

  function applyCustom() {
    if (!draft?.from || !draft?.to) return
    onRangeChange({ from: draft.from, to: draft.to })
  }

  return (
    <div className={sellerSection}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className={sellerHint}>Periodo</p>
        <p className="text-xs font-semibold text-brand-green">{formatRangeLabel(range)}</p>
      </div>
      <div className="mt-2.5 flex flex-wrap gap-1.5">
        {DATE_RANGE_PERIODS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`${sellerChip(period === item.id)} ${sellerFocusRing}`}
            onClick={() => handlePeriod(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {customOpen ? (
        <div className="mt-3 rounded-xl border border-brand-green/12 bg-brand-green/[0.03] p-2">
          <DayPicker
            mode="range"
            selected={draft ?? undefined}
            onSelect={setDraft}
            locale={es}
            disabled={{ after: startOfToday() }}
            defaultMonth={draft?.from ?? range?.from ?? startOfToday()}
            classNames={pickerClassNames}
          />
          <p className={`mt-1 px-1 ${sellerHint}`}>Incluye ambos días, hasta hoy.</p>
          <button
            type="button"
            onClick={applyCustom}
            disabled={!draft?.from || !draft?.to}
            className={`${sellerBtnPrimary} mt-2`}
          >
            Aplicar fechas
          </button>
        </div>
      ) : null}
    </div>
  )
}

import { useEffect, useRef, useState } from 'react'
import { DayPicker } from 'react-day-picker'
import { es } from 'date-fns/locale'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { formatDateForApi } from '../../lib/dates'

const pickerClassNames = {
  root: 'w-full',
  months: 'flex flex-col',
  month: 'w-full',
  month_caption: 'mb-2 flex items-center justify-center',
  caption_label: 'font-display text-sm font-bold capitalize text-brand-green',
  nav: 'flex items-center gap-1',
  button_previous:
    'inline-flex h-9 w-9 items-center justify-center rounded-full text-brand-green touch-manipulation active:bg-brand-yellow/30',
  button_next:
    'inline-flex h-9 w-9 items-center justify-center rounded-full text-brand-green touch-manipulation active:bg-brand-yellow/30',
  month_grid: 'w-full border-collapse',
  weekdays: 'text-[0.65rem] font-semibold uppercase text-brand-carmelita/70',
  weekday: 'pb-1 text-center',
  week: 'text-sm',
  day: 'p-0.5 text-center',
  day_button:
    'mx-auto flex h-9 w-9 items-center justify-center rounded-full font-semibold text-brand-green touch-manipulation active:bg-brand-yellow/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-green/30',
  selected: '[&>button]:bg-brand-green [&>button]:text-brand-white [&>button]:active:bg-brand-green',
  range_start: 'rounded-l-full bg-brand-yellow/40',
  range_middle: 'bg-brand-yellow/25',
  range_end: 'rounded-r-full bg-brand-yellow/40',
  today: '[&>button]:ring-2 [&>button]:ring-brand-yellow',
  outside: 'text-brand-carmelita/35',
  disabled: '[&>button]:cursor-not-allowed [&>button]:text-brand-carmelita/25 [&>button]:active:bg-transparent',
}

function civilDate(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || ''))
  if (!match) return undefined
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
  return Number.isNaN(date.getTime()) ? undefined : date
}

function shortDate(value) {
  const date = civilDate(value)
  if (!date) return ''
  return new Intl.DateTimeFormat('es', { day: 'numeric', month: 'short' }).format(date)
}

function CalendarIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </svg>
  )
}

export default function NoticeDateFilter({ from, to, onChange }) {
  const rootRef = useRef(null)
  const reduced = useReducedMotion()
  const [shown, setShown] = useState(false)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const fromDate = civilDate(from)
  const toDate = civilDate(to)
  const active = Boolean(from || to)
  const selected = fromDate ? { from: fromDate, to: toDate } : undefined
  const hint = from && to
    ? `${shortDate(from)} – ${shortDate(to)}`
    : from
      ? 'Ahora elige el fin'
      : 'Elige el inicio y después el fin'

  useEffect(() => {
    if (!shown) return undefined
    function onPointerDown(event) {
      if (!rootRef.current?.contains(event.target)) setShown(false)
    }
    function onKeyDown(event) {
      if (event.key === 'Escape') setShown(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [shown])

  function selectRange(range) {
    onChange(
      range?.from ? formatDateForApi(range.from) : '',
      range?.to ? formatDateForApi(range.to) : '',
    )
  }

  return (
    <div ref={rootRef} className="w-full">
      <button
        type="button"
        onClick={() => setShown((current) => !current)}
        aria-expanded={shown}
        aria-label={shown ? 'Ocultar calendario' : 'Filtrar por fecha'}
        className={`relative inline-flex h-11 w-11 items-center justify-center rounded-full border touch-manipulation ${
          shown || active
            ? 'border-brand-green/30 bg-brand-yellow/25 text-brand-green'
            : 'border-brand-green/15 bg-brand-white text-brand-carmelita'
        }`}
      >
        <CalendarIcon />
        {active ? <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-brand-carmelita" aria-hidden="true" /> : null}
      </button>
      <AnimatePresence initial={false}>
        {shown ? (
          <motion.div
            key="notice-dates"
            initial={reduced ? false : { height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={reduced ? { opacity: 0 } : { height: 0, opacity: 0 }}
            transition={{ duration: reduced ? 0 : 0.2, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <div className="mt-3 rounded-2xl border border-brand-green/12 bg-brand-white p-3">
              <p className="mb-2 text-xs font-semibold text-brand-carmelita">{hint}</p>
              <DayPicker
                mode="range"
                selected={selected}
                onSelect={selectRange}
                locale={es}
                disabled={{ after: today }}
                endMonth={today}
                defaultMonth={fromDate && fromDate <= today ? fromDate : today}
                classNames={pickerClassNames}
              />
              {active ? (
                <button
                  type="button"
                  onClick={() => onChange('', '')}
                  className="mt-2 text-xs font-semibold text-brand-green"
                >
                  Quitar fechas
                </button>
              ) : null}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}

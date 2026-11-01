import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { DayPicker } from 'react-day-picker'
import { es } from 'date-fns/locale'
import { format } from 'date-fns'

export const DATE_RANGE_PERIODS = [
  { id: 'daily', label: 'Diario' },
  { id: 'weekly', label: 'Semanal' },
  { id: 'monthly', label: 'Mensual' },
]

const pickerClassNames = {
  root: 'w-full',
  months: 'flex flex-col',
  month: 'w-full',
  month_caption: 'mb-2 flex items-center justify-center',
  caption_label: 'text-sm font-semibold text-brand-green',
  nav: 'flex items-center gap-1',
  button_previous:
    'inline-flex h-8 w-8 items-center justify-center rounded-lg text-brand-green/70 transition-colors hover:bg-brand-green/8 hover:text-brand-green',
  button_next:
    'inline-flex h-8 w-8 items-center justify-center rounded-lg text-brand-green/70 transition-colors hover:bg-brand-green/8 hover:text-brand-green',
  month_grid: 'w-full border-collapse',
  weekdays: 'text-[0.65rem] font-medium uppercase text-brand-carmelita/65',
  weekday: 'pb-1 text-center',
  week: 'text-xs',
  day: 'p-0 text-center',
  day_button:
    'mx-auto flex h-8 w-8 items-center justify-center rounded-lg font-medium text-brand-carmelita transition-colors hover:bg-brand-green/8 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-green/30',
  selected: '[&>button]:bg-brand-green [&>button]:text-white [&>button]:hover:bg-brand-green',
  range_start: '[&>button]:bg-brand-green [&>button]:text-white',
  range_end: '[&>button]:bg-brand-green [&>button]:text-white',
  range_middle: '[&>button]:bg-brand-green/12 [&>button]:text-brand-green',
  today: '[&>button]:ring-1 [&>button]:ring-brand-green/45',
  outside: 'text-brand-carmelita/35',
  disabled: '[&>button]:cursor-not-allowed [&>button]:text-brand-carmelita/30 [&>button]:hover:bg-transparent',
}

export function startOfToday() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return today
}

export function addDays(value, days) {
  const next = new Date(value)
  next.setDate(next.getDate() + days)
  next.setHours(0, 0, 0, 0)
  return next
}

export function startOfTomorrow() {
  return addDays(startOfToday(), 1)
}

export function isoDate(value) {
  if (!value) return ''
  const year = value.getFullYear()
  const month = String(value.getMonth() + 1).padStart(2, '0')
  const day = String(value.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function rangeForPeriod(period) {
  const to = startOfToday()
  if (period === 'weekly') {
    const from = new Date(to)
    from.setDate(from.getDate() - 6)
    return { from, to }
  }
  if (period === 'monthly') {
    return { from: new Date(to.getFullYear(), to.getMonth(), 1), to }
  }
  return { from: new Date(to), to }
}

function periodClass(active) {
  return `inline-flex h-8 items-center rounded-lg border px-3 text-xs font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-green/25 ${
    active
      ? 'border-brand-green/15 bg-brand-green/10 text-brand-green'
      : 'border-transparent text-brand-carmelita/65 hover:bg-brand-green/5 hover:text-brand-green'
  }`
}

export default function AdminDateRangeControls({
  period,
  onPeriodChange,
  range,
  onRangeChange,
  applyPeriodToRange = false,
  allowUntilTomorrow = false,
  className = '',
  inline = false,
}) {
  const [open, setOpen] = useState(false)
  const [periodOpen, setPeriodOpen] = useState(false)
  const [draft, setDraft] = useState(range)
  const rootRef = useRef(null)
  const calendarRef = useRef(null)
  const periodMenuRef = useRef(null)
  const maxDay = allowUntilTomorrow ? startOfTomorrow() : startOfToday()
  const customActive = period === 'custom' && Boolean(range?.from && range?.to)
  const periodLabel = period === 'custom'
    ? 'Personalizado'
    : DATE_RANGE_PERIODS.find((option) => option.id === period)?.label ?? 'Diario'
  const menuOpen = open || periodOpen

  useEffect(() => {
    if (!menuOpen) return undefined
    function handleKey(event) {
      if (event.key === 'Escape') {
        setOpen(false)
        setPeriodOpen(false)
      }
    }
    function handlePointer(event) {
      if (rootRef.current?.contains(event.target)) return
      setOpen(false)
      setPeriodOpen(false)
    }
    document.addEventListener('keydown', handleKey)
    document.addEventListener('pointerdown', handlePointer)
    return () => {
      document.removeEventListener('keydown', handleKey)
      document.removeEventListener('pointerdown', handlePointer)
    }
  }, [menuOpen])

  useEffect(() => {
    if (!inline || !open) return undefined
    const frame = window.requestAnimationFrame(() => {
      calendarRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
    })
    return () => window.cancelAnimationFrame(frame)
  }, [inline, open])

  useEffect(() => {
    if (!inline || !periodOpen) return undefined
    const frame = window.requestAnimationFrame(() => {
      periodMenuRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
    })
    return () => window.cancelAnimationFrame(frame)
  }, [inline, periodOpen])

  function applyRange() {
    if (!draft?.from || !draft?.to) return
    onRangeChange({ from: draft.from, to: draft.to }, 'custom')
    setOpen(false)
  }

  function clearRange() {
    onRangeChange(null, null)
    setDraft(null)
    setOpen(false)
  }

  const rangeLabel = customActive
    ? `${format(range.from, 'd MMM', { locale: es })} – ${format(range.to, 'd MMM yyyy', { locale: es })}`
    : 'Fechas'

  const floatButton = 'inline-flex min-h-11 items-center rounded-full border border-white bg-brand-green px-4 text-xs font-semibold text-white shadow-[0_8px_24px_rgba(41,55,29,0.24)] transition hover:bg-brand-green/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-green/35'
  const buttonClass = inline
    ? 'inline-flex min-h-10 items-center rounded-xl border border-brand-green/15 bg-brand-white px-3.5 text-xs font-semibold text-brand-green shadow-sm transition hover:border-brand-green/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-green/20'
    : floatButton
  const popupPosition = inline ? 'left-0 top-full mt-2' : 'right-0 bottom-full mb-2'
  const calendarContent = open ? (
    <div ref={inline ? calendarRef : null} className={`${inline ? 'mt-2 mb-5 w-[19rem] max-w-[calc(100vw-3.5rem)] scroll-mb-5' : `absolute ${popupPosition} w-[19rem] max-w-[calc(100vw-2rem)]`} z-40 rounded-2xl border border-white bg-brand-white p-3 shadow-[0_16px_40px_rgba(41,55,29,0.2)] motion-safe:animate-order-modal-in`}>
      <DayPicker
        mode="range"
        selected={draft ?? undefined}
        onSelect={setDraft}
        locale={es}
        disabled={{ after: maxDay }}
        defaultMonth={draft?.from ?? range?.from ?? startOfToday()}
        classNames={pickerClassNames}
      />
      <p className="mt-2 text-[0.68rem] leading-relaxed text-brand-carmelita/70">
        {allowUntilTomorrow
          ? 'Incluye ambos días, hasta mañana (hora de Cuba).'
          : 'Incluye ambos días, hasta hoy.'}
      </p>
      <button
        type="button"
        onClick={applyRange}
        disabled={!draft?.from || !draft?.to}
        className={`${periodClass(true)} mt-2 w-full justify-center disabled:opacity-50`}
      >
        Aplicar
      </button>
    </div>
  ) : null

  if (typeof document === 'undefined') return null

  const controls = (
    <div
      ref={rootRef}
      className={`${inline ? `relative z-30 flex flex-wrap items-center gap-2 ${periodOpen ? 'pb-36' : ''}` : 'fixed right-4 bottom-[calc(5.5rem+var(--safe-bottom))] z-40 flex items-end gap-2 lg:bottom-5'} ${className}`}
    >
      <div className="relative">
        {periodOpen ? (
          <div ref={periodMenuRef} className={`absolute ${popupPosition} z-40 flex w-40 scroll-mb-5 flex-col gap-1 rounded-2xl border border-white bg-brand-white p-2 shadow-[0_16px_40px_rgba(41,55,29,0.2)] motion-safe:animate-order-modal-in`}>
            {DATE_RANGE_PERIODS.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => {
                  onPeriodChange?.(option.id)
                  if (applyPeriodToRange) onRangeChange(rangeForPeriod(option.id), option.id)
                  setPeriodOpen(false)
                }}
                className={`${periodClass(period === option.id)} justify-center`}
              >
                {option.label}
              </button>
            ))}
          </div>
        ) : null}
        <button
          type="button"
          onClick={() => {
            setOpen(false)
            setPeriodOpen((value) => !value)
          }}
          className={`${buttonClass} ${periodOpen ? 'ring-2 ring-brand-green/20' : ''}`}
          aria-expanded={periodOpen}
          aria-label="Cambiar temporalidad"
        >
          {periodLabel}
        </button>
      </div>
      <div className={`${inline ? 'flex flex-col items-start' : 'relative flex items-end'} gap-1`}>
        {customActive ? (
          <button
            type="button"
            onClick={clearRange}
            className={inline
              ? 'inline-flex h-10 w-10 items-center justify-center rounded-xl border border-brand-green/15 bg-brand-white text-lg text-brand-green shadow-sm hover:border-brand-green/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-green/20'
              : 'inline-flex h-11 w-11 items-center justify-center rounded-full border border-white bg-brand-green text-lg text-white shadow-[0_8px_24px_rgba(41,55,29,0.24)] hover:bg-brand-green/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-green/35'}
            aria-label="Quitar rango"
          >
            ×
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => {
            setPeriodOpen(false)
            setDraft(range)
            setOpen((value) => !value)
          }}
          className={`${buttonClass} ${customActive || open ? 'ring-2 ring-brand-green/20' : ''}`}
          aria-expanded={open}
        >
          {rangeLabel}
        </button>
        {calendarContent}
      </div>
    </div>
  )

  return inline ? controls : createPortal(controls, document.body)
}

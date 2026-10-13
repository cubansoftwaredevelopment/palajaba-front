import { useEffect, useRef, useState } from 'react'
import { DayPicker } from 'react-day-picker'
import { es } from 'date-fns/locale'
import { format } from 'date-fns'
import { adminFocusRing, adminSubtle } from '../../components/admin/adminStyles'

const OPTIONS = [
  { id: 'daily', label: 'Diario' },
  { id: 'weekly', label: 'Semanal' },
  { id: 'monthly', label: 'Mensual' },
]

const pickerClassNames = {
  root: 'w-full',
  months: 'flex flex-col',
  month: 'w-full',
  month_caption: 'mb-2 flex items-center justify-center',
  caption_label: 'text-sm font-semibold text-white',
  nav: 'flex items-center gap-1',
  button_previous:
    'inline-flex h-7 w-7 items-center justify-center rounded-md text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-white',
  button_next:
    'inline-flex h-7 w-7 items-center justify-center rounded-md text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-white',
  month_grid: 'w-full border-collapse',
  weekdays: 'text-[0.65rem] font-medium uppercase text-zinc-500',
  weekday: 'pb-1 text-center',
  week: 'text-xs',
  day: 'p-0 text-center',
  day_button:
    'mx-auto flex h-7 w-7 items-center justify-center rounded-md font-medium text-zinc-200 transition-colors hover:bg-zinc-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30',
  selected: '[&>button]:bg-white [&>button]:text-zinc-950 [&>button]:hover:bg-zinc-200',
  range_start: '[&>button]:bg-white [&>button]:text-zinc-950',
  range_end: '[&>button]:bg-white [&>button]:text-zinc-950',
  range_middle: '[&>button]:bg-brand-green/20 [&>button]:text-zinc-100',
  today: '[&>button]:ring-1 [&>button]:ring-zinc-500',
  outside: 'text-zinc-600',
  disabled: '[&>button]:cursor-not-allowed [&>button]:text-zinc-700 [&>button]:hover:bg-transparent',
}

function startOfToday() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return today
}

function periodClass(active) {
  return `inline-flex h-7 items-center rounded-lg border px-2.5 text-xs font-medium transition-colors ${adminFocusRing} ${
    active
      ? 'border-brand-green/40 bg-brand-green/15 text-brand-green'
      : 'border-transparent text-zinc-400 hover:bg-zinc-800/70 hover:text-zinc-100'
  }`
}

export default function AdminStatsRangeControls({
  granularity,
  onGranularityChange,
  range,
  onRangeChange,
}) {
  const [open, setOpen] = useState(false)
  const [periodOpen, setPeriodOpen] = useState(false)
  const [draft, setDraft] = useState(range)
  const rootRef = useRef(null)
  const customActive = Boolean(range?.from && range?.to)
  const periodLabel = OPTIONS.find((option) => option.id === granularity)?.label ?? 'Diario'
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

  function applyRange() {
    if (!draft?.from || !draft?.to) return
    onRangeChange({ from: draft.from, to: draft.to })
    setOpen(false)
  }

  function clearRange() {
    onRangeChange(null)
    setDraft(null)
    setOpen(false)
  }

  const rangeLabel = customActive
    ? `${format(range.from, 'd MMM', { locale: es })} – ${format(range.to, 'd MMM yyyy', { locale: es })}`
    : 'Fechas'

  const floatButton = `inline-flex h-10 items-center rounded-full border px-4 text-xs font-medium shadow-[0_8px_24px_rgba(0,0,0,0.28)] ${adminFocusRing}`

  return (
    <div
      ref={rootRef}
      className="fixed right-4 bottom-[max(1.25rem,var(--safe-bottom))] z-30 flex items-end gap-2"
    >
      <div className="relative">
        {periodOpen ? (
          <div className="absolute right-0 bottom-full mb-2 flex w-36 flex-col gap-1 rounded-xl border border-brand-green/15 bg-[var(--admin-header)] p-1.5 shadow-[0_16px_40px_rgba(0,0,0,0.28)]">
            {OPTIONS.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => {
                  onGranularityChange(option.id)
                  setPeriodOpen(false)
                }}
                className={`${periodClass(granularity === option.id)} justify-center`}
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
          className={`${floatButton} ${
            periodOpen
              ? 'border-brand-green/40 bg-brand-green text-brand-white'
              : 'border-zinc-700/80 bg-[var(--admin-header)] text-zinc-100'
          }`}
          aria-expanded={periodOpen}
          aria-label="Cambiar temporalidad"
        >
          {periodLabel}
        </button>
      </div>
      <div className="relative flex items-end gap-1">
        {open ? (
          <div className="absolute right-0 bottom-full mb-2 w-[17.5rem] rounded-xl border border-brand-green/15 bg-[var(--admin-header)] p-2 shadow-[0_16px_40px_rgba(0,0,0,0.28)]">
            <DayPicker
              mode="range"
              selected={draft ?? undefined}
              onSelect={setDraft}
              locale={es}
              disabled={{ after: startOfToday() }}
              defaultMonth={draft?.from ?? range?.from ?? startOfToday()}
              classNames={pickerClassNames}
            />
            <p className={`mt-1 text-[0.65rem] leading-relaxed ${adminSubtle}`}>
              Incluye ambos días, hasta hoy.
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
        ) : null}
        {customActive ? (
          <button
            type="button"
            onClick={clearRange}
            className={`inline-flex h-10 w-10 items-center justify-center rounded-full border border-zinc-700/80 bg-[var(--admin-header)] text-lg text-zinc-300 shadow-[0_8px_24px_rgba(0,0,0,0.28)] hover:text-zinc-50 ${adminFocusRing}`}
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
          className={`${floatButton} ${
            customActive || open
              ? 'border-brand-green/40 bg-brand-green text-brand-white'
              : 'border-zinc-700/80 bg-[var(--admin-header)] text-zinc-100'
          }`}
          aria-expanded={open}
        >
          {rangeLabel}
        </button>
      </div>
    </div>
  )
}

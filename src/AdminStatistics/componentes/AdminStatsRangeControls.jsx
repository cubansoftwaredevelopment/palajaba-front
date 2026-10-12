import { useState } from 'react'
import { DayPicker } from 'react-day-picker'
import { es } from 'date-fns/locale'
import { format } from 'date-fns'
import { adminCard, adminChoice, adminSubtle } from '../../components/admin/adminStyles'

const OPTIONS = [
  { id: 'daily', label: 'Diario' },
  { id: 'weekly', label: 'Semanal' },
  { id: 'monthly', label: 'Mensual' },
]

const pickerClassNames = {
  root: 'w-full',
  months: 'flex flex-col',
  month: 'w-full',
  month_caption: 'mb-3 flex items-center justify-center',
  caption_label: 'text-base font-semibold text-white',
  nav: 'flex items-center gap-1',
  button_previous:
    'inline-flex h-9 w-9 items-center justify-center rounded-lg text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-white',
  button_next:
    'inline-flex h-9 w-9 items-center justify-center rounded-lg text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-white',
  month_grid: 'w-full border-collapse',
  weekdays: 'text-xs font-medium uppercase text-zinc-500',
  weekday: 'pb-2 text-center',
  week: 'text-sm',
  day: 'p-0.5 text-center',
  day_button:
    'mx-auto flex h-9 w-9 items-center justify-center rounded-lg font-medium text-zinc-200 transition-colors hover:bg-zinc-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30',
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

export default function AdminStatsRangeControls({
  granularity,
  onGranularityChange,
  range,
  onRangeChange,
}) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState(range)
  const customActive = Boolean(range?.from && range?.to)

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

  const rangeLabel =
    customActive
      ? `${format(range.from, 'd MMM', { locale: es })} – ${format(range.to, 'd MMM yyyy', { locale: es })}`
      : 'Fecha personalizada'

  return (
    <section className={adminCard}>
      <div className="grid grid-cols-3 gap-2">
        {OPTIONS.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => onGranularityChange(option.id)}
            className={adminChoice(granularity === option.id)}
          >
            {option.label}
          </button>
        ))}
      </div>
      <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-[1fr_auto]">
        <button
          type="button"
          onClick={() => {
            setDraft(range)
            setOpen((value) => !value)
          }}
          className={adminChoice(customActive || open)}
        >
          {rangeLabel}
        </button>
        {customActive ? (
          <button type="button" onClick={clearRange} className={adminChoice(false)}>
            Quitar rango
          </button>
        ) : null}
      </div>
      {open ? (
        <div className="mt-3">
          <div className="admin-picker rounded-xl border border-brand-green/15 bg-zinc-900/80 p-3">
            <DayPicker
              mode="range"
              selected={draft ?? undefined}
              onSelect={setDraft}
              locale={es}
              disabled={{ after: startOfToday() }}
              defaultMonth={draft?.from ?? range?.from ?? startOfToday()}
              classNames={pickerClassNames}
            />
          </div>
          <p className={`mt-2 text-xs leading-relaxed ${adminSubtle}`}>
            El rango incluye ambos días, hasta hoy. Diario, semanal y mensual cambian el tamaño de
            cada vela dentro de esas fechas.
          </p>
          <button
            type="button"
            onClick={applyRange}
            disabled={!draft?.from || !draft?.to}
            className={`${adminChoice(true)} mt-3 w-full disabled:opacity-50`}
          >
            Aplicar fechas
          </button>
        </div>
      ) : null}
    </section>
  )
}

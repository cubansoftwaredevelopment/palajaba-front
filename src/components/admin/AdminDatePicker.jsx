import { DayPicker } from 'react-day-picker'
import { es } from 'date-fns/locale'
import { formatDateLabel } from '../../lib/dates'

export default function AdminDatePicker({ value, onChange, minDate }) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return (
    <div className="admin-picker rounded-xl border border-brand-green/15 bg-zinc-900/80 p-3">
      <DayPicker
        mode="single"
        selected={value}
        onSelect={onChange}
        locale={es}
        disabled={{ before: minDate ?? today }}
        defaultMonth={value ?? minDate ?? today}
        classNames={{
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
          selected:
            '[&>button]:bg-white [&>button]:text-zinc-950 [&>button]:hover:bg-zinc-200',
          today: '[&>button]:ring-1 [&>button]:ring-zinc-500',
          outside: 'text-zinc-600',
          disabled:
            '[&>button]:cursor-not-allowed [&>button]:text-zinc-700 [&>button]:hover:bg-transparent',
        }}
      />
      {value && (
        <p className="mt-2 border-t border-zinc-800 pt-2 text-center text-sm text-zinc-400">
          Fin: <strong className="text-white">{formatDateLabel(value)}</strong>
        </p>
      )}
    </div>
  )
}

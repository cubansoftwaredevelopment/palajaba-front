import { DayPicker } from 'react-day-picker'
import { es } from 'date-fns/locale'
import { formatDateLabel } from '../lib/dates'

export default function SubscriptionDatePicker({ value, onChange, minDate }) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return (
    <div className="subscription-picker rounded-2xl border-2 border-brand-green/15 bg-brand-white p-3">
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
          caption_label: 'font-display text-base font-bold text-brand-green',
          nav: 'flex items-center gap-1',
          button_previous:
            'inline-flex h-9 w-9 items-center justify-center rounded-full text-brand-green transition-colors hover:bg-brand-yellow/25',
          button_next:
            'inline-flex h-9 w-9 items-center justify-center rounded-full text-brand-green transition-colors hover:bg-brand-yellow/25',
          month_grid: 'w-full border-collapse',
          weekdays: 'text-xs font-semibold uppercase text-brand-carmelita/80',
          weekday: 'pb-2 text-center',
          week: 'text-sm',
          day: 'p-0.5 text-center',
          day_button:
            'mx-auto flex h-9 w-9 items-center justify-center rounded-full font-semibold text-brand-green transition-colors hover:bg-brand-yellow/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-green/30',
          selected:
            '[&>button]:bg-brand-green [&>button]:text-brand-white [&>button]:hover:bg-brand-green',
          today: '[&>button]:ring-2 [&>button]:ring-brand-yellow/60',
          outside: 'text-brand-carmelita/40',
          disabled: '[&>button]:cursor-not-allowed [&>button]:text-brand-carmelita/30 [&>button]:hover:bg-transparent',
        }}
      />
      {value && (
        <p className="mt-2 border-t border-brand-green/10 pt-2 text-center text-sm text-brand-carmelita/90">
          Fin de suscripción:{' '}
          <strong className="text-brand-green">{formatDateLabel(value)}</strong>
        </p>
      )}
    </div>
  )
}

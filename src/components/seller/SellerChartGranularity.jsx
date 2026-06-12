import { sellerChoice } from './sellerStyles'

export const CHART_GRANULARITY_OPTIONS = [
  { id: 'daily', label: 'Diario' },
  { id: 'weekly', label: 'Semanal' },
  { id: 'monthly', label: 'Mensual' },
]

export default function SellerChartGranularity({
  granularity,
  onGranularityChange,
  monthsAvailable,
}) {
  const canShowMonthly = monthsAvailable >= 2
  const visibleOptions = CHART_GRANULARITY_OPTIONS.filter(
    (option) => option.id !== 'monthly' || canShowMonthly,
  )

  return (
    <div className="grid grid-cols-3 gap-2">
      {visibleOptions.map((option) => (
        <button
          key={option.id}
          type="button"
          onClick={() => onGranularityChange(option.id)}
          className={sellerChoice(granularity === option.id)}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

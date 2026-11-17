import MethodTabs from '../../auth/components/MethodTabs'

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
  const value = visibleOptions.some((option) => option.id === granularity)
    ? granularity
    : visibleOptions[0].id

  return (
    <MethodTabs
      options={visibleOptions}
      value={value}
      onChange={onGranularityChange}
      ariaLabel="Temporalidad del gráfico"
      className=""
    />
  )
}

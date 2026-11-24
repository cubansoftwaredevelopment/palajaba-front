import AdminDateRangeControls from './AdminDateRangeControls.jsx'

export default function AdminStatsRangeControls({
  granularity,
  onGranularityChange,
  range,
  onRangeChange,
}) {
  return (
    <AdminDateRangeControls
      period={granularity}
      onPeriodChange={onGranularityChange}
      range={range}
      onRangeChange={onRangeChange}
    />
  )
}

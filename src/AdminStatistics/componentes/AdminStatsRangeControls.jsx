import AdminDateRangeControls from '../../components/admin/AdminDateRangeControls'

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

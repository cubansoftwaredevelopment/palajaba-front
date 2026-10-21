import { sellerChip, sellerFocusRing, sellerHint, sellerSection } from '../../components/seller/sellerStyles'
import { DATE_RANGE_PERIODS, formatRangeLabel } from '../utils'

export default function SellerDateRangeControls({ period, range, onPeriodChange }) {
  return (
    <div className={sellerSection}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className={sellerHint}>Periodo</p>
        <p className="text-xs font-semibold text-brand-green">{formatRangeLabel(range)}</p>
      </div>
      <div className="mt-2.5 flex flex-wrap gap-1.5">
        {DATE_RANGE_PERIODS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`${sellerChip(period === item.id)} ${sellerFocusRing}`}
            onClick={() => onPeriodChange(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  )
}

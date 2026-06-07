import { getMunicipalityMonogram } from '../../lib/municipalityDisplay'
import {
  buyerCapitalBadge,
  buyerMunicipalityMonogram,
  buyerMunicipalityName,
  buyerMunicipalityRow,
} from './buyerStyles'

export default function MunicipalityPickerRow({ municipality, onSelect }) {
  return (
    <button type="button" onClick={() => onSelect(municipality)} className={buyerMunicipalityRow}>
      <span className={buyerMunicipalityMonogram} aria-hidden="true">
        {getMunicipalityMonogram(municipality.name)}
      </span>
      <span className={buyerMunicipalityName}>{municipality.name}</span>
      {municipality.isCapital && <span className={buyerCapitalBadge}>Capital</span>}
      <svg
        className="ml-auto h-4 w-4 shrink-0 text-brand-carmelita/45"
        viewBox="0 0 20 20"
        fill="currentColor"
        aria-hidden="true"
      >
        <path
          fillRule="evenodd"
          d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
          clipRule="evenodd"
        />
      </svg>
    </button>
  )
}

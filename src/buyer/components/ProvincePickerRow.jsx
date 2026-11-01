import { buyerProvinceImage, buyerProvinceName, buyerProvinceRow } from './buyerStyles'

export default function ProvincePickerRow({ province, onSelect }) {
  return (
    <button type="button" onClick={() => onSelect(province)} className={buyerProvinceRow}>
      <img
        src={province.imageUrl}
        alt={province.imageAlt}
        className={buyerProvinceImage}
        loading="lazy"
        decoding="async"
      />
      <span className={buyerProvinceName}>{province.name}</span>
      <svg
        className="h-5 w-5 shrink-0 text-brand-carmelita/50"
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

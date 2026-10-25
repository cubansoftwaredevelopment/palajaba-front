import { areaKey } from '../../lib/businessArea'
import { sellerChip, sellerHint, sellerLabel } from '../../components/seller/sellerStyles'

export default function ProductSalesZonesField({ areas = [], selectedKeys = [], onChange }) {
  if (!areas.length) return null

  const allSelected = areas.every((area) => selectedKeys.includes(areaKey(area)))

  function toggle(key) {
    onChange(
      selectedKeys.includes(key) ? selectedKeys.filter((item) => item !== key) : [...selectedKeys, key],
    )
  }

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between gap-2">
        <p className={sellerLabel}>Zonas de venta</p>
        {areas.length > 1 ? (
          <button
            type="button"
            className="text-xs font-semibold text-brand-green"
            onClick={() => onChange(allSelected ? selectedKeys : areas.map(areaKey))}
          >
            Todas
          </button>
        ) : null}
      </div>
      <p className={`mt-0.5 ${sellerHint}`}>
        El producto aparece en estas zonas aunque no acepte domicilio. Quita las que no apliquen.
      </p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {areas.map((area) => {
          const key = areaKey(area)
          return (
            <button
              key={key}
              type="button"
              onClick={() => toggle(key)}
              className={sellerChip(selectedKeys.includes(key))}
            >
              {area.municipality_name}
            </button>
          )
        })}
      </div>
    </div>
  )
}

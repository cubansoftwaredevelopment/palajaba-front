import { useMemo } from 'react'
import CategoryAutocomplete from './CategoryAutocomplete'
import { CUBA_PROVINCES } from '../../constants/cubaLocations'
import { buildBusinessArea } from '../../lib/businessArea'
import { sellerHint, sellerLabel } from './sellerStyles'

const PROVINCE_OPTIONS = CUBA_PROVINCES.map((province) => ({
  id: province.id,
  name: province.name,
}))

export default function SellerBusinessAreaFields({
  provinceId,
  municipalityId,
  onProvinceChange,
  onMunicipalityChange,
  provinceInputId = 'seller-business-province',
  municipalityInputId = 'seller-business-municipality',
}) {
  const municipalities = useMemo(() => {
    const province = CUBA_PROVINCES.find((item) => item.id === provinceId)
    return province?.municipalities ?? []
  }, [provinceId])

  return (
    <div className="grid grid-cols-1 gap-3 sm:gap-4">
      <div>
        <label htmlFor={provinceInputId} className={sellerLabel}>
          Provincia<span className="text-brand-carmelita"> *</span>
        </label>
        <div className="mt-1.5">
          <CategoryAutocomplete
            id={provinceInputId}
            categories={PROVINCE_OPTIONS}
            value={provinceId}
            onChange={(nextProvinceId) => {
              onProvinceChange(nextProvinceId)
              onMunicipalityChange('')
            }}
            placeholder="Buscar provincia…"
          />
        </div>
      </div>

      <div>
        <label htmlFor={municipalityInputId} className={sellerLabel}>
          Municipio<span className="text-brand-carmelita"> *</span>
        </label>
        <div className="mt-1.5">
          <CategoryAutocomplete
            id={municipalityInputId}
            categories={municipalities}
            value={municipalityId}
            onChange={onMunicipalityChange}
            placeholder={provinceId ? 'Buscar municipio…' : 'Primero elige una provincia'}
            disabled={!provinceId}
            emptyLabel="Sin coincidencias en esta provincia"
          />
        </div>
        <p className={`mt-1.5 ${sellerHint}`}>
          Tu tienda aparecerá a compradores de este municipio.
        </p>
      </div>
    </div>
  )
}

export function getBusinessAreaFromSelection(provinceId, municipalityId) {
  return buildBusinessArea(provinceId, municipalityId)
}

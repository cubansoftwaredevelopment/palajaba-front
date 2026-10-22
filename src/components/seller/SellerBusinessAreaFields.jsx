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
  municipalityHint = 'Tu tienda aparecerá a compradores de este municipio.',
  dropdownZIndex = 60,
  allowedAreas = null,
}) {
  const provinceOptions = useMemo(() => {
    if (!allowedAreas) return PROVINCE_OPTIONS
    const seen = new Set()
    return allowedAreas
      .filter((area) => area?.province_id && !seen.has(area.province_id) && seen.add(area.province_id))
      .map((area) => ({
        id: area.province_id,
        name: area.province_name || area.province_id,
      }))
  }, [allowedAreas])

  const municipalities = useMemo(() => {
    if (allowedAreas) {
      return allowedAreas
        .filter((area) => area.province_id === provinceId)
        .map((area) => ({
          id: area.municipality_id,
          name: area.municipality_name || area.municipality_id,
        }))
    }
    const province = CUBA_PROVINCES.find((item) => item.id === provinceId)
    return province?.municipalities ?? []
  }, [allowedAreas, provinceId])

  return (
    <div className="grid grid-cols-1 gap-3 sm:gap-4">
      <div>
        <label htmlFor={provinceInputId} className={sellerLabel}>
          Provincia<span className="text-brand-carmelita"> *</span>
        </label>
        <div className="mt-1.5">
          <CategoryAutocomplete
            id={provinceInputId}
            categories={provinceOptions}
            value={provinceId}
            onChange={(nextProvinceId) => {
              onProvinceChange(nextProvinceId)
              onMunicipalityChange('')
            }}
            placeholder="Buscar provincia…"
            dropdownZIndex={dropdownZIndex}
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
            emptyLabel={
              allowedAreas
                ? 'Esta provincia no tiene municipios permitidos'
                : 'Sin coincidencias en esta provincia'
            }
            dropdownZIndex={dropdownZIndex}
          />
        </div>
        {municipalityHint ? <p className={`mt-1.5 ${sellerHint}`}>{municipalityHint}</p> : null}
      </div>
    </div>
  )
}

export function getBusinessAreaFromSelection(provinceId, municipalityId) {
  return buildBusinessArea(provinceId, municipalityId)
}

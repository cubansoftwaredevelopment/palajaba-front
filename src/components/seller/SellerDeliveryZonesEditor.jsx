import { useMemo, useState } from 'react'
import CategoryAutocomplete from './CategoryAutocomplete'
import { CUBA_PROVINCES } from '../../constants/cubaLocations'
import {
  areaKey,
  buildBusinessArea,
  dedupeDeliveryAreas,
  formatAreaLabel,
} from '../../lib/businessArea'
import { sellerBtnSecondary, sellerChip, sellerHint, sellerLabel } from './sellerStyles'

const PROVINCE_OPTIONS = CUBA_PROVINCES.map((province) => ({
  id: province.id,
  name: province.name,
}))

export default function SellerDeliveryZonesEditor({
  zones,
  businessArea,
  onChange,
  idPrefix = 'seller-delivery',
}) {
  const [provinceId, setProvinceId] = useState('')
  const [municipalityId, setMunicipalityId] = useState('')
  const [localError, setLocalError] = useState('')

  const municipalities = useMemo(() => {
    const province = CUBA_PROVINCES.find((item) => item.id === provinceId)
    return province?.municipalities ?? []
  }, [provinceId])

  const excludedKeys = useMemo(() => {
    const keys = new Set(zones.map(areaKey))
    if (businessArea) keys.add(areaKey(businessArea))
    return keys
  }, [zones, businessArea])

  function handleAddZone() {
    setLocalError('')
    const area = buildBusinessArea(provinceId, municipalityId)
    if (!area) {
      setLocalError('Selecciona provincia y municipio.')
      return
    }

    if (excludedKeys.has(areaKey(area))) {
      setLocalError('Esa zona ya está incluida.')
      return
    }

    onChange(dedupeDeliveryAreas([...zones, area], businessArea))
    setProvinceId('')
    setMunicipalityId('')
  }

  function handleRemoveZone(target) {
    onChange(zones.filter((zone) => areaKey(zone) !== areaKey(target)))
  }

  return (
    <div className="space-y-3">
      {businessArea && (
        <p className={sellerHint}>
          Ya apareces en <strong className="text-brand-green">{formatAreaLabel(businessArea)}</strong>.
          Agrega otros municipios donde también entregas.
        </p>
      )}

      {zones.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {zones.map((zone) => (
            <span key={areaKey(zone)} className={`inline-flex items-center gap-1 ${sellerChip(true)}`}>
              {formatAreaLabel(zone)}
              <button
                type="button"
                onClick={() => handleRemoveZone(zone)}
                className="rounded-full p-0.5 text-brand-white/90 touch-manipulation hover:text-brand-white"
                aria-label={`Quitar ${formatAreaLabel(zone)}`}
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
                  <path d="M3 3l6 6M9 3L3 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="rounded-2xl border border-brand-green/12 bg-brand-green/[0.02] p-3.5">
        <p className={sellerLabel}>Agregar zona de envío</p>
        <div className="mt-3 grid grid-cols-1 gap-3">
          <CategoryAutocomplete
            id={`${idPrefix}-province`}
            categories={PROVINCE_OPTIONS}
            value={provinceId}
            onChange={(nextProvinceId) => {
              setProvinceId(nextProvinceId)
              setMunicipalityId('')
              setLocalError('')
            }}
            placeholder="Provincia de entrega…"
          />
          <CategoryAutocomplete
            id={`${idPrefix}-municipality`}
            categories={municipalities}
            value={municipalityId}
            onChange={(nextMunicipalityId) => {
              setMunicipalityId(nextMunicipalityId)
              setLocalError('')
            }}
            placeholder={provinceId ? 'Municipio de entrega…' : 'Primero elige una provincia'}
            disabled={!provinceId}
          />
        </div>
        {localError && (
          <p className="mt-2 text-xs text-brand-carmelita" role="alert">
            {localError}
          </p>
        )}
        <button type="button" onClick={handleAddZone} className={`mt-3 ${sellerBtnSecondary}`}>
          Agregar zona
        </button>
      </div>
    </div>
  )
}

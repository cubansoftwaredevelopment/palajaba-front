import { useMemo, useState } from 'react'
import { getProvinceById } from '../../constants/cubaLocations'
import { municipalityMatchesQuery } from '../../lib/municipalityDisplay'
import {
  buyerExpandSearchChip,
  buyerExpandSearchPanel,
  buyerExpandSearchRoot,
  buyerExpandSearchTrigger,
  buyerExpandSearchTriggerIcon,
  buyerExpandSearchTriggerMeta,
  buyerExpandSearchTriggerTitle,
  buyerSearchInput,
} from './buyerStyles'

export default function BuyerAdditionalMunicipalitiesFilter({
  provinceId,
  baseMunicipalityId,
  selectedIds,
  onChange,
}) {
  const province = getProvinceById(provinceId)
  const [expanded, setExpanded] = useState(false)
  const [query, setQuery] = useState('')

  const municipalities = useMemo(() => {
    if (!province) return []

    return [...province.municipalities]
      .filter((municipality) => municipality.id !== baseMunicipalityId)
      .filter((municipality) => municipalityMatchesQuery(municipality.name, query))
      .sort((a, b) => a.name.localeCompare(b.name, 'es'))
  }, [baseMunicipalityId, province, query])

  const allMunicipalityIds = useMemo(() => {
    if (!province) return []
    return province.municipalities
      .filter((municipality) => municipality.id !== baseMunicipalityId)
      .map((municipality) => municipality.id)
  }, [baseMunicipalityId, province])

  if (!province || province.municipalities.length <= 1) {
    return null
  }

  function toggleMunicipality(municipalityId) {
    if (selectedIds.includes(municipalityId)) {
      onChange(selectedIds.filter((id) => id !== municipalityId))
      return
    }
    onChange([...selectedIds, municipalityId])
  }

  function selectAll() {
    onChange(allMunicipalityIds)
  }

  function clearSelection() {
    onChange([])
  }

  const selectedCount = selectedIds.length
  const allSelected = selectedCount > 0 && selectedCount === allMunicipalityIds.length

  const triggerLabel =
    selectedCount > 0
      ? allSelected
        ? 'Toda la provincia incluida'
        : `+${selectedCount} municipio${selectedCount === 1 ? '' : 's'} extra`
      : 'Buscar en más municipios'

  return (
    <section className={buyerExpandSearchRoot} aria-label="Ampliar búsqueda a otros municipios">
      <button
        type="button"
        onClick={() => setExpanded((current) => !current)}
        className={buyerExpandSearchTrigger(selectedCount > 0)}
        aria-expanded={expanded}
      >
        <span className={buyerExpandSearchTriggerIcon} aria-hidden="true">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M12 21s7-4.35 7-10a7 7 0 10-14 0c0 5.65 7 10 7 10z" />
            <circle cx="12" cy="11" r="2.5" />
          </svg>
        </span>
        <span className={buyerExpandSearchTriggerTitle}>{triggerLabel}</span>
        {selectedCount > 0 ? (
          <span className={buyerExpandSearchTriggerMeta}>{selectedCount}</span>
        ) : null}
        <svg
          className={`h-3.5 w-3.5 shrink-0 text-brand-carmelita/45 transition-transform sm:h-4 sm:w-4 ${expanded ? 'rotate-180' : ''}`}
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {expanded ? (
        <div className={buyerExpandSearchPanel}>
          <p className="mb-2 text-[0.68rem] leading-snug text-brand-carmelita/85 sm:text-xs">
            Marca los municipios donde podrías ir a recoger. Los productos sin domicilio a tu zona se
            identificarán claramente.
          </p>

          <label className="sr-only" htmlFor="buyer-additional-municipality-search">
            Buscar municipio
          </label>
          <input
            id="buyer-additional-municipality-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar municipio…"
            className={`${buyerSearchInput} mb-2.5 min-h-9 py-2 text-xs sm:min-h-10 sm:text-sm`}
            autoComplete="off"
          />

          <div className="mb-2.5 flex items-center gap-3">
            <button
              type="button"
              onClick={selectAll}
              className="text-[0.68rem] font-semibold text-brand-green underline-offset-2 hover:underline sm:text-xs"
            >
              Todos
            </button>
            <button
              type="button"
              onClick={clearSelection}
              className="text-[0.68rem] font-semibold text-brand-carmelita underline-offset-2 hover:underline sm:text-xs"
            >
              Ninguno
            </button>
          </div>

          {municipalities.length === 0 ? (
            <p className="text-[0.68rem] text-brand-carmelita/80 sm:text-xs">
              No hay municipios que coincidan con tu búsqueda.
            </p>
          ) : (
            <div className="flex max-h-40 flex-wrap gap-1.5 overflow-y-auto overscroll-contain sm:max-h-48 sm:gap-2">
              {municipalities.map((municipality) => {
                const active = selectedIds.includes(municipality.id)
                return (
                  <button
                    key={municipality.id}
                    type="button"
                    onClick={() => toggleMunicipality(municipality.id)}
                    className={buyerExpandSearchChip(active)}
                    aria-pressed={active}
                  >
                    {municipality.name}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      ) : null}
    </section>
  )
}

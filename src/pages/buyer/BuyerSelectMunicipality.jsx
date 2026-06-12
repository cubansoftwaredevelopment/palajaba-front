import { useMemo, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import AuthHeader from '../../components/auth/AuthHeader'
import BuyerLocationProgress from '../../components/buyer/BuyerLocationProgress'
import BuyerShell from '../../components/buyer/BuyerShell'
import MunicipalityPickerRow from '../../components/buyer/MunicipalityPickerRow'
import {
  buyerContextChip,
  buyerList,
  buyerPageIntro,
  buyerSearchInput,
} from '../../components/buyer/buyerStyles'
import { MARKETPLACE_LABEL } from '../../constants/branding'
import { getProvinceById } from '../../constants/cubaLocations'
import { getBuyerLocation, setBuyerMunicipality } from '../../lib/buyerLocation'
import { municipalityMatchesQuery } from '../../lib/municipalityDisplay'

export default function BuyerSelectMunicipality() {
  const navigate = useNavigate()
  const savedLocation = getBuyerLocation()
  const province = savedLocation?.province?.id
    ? getProvinceById(savedLocation.province.id)
    : null
  const [query, setQuery] = useState('')

  const municipalities = useMemo(() => {
    if (!province) return []

    return [...province.municipalities]
      .filter((municipality) => municipalityMatchesQuery(municipality.name, query))
      .sort((a, b) => a.name.localeCompare(b.name, 'es'))
  }, [province, query])

  if (!province) {
    return <Navigate to="/comprar/provincia" replace />
  }

  function handleSelect(municipality) {
    setBuyerMunicipality({
      id: municipality.id,
      name: municipality.name,
    })
    navigate('/comprar')
  }

  return (
    <BuyerShell backTo="/comprar/provincia" backLabel="Provincia">
      <div className={buyerPageIntro}>
        <div>
          <AuthHeader eyebrow={MARKETPLACE_LABEL} title="Tu municipio" layout="desktop-left" />
          <div className="mt-3 flex justify-center lg:justify-start">
            <span className={buyerContextChip}>
              <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path
                  fillRule="evenodd"
                  d="M9.69 18.933l.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 00.281-.14c.186-.096.446-.24.757-.433.62-.384 1.445-.966 2.274-1.765C15.302 14.988 17 12.493 17 9A7 7 0 103 9c0 3.492 1.698 5.988 3.355 7.584a13.731 13.731 0 002.273 1.765 11.842 11.842 0 00.976.544l.017.007.006.003zM10 11.25a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5z"
                  clipRule="evenodd"
                />
              </svg>
              {province.name}
            </span>
          </div>
        </div>
        <BuyerLocationProgress currentStep={2} />
      </div>

      <label htmlFor="buyer-municipality-search" className="sr-only">
        Buscar municipio
      </label>
      <input
        id="buyer-municipality-search"
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Buscar municipio…"
        className={`mb-4 lg:max-w-xl ${buyerSearchInput}`}
        autoComplete="off"
      />

      <div className={`animate-fade-in ${buyerList}`}>
        {municipalities.length === 0 ? (
          <p className="rounded-2xl border border-brand-green/10 bg-brand-white px-4 py-5 text-center text-sm text-brand-carmelita/85 lg:col-span-2">
            No hay municipios con ese nombre.
          </p>
        ) : (
          municipalities.map((municipality) => (
            <MunicipalityPickerRow
              key={municipality.id}
              municipality={municipality}
              onSelect={handleSelect}
            />
          ))
        )}
      </div>
    </BuyerShell>
  )
}

import { Link } from 'react-router-dom'
import { getProvinceById } from '../../constants/cubaLocations'
import {
  buyerHeaderLocationImage,
  buyerHeaderLocationProvince,
  buyerHeaderLocationRoot,
  buyerHeaderLocationTitle,
} from './buyerStyles'

const linkClass =
  'rounded-full touch-manipulation transition-opacity active:opacity-75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green/25'

export default function BuyerLocationDisplay({ province, municipality, extraMunicipalityCount = 0 }) {
  const provinceData = province?.id ? getProvinceById(province.id) : null
  const extraLabel = extraMunicipalityCount > 0 ? ` +${extraMunicipalityCount}` : ''

  return (
    <div className={`${buyerHeaderLocationRoot} -ml-1`}>
      <Link
        to="/comprar/provincia"
        aria-label={`Cambiar provincia (${province?.name})`}
        className={`${linkClass} shrink-0`}
      >
        {provinceData?.imageUrl ? (
          <img
            src={provinceData.imageUrl}
            alt=""
            className={buyerHeaderLocationImage}
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className={`${buyerHeaderLocationImage} bg-brand-green/10`} aria-hidden="true" />
        )}
      </Link>
      <div className="min-w-0">
        <Link
          to="/comprar/municipio"
          aria-label={`Cambiar municipio (${municipality?.name})`}
          className={`${linkClass} block max-w-full`}
        >
          <p className={buyerHeaderLocationTitle}>
            {municipality?.name}
            {extraLabel}
          </p>
        </Link>
        <Link
          to="/comprar/provincia"
          aria-label={`Cambiar provincia (${province?.name})`}
          className={`${linkClass} block max-w-full`}
        >
          <p className={buyerHeaderLocationProvince}>{province?.name}</p>
        </Link>
      </div>
    </div>
  )
}

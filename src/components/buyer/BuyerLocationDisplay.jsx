import { Link } from 'react-router-dom'
import { getProvinceById } from '../../constants/cubaLocations'
import {
  buyerHeaderLocationImage,
  buyerHeaderLocationProvince,
  buyerHeaderLocationRoot,
  buyerHeaderLocationTitle,
} from './buyerStyles'

export default function BuyerLocationDisplay({ province, municipality }) {
  const provinceData = province?.id ? getProvinceById(province.id) : null

  return (
    <Link
      to="/comprar/provincia"
      aria-label={`Cambiar ubicación (${municipality?.name}, ${province?.name})`}
      className={`${buyerHeaderLocationRoot} -ml-1 rounded-full py-0.5 pl-1 pr-2 touch-manipulation transition-opacity active:opacity-75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green/25`}
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
      <div className="min-w-0">
        <p className={buyerHeaderLocationTitle}>{municipality?.name}</p>
        <p className={buyerHeaderLocationProvince}>{province?.name}</p>
      </div>
    </Link>
  )
}

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
    <div className={buyerHeaderLocationRoot}>
      {provinceData?.imageUrl ? (
        <img
          src={provinceData.imageUrl}
          alt={provinceData.imageAlt || province?.name || ''}
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
    </div>
  )
}

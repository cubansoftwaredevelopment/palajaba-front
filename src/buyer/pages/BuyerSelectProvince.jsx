import { useNavigate } from 'react-router-dom'
import AuthHeader from '../../auth/componentes/AuthHeader.jsx'
import BuyerLocationProgress from '../componentes/BuyerLocationProgress.jsx'
import BuyerShell from '../componentes/BuyerShell.jsx'
import ProvincePickerRow from '../componentes/ProvincePickerRow.jsx'
import { buyerList, buyerPageIntro } from '../componentes/buyerStyles.js'
import { MARKETPLACE_LABEL } from '../../shared/utils/branding.js'
import { CUBA_PROVINCES } from '../../shared/utils/cubaLocations.js'
import { hasCompleteBuyerLocation, setBuyerProvince } from '../utils/buyerLocation.js'
import { getSellerReturnPath, isSellerBrowsingMarketplace } from '../../seller/utils/sellerMarketplaceNav.js'

export default function BuyerSelectProvince() {
  const navigate = useNavigate()
  const isChangingLocation = hasCompleteBuyerLocation()

  const sellerBrowsing = isSellerBrowsingMarketplace()
  const backTo = isChangingLocation
    ? '/comprar'
    : sellerBrowsing
      ? getSellerReturnPath()
      : undefined
  const backLabel = isChangingLocation
    ? MARKETPLACE_LABEL
    : sellerBrowsing
      ? 'Mi tienda'
      : undefined

  function handleSelect(province) {
    setBuyerProvince({
      id: province.id,
      name: province.name,
    })
    navigate('/comprar/municipio')
  }

  return (
    <BuyerShell backTo={backTo} backLabel={backLabel}>
      <div className={buyerPageIntro}>
        <AuthHeader eyebrow={MARKETPLACE_LABEL} title="¿Dónde estás?" layout="desktop-left" />
        <BuyerLocationProgress currentStep={1} />
      </div>
      <div className={`animate-fade-in ${buyerList}`}>
        {CUBA_PROVINCES.map((province) => (
          <ProvincePickerRow key={province.id} province={province} onSelect={handleSelect} />
        ))}
      </div>
    </BuyerShell>
  )
}

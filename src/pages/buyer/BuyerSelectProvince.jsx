import { useNavigate } from 'react-router-dom'
import AuthHeader from '../../components/auth/AuthHeader'
import BuyerLocationProgress from '../../components/buyer/BuyerLocationProgress'
import BuyerShell from '../../components/buyer/BuyerShell'
import ProvincePickerRow from '../../components/buyer/ProvincePickerRow'
import { buyerList, buyerPageIntro } from '../../components/buyer/buyerStyles'
import { MARKETPLACE_LABEL } from '../../constants/branding'
import { CUBA_PROVINCES } from '../../constants/cubaLocations'
import { hasCompleteBuyerLocation, setBuyerProvince } from '../../lib/buyerLocation'
import { getSellerReturnPath, isSellerBrowsingMarketplace } from '../../lib/sellerMarketplaceNav'

export default function BuyerSelectProvince() {
  const navigate = useNavigate()
  const isChangingLocation = hasCompleteBuyerLocation()

  const sellerBrowsing = isSellerBrowsingMarketplace()
  const backTo = isChangingLocation
    ? '/comprar'
    : sellerBrowsing
      ? getSellerReturnPath()
      : '/'
  const backLabel = isChangingLocation
    ? MARKETPLACE_LABEL
    : sellerBrowsing
      ? 'Mi tienda'
      : 'Inicio'

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

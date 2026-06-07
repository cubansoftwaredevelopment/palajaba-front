import { useNavigate } from 'react-router-dom'
import AuthHeader from '../../components/auth/AuthHeader'
import BuyerLocationProgress from '../../components/buyer/BuyerLocationProgress'
import BuyerShell from '../../components/buyer/BuyerShell'
import ProvincePickerRow from '../../components/buyer/ProvincePickerRow'
import { buyerList, buyerPageIntro } from '../../components/buyer/buyerStyles'
import { CUBA_PROVINCES } from '../../constants/cubaLocations'
import { setBuyerProvince } from '../../lib/buyerLocation'

export default function BuyerSelectProvince() {
  const navigate = useNavigate()

  function handleSelect(province) {
    setBuyerProvince({
      id: province.id,
      name: province.name,
    })
    navigate('/comprar/municipio')
  }

  return (
    <BuyerShell backTo="/" backLabel="Inicio">
      <div className={buyerPageIntro}>
        <AuthHeader eyebrow="Comprar" title="¿Dónde estás?" layout="desktop-left" />
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

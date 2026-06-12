import { buyerProductSoldOutBadge, buyerProductSoldOutImageVeil, buyerProductSoldOutVeil } from './buyerStyles'

export default function BuyerProductSoldOutOverlay({ fullCard = false }) {
  if (fullCard) {
    return (
      <div className={buyerProductSoldOutVeil} aria-hidden="true">
        <span className={buyerProductSoldOutBadge}>AGOTADO</span>
      </div>
    )
  }

  return (
    <div className={buyerProductSoldOutImageVeil} aria-hidden="true">
      <span className={buyerProductSoldOutBadge}>AGOTADO</span>
    </div>
  )
}

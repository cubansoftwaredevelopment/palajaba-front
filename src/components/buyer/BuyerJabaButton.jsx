import JabaBagIcon from './JabaBagIcon'
import { useBuyerJaba } from '../../context/BuyerJabaContext'
import { buyerJabaBadge, buyerJabaTrigger } from './buyerStyles'

export default function BuyerJabaButton() {
  const { count, togglePanel, open } = useBuyerJaba()

  return (
    <button
      type="button"
      onClick={togglePanel}
      className={buyerJabaTrigger}
      aria-label={count > 0 ? `Tu jaba, ${count} productos` : 'Abrir tu jaba'}
      aria-expanded={open}
      aria-haspopup="dialog"
    >
      <JabaBagIcon className="h-10 w-10 lg:h-11 lg:w-11" alt="" />
      {count > 0 ? (
        <span className={buyerJabaBadge} aria-hidden="true">
          {count > 99 ? '99+' : count}
        </span>
      ) : null}
    </button>
  )
}

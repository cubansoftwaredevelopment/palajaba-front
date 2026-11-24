import { formatPrice } from '../../shared/utils/money.js'
import { mensajeriaPerKm, mensajeriaPrice } from '../utils/constants.js'

function formatPerKm(rate) {
  const amount = Number(rate.amount).toLocaleString('es', { maximumFractionDigits: 2 })
  return `${amount} ${rate.currency}/km`
}

export default function OrderCourierCost({ order, km = 0, done = false }) {
  const price = mensajeriaPrice(order)
  const rate = done ? mensajeriaPerKm(order, km) : null
  if (!price && !rate) return null
  return (
    <>
      {price ? <p className="mt-0.5 font-semibold text-brand-green">Mensajería {formatPrice(price.amount, price.currency)}</p> : null}
      {rate ? <p className="mt-0.5 text-sm text-brand-carmelita">{formatPerKm(rate)}</p> : null}
    </>
  )
}

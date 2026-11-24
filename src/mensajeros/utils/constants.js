export const VEHICLE_TYPES = [
  { id: 'bicicleta', label: 'Bicicleta' },
  { id: 'moto', label: 'Motocicleta' },
  { id: 'triciclo', label: 'Triciclo' },
  { id: 'auto', label: 'Auto' },
  { id: 'camioneta', label: 'Camioneta' },
  { id: 'camion', label: 'Camión' },
]

export const FEE_CURRENCIES = ['CUP', 'USD', 'EUR', 'MLC', 'QUSD']

export function vehicleLabel(id) {
  return VEHICLE_TYPES.find((item) => item.id === id)?.label || id
}

export function mensajeriaPrice(order) {
  const fee = Number(order?.fee_amount)
  const delivery = Number(order?.delivery_price)
  const feeCurrency = order?.fee_currency || null
  const deliveryCurrency = order?.delivery_currency || null
  const feeOk = Number.isFinite(fee)
  const deliveryOk = Number.isFinite(delivery)
  if (feeOk && deliveryOk && feeCurrency && deliveryCurrency && feeCurrency === deliveryCurrency) {
    return { amount: fee + delivery, currency: feeCurrency }
  }
  if (feeOk) return { amount: fee, currency: feeCurrency || 'CUP' }
  if (deliveryOk) return { amount: delivery, currency: deliveryCurrency || 'CUP' }
  return null
}

export function mensajeriaPerKm(order, km) {
  const price = mensajeriaPrice(order)
  const distance = Number(km)
  if (!price || !Number.isFinite(distance) || distance <= 0) return null
  return { amount: price.amount / distance, currency: price.currency }
}

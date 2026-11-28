export function canPayCourierWithQvaPay(order, messenger) {
  return Boolean(
    order?.payment_method === 'qvapay'
    && order.delivery_price != null
    && messenger?.qvapay_verified,
  )
}

export function courierPayChoices(order, messenger) {
  const choices = [{ value: 'other', label: 'Otra moneda' }]
  if (canPayCourierWithQvaPay(order, messenger)) {
    choices.push({ value: 'qvapay', label: 'QvaPay' })
  }
  return choices
}

export function courierAssignmentError(orders, fees, messenger) {
  if (!messenger?.id) return 'Elige un mensajero.'
  if (orders.some((order) => order.payment_method === 'qvapay' && order.qvapay?.payment_status !== 'paid')) {
    return 'El cliente todavía no pagó este pedido por QvaPay.'
  }
  if (orders.some((order) => fees[order.id]?.pay_via === 'qvapay' && !canPayCourierWithQvaPay(order, messenger))) {
    return 'Este mensajero no tiene QvaPay verificado.'
  }
  if (orders.some((order) => !fees[order.id]?.pay_via || fees[order.id].fee_amount === '' || !fees[order.id]?.fee_currency)) {
    return 'Completa el pago de cada pedido.'
  }
  return ''
}

export function buildCourierBatchPayload(messengerId, orders, fees) {
  return {
    mensajero_id: messengerId,
    orders: orders.map((order) => ({
      order_id: order.id,
      pay_via: fees[order.id].pay_via,
      fee_amount: Number(fees[order.id].fee_amount),
      fee_currency: fees[order.id].fee_currency,
    })),
  }
}

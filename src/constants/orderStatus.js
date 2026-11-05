export const ORDER_STATUS_LABELS = {
  pending_confirmation: 'Por procesar',
  completed: 'Compra realizada',
  cancelled: 'Cancelado',
}

export function isCustomerPaidOrder(order) {
  return order?.payment_method === 'qvapay'
    && order?.qvapay?.payment_status === 'paid'
    && order?.status !== 'completed'
    && order?.status !== 'cancelled'
}

export const ORDER_STATUS_STYLES = {
  pending_confirmation: 'bg-brand-yellow/20 text-brand-green',
  completed: 'bg-brand-green/12 text-brand-green',
}

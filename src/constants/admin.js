export const REJECTION_REASON =
  'No pudimos confirmar el pago de la transferencia.'

export const BILLING_LABELS = {
  monthly: 'Mensual',
  yearly: 'Anual',
}

export const PLAN_TIER_LABELS = {
  standard: 'Básico',
  premium: 'Premium',
}

export const STATUS_LABELS = {
  pending: 'Pendiente',
  approved: 'Aprobada',
  rejected: 'Rechazada',
  expired: 'Vencida',
}

export const NOTIFICATION_AUDIENCE_OPTIONS = [
  { id: 'all', label: 'Todos los vendedores activos' },
  { id: 'premium_monthly', label: 'Premium · Mensual' },
  { id: 'premium_yearly', label: 'Premium · Anual' },
  { id: 'standard_monthly', label: 'Básico · Mensual' },
  { id: 'standard_yearly', label: 'Básico · Anual' },
  { id: 'single', label: 'Un negocio específico' },
]

export const NOTIFICATION_AUDIENCE_LABELS = {
  ...Object.fromEntries(NOTIFICATION_AUDIENCE_OPTIONS.map(({ id, label }) => [id, label])),
  premium: 'Plan Premium (mensual o anual)',
  standard: 'Plan Básico (mensual o anual)',
}

export function notificationAudienceDisplay(item) {
  if (item?.audience === 'single' && item?.target_store_name) {
    return `Tienda: ${item.target_store_name}`
  }
  return NOTIFICATION_AUDIENCE_LABELS[item?.audience] ?? NOTIFICATION_AUDIENCE_LABELS.all
}

export const FILTER_TABS = [
  { id: 'pending', label: 'Pendientes' },
  { id: 'approved', label: 'Aprobadas' },
  { id: 'expired', label: 'Vencidas' },
  { id: 'rejected', label: 'Rechazadas' },
  { id: 'all', label: 'Todas' },
]

export const FEEDBACK_TYPE_LABELS = {
  complaint: 'Queja',
  suggestion: 'Sugerencia',
}

export const FEEDBACK_FILTER_TABS = [
  { id: 'all', label: 'Todas' },
  { id: 'unread', label: 'No leídas' },
  { id: 'complaint', label: 'Quejas' },
  { id: 'suggestion', label: 'Sugerencias' },
]

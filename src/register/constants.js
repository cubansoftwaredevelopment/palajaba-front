export const OTP_DURATION_MS = 10 * 60 * 1000

export const PAID_REGISTER_STEPS = [
  { id: 1, label: 'Plan' },
  { id: 2, label: 'Pago' },
  { id: 3, label: 'Datos' },
  { id: 4, label: 'Verificar' },
]

export const TRIAL_REGISTER_STEPS = [
  { id: 1, label: 'Plan' },
  { id: 2, label: 'Datos' },
  { id: 3, label: 'Verificar' },
]

export const REGISTER_STEPS = PAID_REGISTER_STEPS

export function getRegisterSteps(kind) {
  return kind === 'trial' ? TRIAL_REGISTER_STEPS : PAID_REGISTER_STEPS
}

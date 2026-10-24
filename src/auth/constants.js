export const OTP_DURATION_MS = 10 * 60 * 1000
export const SMS_COOLDOWN_MS = 2 * 60 * 1000
export const OTP_SMS_FAILED_CODE = 'otp_sms_failed'
export const OTP_SMS_FAILED_MESSAGE =
  'No pudimos enviar el código. Revisa el número de teléfono y espera 2 minutos para intentarlo de nuevo.'

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

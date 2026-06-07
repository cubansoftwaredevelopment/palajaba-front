export const PHONE_PREFIX = '+53'
export const PHONE_DIGITS_LENGTH = 8

export function formatPhoneDigits(digits) {
  if (digits.length <= 1) return digits
  if (digits.length <= 4) return `${digits.slice(0, 1)} ${digits.slice(1)}`
  return `${digits.slice(0, 1)} ${digits.slice(1, 4)} ${digits.slice(4)}`
}

export function getPhoneDigits(value) {
  return value.replace(/\D/g, '').slice(0, PHONE_DIGITS_LENGTH)
}

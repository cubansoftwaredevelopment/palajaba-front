import { request } from '../lib/api'

export function startRegisterOtp(payload) {
  return request('/api/register/otp/start', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function resendRegisterOtp(payload) {
  return request('/api/register/otp/resend', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function confirmRegisterOtp(payload) {
  return request('/api/register/otp/confirm', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

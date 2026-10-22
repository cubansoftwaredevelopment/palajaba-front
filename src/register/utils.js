import { useEffect, useState } from 'react'
import { getPhoneDigits } from '../lib/phone'
import {
  OTP_DURATION_MS,
  OTP_SMS_FAILED_CODE,
  OTP_SMS_FAILED_MESSAGE,
  SMS_COOLDOWN_MS,
} from './constants'

const SMS_COOLDOWN_STORAGE_KEY = 'palajaba.register.smsCooldown'

export function expiryMs(value) {
  if (value) {
    const parsed = Date.parse(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return Date.now() + OTP_DURATION_MS
}

export function formatCountdown(ms) {
  const total = Math.max(0, Math.ceil(ms / 1000))
  const minutes = Math.floor(total / 60)
  const seconds = total % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

export function useCountdown(endsAt) {
  const [remaining, setRemaining] = useState(() => Math.max(0, endsAt - Date.now()))

  useEffect(() => {
    function tick() {
      setRemaining(Math.max(0, endsAt - Date.now()))
    }
    tick()
    const id = window.setInterval(tick, 250)
    return () => window.clearInterval(id)
  }, [endsAt])

  return remaining
}

function readSmsCooldownStore() {
  try {
    const raw = window.localStorage.getItem(SMS_COOLDOWN_STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : {}
    if (!parsed || typeof parsed !== 'object') return { lastPhone: '', untilByPhone: {} }
    const untilByPhone = parsed.untilByPhone && typeof parsed.untilByPhone === 'object' ? parsed.untilByPhone : {}
    const now = Date.now()
    const next = {}
    for (const [phone, iso] of Object.entries(untilByPhone)) {
      const until = Date.parse(iso)
      if (Number.isFinite(until) && until > now) next[phone] = iso
    }
    return { lastPhone: String(parsed.lastPhone || ''), untilByPhone: next }
  } catch {
    return { lastPhone: '', untilByPhone: {} }
  }
}

function writeSmsCooldownStore(store) {
  try {
    window.localStorage.setItem(SMS_COOLDOWN_STORAGE_KEY, JSON.stringify(store))
  } catch {
    /* ignore */
  }
}

export function getSmsCooldownUntil(phone) {
  const digits = getPhoneDigits(phone)
  if (!digits) return 0
  const iso = readSmsCooldownStore().untilByPhone[digits]
  const until = iso ? Date.parse(iso) : NaN
  return Number.isFinite(until) && until > Date.now() ? until : 0
}

export function getActiveSmsCooldownPhone() {
  const store = readSmsCooldownStore()
  const last = getPhoneDigits(store.lastPhone)
  if (last && getSmsCooldownUntil(last)) return last
  for (const [phone, iso] of Object.entries(store.untilByPhone)) {
    const until = Date.parse(iso)
    if (Number.isFinite(until) && until > Date.now()) return phone
  }
  return ''
}

export function rememberSmsCooldown(phone, untilIso) {
  const digits = getPhoneDigits(phone)
  if (!digits) return 0
  const parsed = untilIso ? Date.parse(untilIso) : NaN
  const until = Number.isFinite(parsed) && parsed > Date.now() ? parsed : Date.now() + SMS_COOLDOWN_MS
  const store = readSmsCooldownStore()
  store.lastPhone = digits
  store.untilByPhone = { ...store.untilByPhone, [digits]: new Date(until).toISOString() }
  writeSmsCooldownStore(store)
  return until
}

export function applySmsFailFromError(err, phone) {
  const code = err?.code || err?.data?.code
  if (code !== OTP_SMS_FAILED_CODE) return 0
  return rememberSmsCooldown(phone, err?.data?.retry_available_at)
}

export function smsFailUserMessage(remainingMs = 0) {
  if (remainingMs > 0) {
    return `${OTP_SMS_FAILED_MESSAGE} Tiempo restante: ${formatCountdown(remainingMs)}.`
  }
  return OTP_SMS_FAILED_MESSAGE
}

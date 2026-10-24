import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import AuthHeader from '../components/AuthHeader'
import AuthShell from '../components/AuthShell'
import Button from '../../components/Button'
import {
  alertErrorClass,
  hintClass,
  inputClass,
  labelClass,
} from '../components/formStyles'
import { confirmPasswordResetOtp, resendPasswordResetOtp } from '../api.js'
import { getUserFacingMessage } from '../../lib/userFacingError'
import {
  applySmsFailFromError,
  expiryMs,
  formatCountdown,
  getSmsCooldownUntil,
  smsFailUserMessage,
  useCountdown,
} from '../context.js'

function CodeField({ id, label, hint, value, onChange }) {
  return (
    <div>
      <label htmlFor={id} className={labelClass}>
        {label}{' '}
        <span className="text-brand-carmelita" aria-hidden="true">
          *
        </span>
      </label>
      <input
        id={id}
        type="text"
        inputMode="numeric"
        autoComplete="one-time-code"
        value={value}
        onChange={(event) => onChange(event.target.value.replace(/\D/g, '').slice(0, 6))}
        className={`${inputClass} tracking-[0.35em]`}
        placeholder="000000"
        required
      />
      <p className={hintClass}>{hint}</p>
    </div>
  )
}

export default function ForgotPasswordOtp() {
  const navigate = useNavigate()
  const location = useLocation()
  const challengeId = location.state?.challengeId
  const emailHint = location.state?.emailHint || ''
  const phoneHint = location.state?.phoneHint || ''
  const phone = location.state?.phone || ''

  const [emailCode, setEmailCode] = useState('')
  const [phoneCode, setPhoneCode] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState(location.state?.message || '')
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState('')
  const [emailEndsAt, setEmailEndsAt] = useState(() => expiryMs(location.state?.emailExpiresAt))
  const [phoneEndsAt, setPhoneEndsAt] = useState(() => expiryMs(location.state?.phoneExpiresAt))
  const [smsCooldownEndsAt, setSmsCooldownEndsAt] = useState(() => getSmsCooldownUntil(phone))
  const emailRemaining = useCountdown(emailEndsAt)
  const phoneRemaining = useCountdown(phoneEndsAt)
  const smsCooldownRemaining = useCountdown(smsCooldownEndsAt)
  const remaining = Math.max(emailRemaining, phoneRemaining)
  const expired = remaining <= 0
  const phoneResendLocked = phoneRemaining > 0 || smsCooldownRemaining > 0

  useEffect(() => {
    if (!challengeId) {
      navigate('/recuperar', { replace: true })
    }
  }, [challengeId, navigate])

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    if (emailCode.length < 4 || phoneCode.length < 4) {
      setError('Ingresa los dos códigos de verificación.')
      return
    }
    setLoading(true)
    try {
      const result = await confirmPasswordResetOtp({
        challenge_id: challengeId,
        email_code: emailCode,
        phone_code: phoneCode,
      })
      navigate('/recuperar/nueva', {
        replace: true,
        state: {
          challengeId,
          message: result.message,
        },
      })
    } catch (err) {
      setError(
        getUserFacingMessage(
          err,
          'No pudimos verificar los códigos. Revísalos o pídelos de nuevo.',
        ),
      )
    } finally {
      setLoading(false)
    }
  }

  async function handleResend(channel) {
    setError('')
    setResending(channel)
    try {
      const result = await resendPasswordResetOtp({
        challenge_id: challengeId,
        channel,
      })
      setInfo(result.message || 'Código reenviado.')
      if (channel === 'email') setEmailEndsAt(expiryMs(result.email_expires_at))
      if (channel === 'phone') setPhoneEndsAt(expiryMs(result.phone_expires_at))
    } catch (err) {
      const cooldownUntil = applySmsFailFromError(err, phone)
      if (cooldownUntil) {
        setSmsCooldownEndsAt(cooldownUntil)
        setError(smsFailUserMessage(cooldownUntil - Date.now()))
      } else {
        setError(
          getUserFacingMessage(
            err,
            'No pudimos reenviar el código. Espera un momento e inténtalo de nuevo.',
          ),
        )
      }
    } finally {
      setResending('')
    }
  }

  if (!challengeId) return null

  return (
    <AuthShell backTo="/recuperar" backLabel="Cuenta" contentWidth="narrow">
      <section className="animate-fade-in lg:mx-auto lg:max-w-md" aria-labelledby="reset-otp-title">
        <AuthHeader
          eyebrow="Recuperar acceso"
          title="Confirma que eres tú"
          description="Enviamos un código al correo y otro por SMS. Tienes 10 minutos para introducirlos."
        />

        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5" noValidate>
          <div
            className="flex items-center justify-between gap-3 rounded-xl border border-brand-green/15 bg-brand-white px-3.5 py-3"
            role="timer"
            aria-live="polite"
            aria-label="Tiempo restante para usar los códigos"
          >
            <p className="text-sm text-brand-carmelita/90">
              {expired ? 'Los códigos expiraron' : 'Tiempo restante'}
            </p>
            <p
              className={`font-mono text-xl font-bold tabular-nums ${
                expired ? 'text-brand-carmelita' : 'text-brand-green'
              }`}
            >
              {formatCountdown(remaining)}
            </p>
          </div>

          {info ? (
            <p className="rounded-xl border border-brand-yellow/30 bg-brand-yellow/10 px-3.5 py-2.5 text-sm text-brand-green">
              {info}
            </p>
          ) : null}

          <CodeField
            id="reset-email-code"
            label="Código del correo"
            hint={`Enviado a ${emailHint || 'tu correo'}.`}
            value={emailCode}
            onChange={setEmailCode}
          />
          <button
            type="button"
            onClick={() => handleResend('email')}
            disabled={Boolean(resending) || loading || emailRemaining > 0}
            className="self-start text-sm font-semibold text-brand-green underline-offset-2 hover:underline disabled:opacity-60"
          >
            {resending === 'email'
              ? 'Reenviando…'
              : emailRemaining > 0
                ? `Reenviar correo en ${formatCountdown(emailRemaining)}`
                : 'Reenviar código de correo'}
          </button>

          <CodeField
            id="reset-phone-code"
            label="Código del SMS"
            hint={`Enviado a ${phoneHint ? `+53 ${phoneHint}` : 'tu teléfono'}.`}
            value={phoneCode}
            onChange={setPhoneCode}
          />
          <button
            type="button"
            onClick={() => handleResend('phone')}
            disabled={Boolean(resending) || loading || phoneResendLocked}
            className="self-start text-sm font-semibold text-brand-green underline-offset-2 hover:underline disabled:opacity-60"
          >
            {resending === 'phone'
              ? 'Reenviando…'
              : smsCooldownRemaining > 0
                ? `Reenviar SMS en ${formatCountdown(smsCooldownRemaining)}`
                : phoneRemaining > 0
                  ? `Reenviar SMS en ${formatCountdown(phoneRemaining)}`
                  : 'Reenviar código de SMS'}
          </button>

          {smsCooldownRemaining > 0 ? (
            <p className={alertErrorClass} role="alert">
              {smsFailUserMessage(smsCooldownRemaining)}
            </p>
          ) : error ? (
            <p className={alertErrorClass} role="alert">
              {error}
            </p>
          ) : null}

          <Button type="submit" className="mt-1" disabled={loading}>
            {loading ? 'Verificando…' : 'Verificar y continuar'}
          </Button>
        </form>
      </section>
    </AuthShell>
  )
}

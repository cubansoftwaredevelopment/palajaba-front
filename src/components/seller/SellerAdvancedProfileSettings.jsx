import { useEffect, useMemo, useState } from 'react'

import SellerProfileFieldGroup from './SellerProfileFieldGroup'
import SellerSection from './SellerSection'
import {
  sellerAlertError,
  sellerBtnPrimary,
  sellerBtnSecondary,
  sellerFocusRing,
  sellerHint,
  sellerInputBare,
  sellerInputPrefix,
  sellerInputPrefixWrap,
  sellerLabel,
} from './sellerStyles'
import {
  confirmSellerContactOtp,
  resendSellerContactOtp,
  startSellerEmailOtp,
  startSellerPhoneOtp,
  updateSellerStoreName,
} from '../../lib/api'
import {
  PHONE_DIGITS_LENGTH,
  PHONE_PREFIX,
  formatPhoneDigits,
  getPhoneDigits,
  phoneDigitsFromStored,
} from '../../lib/phone'
import { getSellerToken, updateSellerProfileCache } from '../../lib/sellerAuth'
import { getUserFacingMessage } from '../../lib/userFacingError'
import {
  applySmsFailFromError,
  expiryMs,
  formatCountdown,
  getSmsCooldownUntil,
  smsFailUserMessage,
  useCountdown,
} from '../../register/utils'

function isValidEmail(value) {
  const email = value.trim()
  return email.includes('@') && email.split('@')[1]?.includes('.')
}

function CollapsibleSection({ title, open, onToggle, children }) {
  return (
    <SellerSection>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className={`flex w-full items-center justify-between rounded-2xl border border-brand-green/15 bg-brand-white px-4 py-3 text-left text-sm font-semibold text-brand-green touch-manipulation active:bg-brand-yellow/10 ${sellerFocusRing}`}
      >
        <span>{title}</span>
        <svg
          width="16"
          height="16"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden
          className={`shrink-0 text-brand-carmelita/70 transition-transform ${open ? 'rotate-180' : ''}`}
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </button>
      {open && children}
    </SellerSection>
  )
}

function OtpCodeField({ id, label, hint, value, onChange }) {
  return (
    <div className="mt-4">
      <label htmlFor={id} className={sellerLabel}>
        {label}
      </label>
      <input
        id={id}
        type="text"
        inputMode="numeric"
        autoComplete="one-time-code"
        value={value}
        onChange={(event) => onChange(event.target.value.replace(/\D/g, '').slice(0, 6))}
        className={`mt-1.5 ${sellerInputBare} tracking-[0.35em]`}
        placeholder="000000"
      />
      <p className={`mt-2 ${sellerHint}`}>{hint}</p>
    </div>
  )
}

export default function SellerAdvancedProfileSettings({ profile, onUpdated, embedded = false }) {
  const [phoneOpen, setPhoneOpen] = useState(false)
  const [emailOpen, setEmailOpen] = useState(false)
  const [storeNameOpen, setStoreNameOpen] = useState(false)

  const [phoneDigits, setPhoneDigits] = useState(() => phoneDigitsFromStored(profile?.phone))
  const [phoneLoading, setPhoneLoading] = useState(false)
  const [phoneError, setPhoneError] = useState('')
  const [phoneSaved, setPhoneSaved] = useState(false)
  const [phoneChallengeId, setPhoneChallengeId] = useState('')
  const [phoneCode, setPhoneCode] = useState('')
  const [phoneEndsAt, setPhoneEndsAt] = useState(0)
  const [smsCooldownEndsAt, setSmsCooldownEndsAt] = useState(0)

  const [email, setEmail] = useState(() => profile?.email || '')
  const [emailLoading, setEmailLoading] = useState(false)
  const [emailError, setEmailError] = useState('')
  const [emailSaved, setEmailSaved] = useState(false)
  const [emailChallengeId, setEmailChallengeId] = useState('')
  const [emailCode, setEmailCode] = useState('')
  const [emailEndsAt, setEmailEndsAt] = useState(0)

  const [storeName, setStoreName] = useState(() => profile?.store_name || '')
  const [storeNameLoading, setStoreNameLoading] = useState(false)
  const [storeNameError, setStoreNameError] = useState('')
  const [storeNameSaved, setStoreNameSaved] = useState(false)

  const storedDigits = useMemo(() => phoneDigitsFromStored(profile?.phone), [profile?.phone])
  const storedEmail = useMemo(() => (profile?.email || '').trim().toLowerCase(), [profile?.email])
  const storedStoreName = useMemo(() => profile?.store_name || '', [profile?.store_name])

  const phoneRemaining = useCountdown(phoneEndsAt)
  const smsCooldownRemaining = useCountdown(smsCooldownEndsAt)
  const emailRemaining = useCountdown(emailEndsAt)
  const phoneResendLocked = phoneRemaining > 0 || smsCooldownRemaining > 0

  useEffect(() => {
    setPhoneDigits(storedDigits)
    setPhoneSaved(false)
    setPhoneChallengeId('')
    setPhoneCode('')
    setPhoneEndsAt(0)
    setSmsCooldownEndsAt(0)
  }, [storedDigits])

  useEffect(() => {
    setEmail(profile?.email || '')
    setEmailSaved(false)
    setEmailChallengeId('')
    setEmailCode('')
    setEmailEndsAt(0)
  }, [profile?.email])

  useEffect(() => {
    setStoreName(storedStoreName)
    setStoreNameSaved(false)
  }, [storedStoreName])

  const phoneHasChanges = phoneDigits !== storedDigits
  const canSendPhone =
    phoneHasChanges && phoneDigits.length === PHONE_DIGITS_LENGTH && !phoneLoading && !phoneChallengeId
  const canConfirmPhone =
    Boolean(phoneChallengeId) && phoneCode.length >= 4 && !phoneLoading

  const normalizedEmail = email.trim().toLowerCase()
  const emailHasChanges = normalizedEmail !== storedEmail
  const canSendEmail =
    emailHasChanges && isValidEmail(email) && !emailLoading && !emailChallengeId
  const canConfirmEmail = Boolean(emailChallengeId) && emailCode.length >= 4 && !emailLoading

  const normalizedStoreName = storeName.trim()
  const storeNameHasChanges =
    normalizedStoreName.toLowerCase() !== storedStoreName.toLowerCase()
  const canSaveStoreName =
    storeNameHasChanges && normalizedStoreName.length > 0 && !storeNameLoading

  function resetPhoneChallenge() {
    setPhoneChallengeId('')
    setPhoneCode('')
    setPhoneEndsAt(0)
  }

  function resetEmailChallenge() {
    setEmailChallengeId('')
    setEmailCode('')
    setEmailEndsAt(0)
  }

  async function handlePhoneSend(event) {
    event.preventDefault()
    setPhoneError('')
    setPhoneSaved(false)

    if (phoneDigits.length !== PHONE_DIGITS_LENGTH) {
      setPhoneError('Indica un teléfono cubano de 8 dígitos.')
      return
    }

    const cooldownUntil = getSmsCooldownUntil(phoneDigits)
    if (cooldownUntil > Date.now()) {
      setSmsCooldownEndsAt(cooldownUntil)
      setPhoneError(smsFailUserMessage(cooldownUntil - Date.now()))
      return
    }

    setPhoneLoading(true)
    try {
      const token = getSellerToken()
      const result = await startSellerPhoneOtp(token, phoneDigits)
      setPhoneChallengeId(result.challenge_id)
      setPhoneEndsAt(expiryMs(result.expires_at))
    } catch (err) {
      const until = applySmsFailFromError(err, phoneDigits)
      if (until) {
        setSmsCooldownEndsAt(until)
        setPhoneError(smsFailUserMessage(until - Date.now()))
      } else {
        setPhoneError(getUserFacingMessage(err, 'No pudimos enviar el código al teléfono.'))
      }
    } finally {
      setPhoneLoading(false)
    }
  }

  async function handlePhoneResend() {
    if (!phoneChallengeId || phoneResendLocked) return
    setPhoneError('')
    setPhoneLoading(true)
    try {
      const token = getSellerToken()
      const result = await resendSellerContactOtp(token, phoneChallengeId)
      setPhoneEndsAt(expiryMs(result.expires_at))
    } catch (err) {
      const until = applySmsFailFromError(err, phoneDigits)
      if (until) {
        setSmsCooldownEndsAt(until)
        setPhoneError(smsFailUserMessage(until - Date.now()))
      } else {
        setPhoneError(getUserFacingMessage(err, 'No pudimos reenviar el código.'))
      }
    } finally {
      setPhoneLoading(false)
    }
  }

  async function handlePhoneConfirm(event) {
    event.preventDefault()
    if (!canConfirmPhone) return
    setPhoneError('')
    setPhoneSaved(false)
    setPhoneLoading(true)
    try {
      const token = getSellerToken()
      const updated = await confirmSellerContactOtp(token, phoneChallengeId, phoneCode)
      updateSellerProfileCache(updated)
      await onUpdated?.()
      resetPhoneChallenge()
      setPhoneSaved(true)
    } catch (err) {
      setPhoneError(getUserFacingMessage(err, 'No pudimos verificar el teléfono.'))
    } finally {
      setPhoneLoading(false)
    }
  }

  async function handleEmailSend(event) {
    event.preventDefault()
    setEmailError('')
    setEmailSaved(false)

    if (!isValidEmail(email)) {
      setEmailError('El correo no es válido.')
      return
    }

    setEmailLoading(true)
    try {
      const token = getSellerToken()
      const result = await startSellerEmailOtp(token, normalizedEmail)
      setEmailChallengeId(result.challenge_id)
      setEmailEndsAt(expiryMs(result.expires_at))
    } catch (err) {
      setEmailError(getUserFacingMessage(err, 'No pudimos enviar el código al correo.'))
    } finally {
      setEmailLoading(false)
    }
  }

  async function handleEmailResend() {
    if (!emailChallengeId || emailRemaining > 0) return
    setEmailError('')
    setEmailLoading(true)
    try {
      const token = getSellerToken()
      const result = await resendSellerContactOtp(token, emailChallengeId)
      setEmailEndsAt(expiryMs(result.expires_at))
    } catch (err) {
      setEmailError(getUserFacingMessage(err, 'No pudimos reenviar el código.'))
    } finally {
      setEmailLoading(false)
    }
  }

  async function handleEmailConfirm(event) {
    event.preventDefault()
    if (!canConfirmEmail) return
    setEmailError('')
    setEmailSaved(false)
    setEmailLoading(true)
    try {
      const token = getSellerToken()
      const updated = await confirmSellerContactOtp(token, emailChallengeId, emailCode)
      updateSellerProfileCache(updated)
      await onUpdated?.()
      resetEmailChallenge()
      setEmailSaved(true)
    } catch (err) {
      setEmailError(getUserFacingMessage(err, 'No pudimos verificar el correo.'))
    } finally {
      setEmailLoading(false)
    }
  }

  async function handleStoreNameSubmit(event) {
    event.preventDefault()
    setStoreNameError('')
    setStoreNameSaved(false)

    if (!normalizedStoreName) {
      setStoreNameError('Indica el nombre de tu negocio.')
      return
    }

    setStoreNameLoading(true)
    try {
      const token = getSellerToken()
      const updated = await updateSellerStoreName(token, normalizedStoreName)
      updateSellerProfileCache(updated)
      await onUpdated?.()
      setStoreNameSaved(true)
    } catch (err) {
      setStoreNameError(getUserFacingMessage(err, 'No pudimos actualizar el nombre.'))
    } finally {
      setStoreNameLoading(false)
    }
  }

  const body = (
    <>
      <CollapsibleSection
        title="Cambiar nombre del negocio"
        open={storeNameOpen}
        onToggle={() => setStoreNameOpen((current) => !current)}
      >
        <form
          onSubmit={handleStoreNameSubmit}
          className="mt-3 rounded-2xl border border-brand-green/12 bg-brand-green/[0.02] p-4"
        >
          <label htmlFor="seller-advanced-store-name" className={sellerLabel}>
            Nuevo nombre del negocio
          </label>
          <input
            id="seller-advanced-store-name"
            type="text"
            value={storeName}
            onChange={(event) => {
              setStoreName(event.target.value)
              setStoreNameError('')
              setStoreNameSaved(false)
            }}
            className={`mt-1.5 ${sellerInputBare}`}
            placeholder="Ej. Ferretería El Martillo"
            autoComplete="organization"
            maxLength={120}
          />
          <p className={`mt-2 ${sellerHint}`}>
            Actual: {profile?.store_name || '—'}. Usarás este nombre para iniciar sesión.
          </p>

          {storeNameError && (
            <p className={`mt-3 ${sellerAlertError}`} role="alert">
              {storeNameError}
            </p>
          )}

          {storeNameSaved && !storeNameError && (
            <p className="mt-3 text-center text-xs font-semibold text-brand-green sm:text-sm" role="status">
              Nombre actualizado.
            </p>
          )}

          <button type="submit" disabled={!canSaveStoreName} className={`mt-4 ${sellerBtnPrimary}`}>
            {storeNameLoading ? 'Guardando…' : 'Guardar nombre'}
          </button>
        </form>
      </CollapsibleSection>

      <CollapsibleSection
        title="Cambiar número de teléfono"
        open={phoneOpen}
        onToggle={() => setPhoneOpen((current) => !current)}
      >
        <form
          onSubmit={phoneChallengeId ? handlePhoneConfirm : handlePhoneSend}
          className="mt-3 rounded-2xl border border-brand-green/12 bg-brand-green/[0.02] p-4"
        >
          <label htmlFor="seller-advanced-phone" className={sellerLabel}>
            Nuevo teléfono
          </label>
          <div className={`mt-1.5 ${sellerInputPrefixWrap}`}>
            <span className={sellerInputPrefix}>{PHONE_PREFIX}</span>
            <input
              id="seller-advanced-phone"
              type="tel"
              inputMode="numeric"
              value={formatPhoneDigits(phoneDigits)}
              onChange={(event) => {
                setPhoneDigits(getPhoneDigits(event.target.value))
                setPhoneError('')
                setPhoneSaved(false)
                resetPhoneChallenge()
              }}
              className={sellerInputBare}
              placeholder="5 123 4567"
              autoComplete="tel-national"
            />
          </div>
          <p className={`mt-2 ${sellerHint}`}>
            Actual: {profile?.phone || '—'}. Enviaremos un SMS al número nuevo para verificarlo.
            Usarás este número para iniciar sesión.
          </p>

          {phoneChallengeId ? (
            <>
              <OtpCodeField
                id="seller-advanced-phone-code"
                label="Código SMS"
                hint={`Enviado a ${PHONE_PREFIX} ${formatPhoneDigits(phoneDigits)}.`}
                value={phoneCode}
                onChange={(value) => {
                  setPhoneCode(value)
                  setPhoneError('')
                }}
              />
              <button
                type="button"
                onClick={handlePhoneResend}
                disabled={phoneLoading || phoneResendLocked}
                className={`mt-3 ${sellerBtnSecondary}`}
              >
                {phoneLoading
                  ? 'Enviando…'
                  : smsCooldownRemaining > 0
                    ? `Reenviar SMS en ${formatCountdown(smsCooldownRemaining)}`
                    : phoneRemaining > 0
                      ? `Reenviar SMS en ${formatCountdown(phoneRemaining)}`
                      : 'Reenviar SMS'}
              </button>
            </>
          ) : null}

          {phoneError && (
            <p className={`mt-3 ${sellerAlertError}`} role="alert">
              {phoneError}
            </p>
          )}

          {phoneSaved && !phoneError && (
            <p className="mt-3 text-center text-xs font-semibold text-brand-green sm:text-sm" role="status">
              Teléfono actualizado.
            </p>
          )}

          <button
            type="submit"
            disabled={phoneChallengeId ? !canConfirmPhone : !canSendPhone}
            className={`mt-4 ${sellerBtnPrimary}`}
          >
            {phoneLoading
              ? phoneChallengeId
                ? 'Verificando…'
                : 'Enviando…'
              : phoneChallengeId
                ? 'Verificar y guardar'
                : 'Enviar código'}
          </button>
        </form>
      </CollapsibleSection>

      <CollapsibleSection
        title="Cambiar correo electrónico"
        open={emailOpen}
        onToggle={() => setEmailOpen((current) => !current)}
      >
        <form
          onSubmit={emailChallengeId ? handleEmailConfirm : handleEmailSend}
          className="mt-3 rounded-2xl border border-brand-green/12 bg-brand-green/[0.02] p-4"
        >
          <label htmlFor="seller-advanced-email" className={sellerLabel}>
            Nuevo correo
          </label>
          <input
            id="seller-advanced-email"
            type="email"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value)
              setEmailError('')
              setEmailSaved(false)
              resetEmailChallenge()
            }}
            className={`mt-1.5 ${sellerInputBare}`}
            placeholder="tucorreo@ejemplo.com"
            autoComplete="email"
          />
          <p className={`mt-2 ${sellerHint}`}>
            Actual: {profile?.email || '—'}. El código llega solo al correo nuevo, no por SMS.
          </p>

          {emailChallengeId ? (
            <>
              <OtpCodeField
                id="seller-advanced-email-code"
                label="Código del correo"
                hint={`Enviado a ${normalizedEmail}.`}
                value={emailCode}
                onChange={(value) => {
                  setEmailCode(value)
                  setEmailError('')
                }}
              />
              <button
                type="button"
                onClick={handleEmailResend}
                disabled={emailLoading || emailRemaining > 0}
                className={`mt-3 ${sellerBtnSecondary}`}
              >
                {emailLoading
                  ? 'Enviando…'
                  : emailRemaining > 0
                    ? `Reenviar correo en ${formatCountdown(emailRemaining)}`
                    : 'Reenviar correo'}
              </button>
            </>
          ) : null}

          {emailError && (
            <p className={`mt-3 ${sellerAlertError}`} role="alert">
              {emailError}
            </p>
          )}

          {emailSaved && !emailError && (
            <p className="mt-3 text-center text-xs font-semibold text-brand-green sm:text-sm" role="status">
              Correo actualizado.
            </p>
          )}

          <button
            type="submit"
            disabled={emailChallengeId ? !canConfirmEmail : !canSendEmail}
            className={`mt-4 ${sellerBtnPrimary}`}
          >
            {emailLoading
              ? emailChallengeId
                ? 'Verificando…'
                : 'Enviando…'
              : emailChallengeId
                ? 'Verificar y guardar'
                : 'Enviar código'}
          </button>
        </form>
      </CollapsibleSection>
    </>
  )

  if (embedded) {
    return <div className="flex flex-col gap-2.5 sm:gap-3">{body}</div>
  }

  return (
    <SellerProfileFieldGroup
      title="Configuración avanzada"
      description="Opciones sensibles de tu cuenta. Los cambios de teléfono y correo se confirman con un código."
    >
      {body}
    </SellerProfileFieldGroup>
  )
}

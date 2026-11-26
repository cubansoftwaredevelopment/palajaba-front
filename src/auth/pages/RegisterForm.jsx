import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import AuthHeader from '../componentes/AuthHeader.jsx'
import AuthShell from '../componentes/AuthShell.jsx'
import { authFormWrap, authPageIntro } from '../componentes/authStyles.js'
import PasswordField from '../componentes/PasswordField.jsx'
import PhoneField from '../componentes/PhoneField.jsx'
import RegisterProgress from '../componentes/RegisterProgress.jsx'
import { AcceptPlatformPrivacy, AcceptPlatformTerms } from '../../shared/componentes/PlatformTermsLink.jsx'
import Button from '../../shared/componentes/Button.jsx'
import { useFormErrorToast } from '../../shared/componentes/useFormErrorToast.jsx'
import {
  alertErrorClass,
  hintClass,
  inputClass,
  labelClass,
} from '../componentes/formStyles.js'
import { PHONE_DIGITS_LENGTH, getPhoneDigits } from '../../shared/utils/phone.js'
import { BILLING_UNIT_LABELS, normalizeBillingPeriod, normalizePlanTier, PLAN_TIERS } from '../../subscriptions/utils/constants.js'
import { confirmRegisterOtp, startRegisterOtp } from '../api.js'
import { setSellerSession } from '../../seller/utils/sellerAuth.js'
import { getRegisterSteps } from '../utils/constants.js'
import {
  applySmsFailFromError,
  formatCountdown,
  getActiveSmsCooldownPhone,
  getSmsCooldownUntil,
  smsFailUserMessage,
  useCountdown,
} from '../context/context.js'
import { getUserFacingMessage } from '../../shared/utils/userFacingError.js'

function RequiredLabel({ htmlFor, children }) {
  return (
    <label htmlFor={htmlFor} className={labelClass}>
      {children} <span className="text-brand-carmelita" aria-hidden="true">*</span>
    </label>
  )
}

function isValidEmail(value) {
  const email = value.trim()
  return email.includes('@') && email.split('@')[1]?.includes('.')
}

function validateForm({ storeName, email, phone, password, confirmPassword, acceptedTerms, acceptedPrivacy }) {
  if (!storeName.trim()) return 'El nombre de la tienda es obligatorio.'
  if (!acceptedTerms) return 'Debes aceptar los términos y condiciones.'
  if (!acceptedPrivacy) return 'Debes aceptar la política de privacidad.'
  if (!email.trim()) return 'El correo es obligatorio.'
  if (!isValidEmail(email)) return 'El correo no es válido.'
  const phoneDigits = getPhoneDigits(phone)
  if (!phoneDigits) return 'El número de teléfono es obligatorio.'
  if (phoneDigits.length !== PHONE_DIGITS_LENGTH) {
    return `Ingresa un número válido de ${PHONE_DIGITS_LENGTH} dígitos.`
  }
  if (!password) return 'La contraseña es obligatoria.'
  if (password.length < 6) return 'La contraseña debe tener al menos 6 caracteres.'
  if (!confirmPassword) return 'Debes confirmar tu contraseña.'
  if (password !== confirmPassword) return 'Las contraseñas no coinciden.'
  return null
}

export default function RegisterForm() {
  const navigate = useNavigate()
  const location = useLocation()
  const kind = (() => {
    if (location.state?.kind === 'trial') return 'trial'
    if (location.state?.kind === 'paid') return 'paid'
    if (location.state?.kind === 'custom') return 'custom'
    return 'account'
  })()
  const hasSelectedAccountPlan = kind === 'custom'
    ? Boolean(location.state?.qvapayPurchaseId)
    : kind !== 'account' || ['standard', 'pro', 'premium'].includes(location.state?.planTier)
  const billing = normalizeBillingPeriod(location.state?.billing)
  const planTier = kind === 'trial' ? 'standard' : normalizePlanTier(location.state?.planTier)
  const discountCode = kind === 'trial' || kind === 'account' ? null : location.state?.discountCode ?? null
  const discountPercent = kind === 'trial' || kind === 'account' ? null : location.state?.discountPercent ?? null

  const [storeName, setStoreName] = useState('')
  const [email, setEmail] = useState('')
  const [phoneDigits, setPhoneDigits] = useState(() => getActiveSmsCooldownPhone())
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false)
  const { showError, toastNode } = useFormErrorToast({ aboveNav: true })
  const [loading, setLoading] = useState(false)
  const [smsCooldownEndsAt, setSmsCooldownEndsAt] = useState(() => getSmsCooldownUntil(getActiveSmsCooldownPhone()))
  const smsCooldownRemaining = useCountdown(smsCooldownEndsAt)
  const canGoBack = location.key !== 'default'

  function goBack() {
    if (canGoBack) {
      navigate(-1)
      return
    }
    navigate('/registro/planes')
  }

  useEffect(() => {
    if ((kind === 'account' || kind === 'custom') && !hasSelectedAccountPlan) {
      navigate('/registro/planes', { replace: true })
    }
  }, [hasSelectedAccountPlan, kind, navigate])

  if ((kind === 'account' || kind === 'custom') && !hasSelectedAccountPlan) return null

  async function handleSubmit(e) {
    e.preventDefault()
    showError('')

    const validationError = validateForm({
      storeName,
      email,
      phone: phoneDigits,
      password,
      confirmPassword,
      acceptedTerms,
      acceptedPrivacy,
    })

    if (validationError) {
      showError(validationError)
      return
    }

    if (getSmsCooldownUntil(phoneDigits) > Date.now()) {
      const until = getSmsCooldownUntil(phoneDigits)
      setSmsCooldownEndsAt(until)
      showError(smsFailUserMessage(until - Date.now()))
      return
    }

    setLoading(true)

    try {
      try {
        sessionStorage.setItem('registerKind', kind)
      } catch {
        /* ignore */
      }
      const result = await startRegisterOtp({
        kind,
        store_name: storeName.trim(),
        email: email.trim().toLowerCase(),
        phone: phoneDigits,
        password,
        accepted_terms: true,
        billing_period: billing,
        plan_tier: planTier,
        ...(kind === 'account' || kind === 'custom' ? { qvapay_purchase_id: location.state?.qvapayPurchaseId } : {}),
        ...(discountCode ? { discount_code: discountCode } : {}),
      })

      if (result.otp_bypassed) {
        const confirmed = await confirmRegisterOtp({
          challenge_id: result.challenge_id,
          email_code: '000000',
          phone_code: '000000',
        })
        if (confirmed.access_token) {
          setSellerSession(confirmed.access_token, { id: confirmed.id })
          navigate('/tienda', { replace: true })
        } else if (kind === 'paid') {
          navigate('/registro/pago', {
            replace: true,
            state: { kind, planTier, billing, challengeId: result.challenge_id },
          })
        } else {
          navigate('/registro/exito', {
            replace: true,
            state: { kind: confirmed.kind || kind, message: confirmed.message },
          })
        }
        return
      }

      navigate('/registro/otp', {
        state: {
          kind,
          billing,
          planTier,
          qvapayPurchaseId: location.state?.qvapayPurchaseId,
          discountCode,
          discountPercent,
          challengeId: result.challenge_id,
          email: email.trim().toLowerCase(),
          phone: phoneDigits,
          message: result.message,
          emailExpiresAt: result.email_expires_at,
          phoneExpiresAt: result.phone_expires_at,
        },
      })
    } catch (err) {
      const cooldownUntil = applySmsFailFromError(err, phoneDigits)
      if (cooldownUntil) {
        setSmsCooldownEndsAt(cooldownUntil)
        showError(smsFailUserMessage(cooldownUntil - Date.now()))
      } else {
        showError(
          getUserFacingMessage(
            err,
            'No pudimos enviar los códigos. Revisa tus datos e inténtalo de nuevo.',
          ),
        )
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
    <AuthShell onBack={goBack} backLabel="Volver">
      <section className="animate-fade-in" aria-labelledby="register-form-title">
        <div className={authPageIntro}>
          <AuthHeader
            eyebrow="Paso 2 · Datos"
            title="Tu tienda"
            description={
              kind === 'account'
                ? `Plan ${PLAN_TIERS[planTier].name} · ${BILLING_UNIT_LABELS[billing]}. Completa tus datos para crear la cuenta de tu tienda.`
                : kind === 'trial'
                  ? 'Verificaremos tu correo y teléfono antes de activar la prueba.'
                  : 'Verificaremos tu correo y teléfono antes de pasar al pago del plan.'
            }
            layout="desktop-left"
          />
          <RegisterProgress currentStep={2} steps={getRegisterSteps(kind)} />
        </div>

        <form onSubmit={handleSubmit} className={`flex flex-col gap-3.5 ${authFormWrap}`} noValidate>
          <div>
            <RequiredLabel htmlFor="store-name">Nombre de la tienda</RequiredLabel>
            <input
              id="store-name"
              type="text"
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              className={inputClass}
              placeholder="Ej. Mi Tienda"
              autoComplete="organization"
              required
            />
            <p className={hintClass}>Podrás iniciar sesión con este nombre.</p>
          </div>

          <div>
            <RequiredLabel htmlFor="register-email">Correo</RequiredLabel>
            <input
              id="register-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
              placeholder="tucorreo@ejemplo.com"
              autoComplete="email"
              required
            />
            <p className={hintClass}>Te enviaremos un código de 6 dígitos a este correo.</p>
          </div>

          <PhoneField
            value={phoneDigits}
            onChange={(next) => {
              setPhoneDigits(next)
              setSmsCooldownEndsAt(getSmsCooldownUntil(next))
            }}
          />

          <PasswordField
            id="password"
            label="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
          />

          <PasswordField
            id="confirm-password"
            label="Confirmar contraseña"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
          />

          <AcceptPlatformTerms id="store-terms" checked={acceptedTerms} onChange={(event) => setAcceptedTerms(event.target.checked)} />
          <AcceptPlatformPrivacy id="store-privacy" checked={acceptedPrivacy} onChange={(event) => setAcceptedPrivacy(event.target.checked)} />

          {smsCooldownRemaining > 0 ? (
            <p className={alertErrorClass} role="alert">
              {smsFailUserMessage(smsCooldownRemaining)}
            </p>
          ) : null}

          <Button type="submit" className="mt-1" disabled={loading || smsCooldownRemaining > 0 || !acceptedTerms || !acceptedPrivacy}>
            {loading
              ? 'Enviando códigos…'
              : smsCooldownRemaining > 0
                ? `Espera ${formatCountdown(smsCooldownRemaining)}`
                : 'Enviar códigos'}
          </Button>
        </form>
      </section>
    </AuthShell>
    {toastNode}
    </>
  )
}

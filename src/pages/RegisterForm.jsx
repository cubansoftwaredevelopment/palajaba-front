import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import AuthHeader from '../components/auth/AuthHeader'
import AuthShell from '../components/auth/AuthShell'
import { authFormWrap, authPageIntro } from '../components/auth/authStyles'
import PasswordField from '../components/auth/PasswordField'
import PhoneField from '../components/auth/PhoneField'
import RegisterProgress from '../components/auth/RegisterProgress'
import Button from '../components/Button'
import {
  alertErrorClass,
  hintClass,
  inputClass,
  labelClass,
} from '../components/auth/formStyles'
import { PHONE_DIGITS_LENGTH, getPhoneDigits } from '../lib/phone'
import { normalizePlanTier } from '../constants/plan'
import { startRegisterOtp } from '../register/api'
import { getRegisterSteps } from '../register/constants'
import { getUserFacingMessage } from '../lib/userFacingError'

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

function validateForm({ kind, transferId, storeName, email, phone, password, confirmPassword }) {
  if (kind !== 'trial' && !transferId.trim()) return 'El ID de la transferencia es obligatorio.'
  if (!storeName.trim()) return 'El nombre de la tienda es obligatorio.'
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
    try {
      return sessionStorage.getItem('registerKind') === 'trial' ? 'trial' : 'paid'
    } catch {
      return 'paid'
    }
  })()
  const billing = location.state?.billing === 'yearly' ? 'yearly' : 'monthly'
  const planTier = kind === 'trial' ? 'standard' : normalizePlanTier(location.state?.planTier)
  const discountCode = kind === 'trial' ? null : location.state?.discountCode ?? null
  const discountPercent = kind === 'trial' ? null : location.state?.discountPercent ?? null

  const [transferId, setTransferId] = useState('')
  const [storeName, setStoreName] = useState('')
  const [email, setEmail] = useState('')
  const [phoneDigits, setPhoneDigits] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    const validationError = validateForm({
      kind,
      transferId,
      storeName,
      email,
      phone: phoneDigits,
      password,
      confirmPassword,
    })

    if (validationError) {
      setError(validationError)
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
        ...(kind === 'paid' ? { transfer_id: transferId.trim() } : {}),
        store_name: storeName.trim(),
        email: email.trim().toLowerCase(),
        phone: phoneDigits,
        password,
        billing_period: billing,
        plan_tier: planTier,
        ...(discountCode ? { discount_code: discountCode } : {}),
      })

      navigate('/registro/otp', {
        state: {
          kind,
          billing,
          planTier,
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
      setError(
        getUserFacingMessage(
          err,
          'No pudimos enviar los códigos. Revisa tus datos e inténtalo de nuevo.',
        ),
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell
      backTo={kind === 'trial' ? '/registro' : '/registro/pago'}
      backLabel={kind === 'trial' ? 'Plan' : 'Pago'}
    >
      <section className="animate-fade-in" aria-labelledby="register-form-title">
        <div className={authPageIntro}>
          <AuthHeader
            eyebrow={kind === 'trial' ? 'Paso 2 · Datos' : 'Paso 3 · Datos'}
            title="Tu tienda"
            description={
              kind === 'trial'
                ? 'Verificaremos tu correo y teléfono antes de activar la prueba.'
                : 'Verificaremos tu correo y teléfono antes de enviar la solicitud.'
            }
            layout="desktop-left"
          />
          <RegisterProgress currentStep={kind === 'trial' ? 2 : 3} steps={getRegisterSteps(kind)} />
        </div>

        <form onSubmit={handleSubmit} className={`flex flex-col gap-3.5 ${authFormWrap}`} noValidate>
          {kind === 'paid' ? (
            <div>
              <RequiredLabel htmlFor="transfer-id">ID de la transferencia</RequiredLabel>
              <input
                id="transfer-id"
                type="text"
                value={transferId}
                onChange={(e) => setTransferId(e.target.value)}
                className={inputClass}
                placeholder="Ej. 1234567890"
                autoComplete="off"
                required
              />
              <p className={hintClass}>
                Lo encuentras en el mensaje de confirmación del pago.
              </p>
            </div>
          ) : null}

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

          <PhoneField value={phoneDigits} onChange={setPhoneDigits} />

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

          {error && (
            <p className={alertErrorClass} role="alert">
              {error}
            </p>
          )}

          <Button type="submit" className="mt-1" disabled={loading}>
            {loading ? 'Enviando códigos…' : 'Enviar códigos'}
          </Button>
        </form>
      </section>
    </AuthShell>
  )
}

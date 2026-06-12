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
import { registerSeller } from '../lib/api'
import { getUserFacingMessage } from '../lib/userFacingError'

function RequiredLabel({ htmlFor, children }) {
  return (
    <label htmlFor={htmlFor} className={labelClass}>
      {children} <span className="text-brand-carmelita" aria-hidden="true">*</span>
    </label>
  )
}

function validateForm({ transferId, storeName, phone, password, confirmPassword }) {
  if (!transferId.trim()) return 'El ID de la transferencia es obligatorio.'
  if (!storeName.trim()) return 'El nombre de la tienda es obligatorio.'
  const phoneDigits = getPhoneDigits(phone)
  if (!phoneDigits) return 'El número de teléfono es obligatorio.'
  if (phoneDigits.length !== PHONE_DIGITS_LENGTH) {
    return `Ingresa un número válido de ${PHONE_DIGITS_LENGTH} dígitos.`
  }
  if (!password) return 'La contraseña es obligatoria.'
  if (!confirmPassword) return 'Debes confirmar tu contraseña.'
  if (password !== confirmPassword) return 'Las contraseñas no coinciden.'
  return null
}

export default function RegisterForm() {
  const navigate = useNavigate()
  const location = useLocation()
  const billing = location.state?.billing === 'yearly' ? 'yearly' : 'monthly'
  const planTier = normalizePlanTier(location.state?.planTier)

  const [transferId, setTransferId] = useState('')
  const [storeName, setStoreName] = useState('')
  const [phoneDigits, setPhoneDigits] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    const validationError = validateForm({
      transferId,
      storeName,
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
      await registerSeller({
        transfer_id: transferId.trim(),
        store_name: storeName.trim(),
        phone: phoneDigits,
        password,
        billing_period: billing,
        plan_tier: planTier,
      })
      navigate('/registro/exito')
    } catch (err) {
      setError(
        getUserFacingMessage(
          err,
          'No pudimos completar el registro. Revisa tus datos e inténtalo de nuevo.',
        ),
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell backTo="/registro/pago" backLabel="Pago">
      <section className="animate-fade-in" aria-labelledby="register-form-title">
        <div className={authPageIntro}>
          <AuthHeader
            eyebrow="Paso 3 · Datos"
            title="Tu tienda"
            description="Estos datos serán tu acceso cuando aprobemos tu pago."
            layout="desktop-left"
          />
          <RegisterProgress currentStep={3} />
        </div>

        <form onSubmit={handleSubmit} className={`flex flex-col gap-3.5 ${authFormWrap}`} noValidate>
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
            {loading ? 'Enviando solicitud…' : 'Enviar solicitud'}
          </Button>
        </form>
      </section>
    </AuthShell>
  )
}

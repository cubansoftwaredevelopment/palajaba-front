import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AuthHeader from '../components/auth/AuthHeader'
import AuthShell from '../components/auth/AuthShell'
import { authFormWrap, authPageIntro } from '../components/auth/authStyles'
import PasswordField from '../components/auth/PasswordField'
import PhoneField from '../components/auth/PhoneField'
import Button from '../components/Button'
import {
  alertErrorClass,
  hintClass,
  inputClass,
  labelClass,
} from '../components/auth/formStyles'
import { PHONE_DIGITS_LENGTH, getPhoneDigits } from '../lib/phone'
import { fetchLaunchPromoStatus, registerLaunchPromo } from '../lib/api'
import { getUserFacingMessage } from '../lib/userFacingError'

function RequiredLabel({ htmlFor, children }) {
  return (
    <label htmlFor={htmlFor} className={labelClass}>
      {children} <span className="text-brand-carmelita" aria-hidden="true">*</span>
    </label>
  )
}

function validateForm({ storeName, phone, password, confirmPassword }) {
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

export default function RegisterPromoForm() {
  const navigate = useNavigate()
  const [checkingPromo, setCheckingPromo] = useState(true)
  const [storeName, setStoreName] = useState('')
  const [phoneDigits, setPhoneDigits] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let mounted = true

    fetchLaunchPromoStatus()
      .then((data) => {
        if (!mounted) return
        if (!data?.available) {
          navigate('/registro', { replace: true })
        }
      })
      .catch(() => {
        if (!mounted) return
        navigate('/registro', { replace: true })
      })
      .finally(() => {
        if (mounted) setCheckingPromo(false)
      })

    return () => {
      mounted = false
    }
  }, [navigate])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    const validationError = validateForm({
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
      await registerLaunchPromo({
        store_name: storeName.trim(),
        phone: phoneDigits,
        password,
      })
      navigate('/registro/exito', { state: { launchPromo: true } })
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

  if (checkingPromo) {
    return (
      <AuthShell backTo="/registro" backLabel="Registro">
        <p className="py-16 text-center text-sm text-brand-carmelita/85">Verificando promoción…</p>
      </AuthShell>
    )
  }

  return (
    <AuthShell backTo="/registro" backLabel="Registro">
      <section className="animate-fade-in" aria-labelledby="promo-form-title">
        <div className={authPageIntro}>
          <AuthHeader
            eyebrow="Regalo de lanzamiento"
            title="Tu tienda Premium"
            description="Completa tus datos y entra de inmediato — sin ID de transferencia."
            layout="desktop-left"
          />
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
            {loading ? 'Creando tu cuenta…' : 'Crear cuenta Premium'}
          </Button>
        </form>
      </section>
    </AuthShell>
  )
}

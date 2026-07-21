import { useEffect, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import AuthCard from '../../components/auth/AuthCard'
import AuthHeader from '../../components/auth/AuthHeader'
import PasswordField from '../../components/auth/PasswordField'
import PhoneField from '../../components/auth/PhoneField'
import Button from '../../components/Button'
import GestorShell from '../../components/gestor/GestorShell'
import { alertErrorClass, hintClass } from '../../components/auth/formStyles'
import { gestorSetup } from '../../lib/api'
import {
  clearGestorSetup,
  getGestorSetup,
  gestorLoginPath,
  gestorPanelPath,
  setGestorSession,
} from '../../lib/gestorAuth'
import { PHONE_DIGITS_LENGTH } from '../../lib/phone'
import { getUserFacingMessage } from '../../lib/userFacingError'

export default function GestorSetup() {
  const { storeSlug } = useParams()
  const navigate = useNavigate()
  const slug = String(storeSlug ?? '').trim()
  const setup = getGestorSetup()

  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [phoneDigits, setPhoneDigits] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!setup?.setup_token) return undefined
    return undefined
  }, [setup])

  if (!setup?.setup_token) {
    return <Navigate to={gestorLoginPath(slug)} replace />
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.')
      return
    }
    if (password !== passwordConfirm) {
      setError('Las contraseñas no coinciden.')
      return
    }
    if (phoneDigits.length !== PHONE_DIGITS_LENGTH) {
      setError('El teléfono debe tener 8 dígitos.')
      return
    }

    setLoading(true)
    try {
      const data = await gestorSetup({
        setup_token: setup.setup_token,
        password,
        phone: phoneDigits,
      })

      if (!data.access_token || !data.gestor) {
        setError('No pudimos completar el registro. Inténtalo de nuevo.')
        return
      }

      clearGestorSetup()
      setGestorSession(data.access_token, data.gestor, {
        store_slug: slug || setup.store_slug,
        store_name: setup.store_name || slug,
      })
      navigate(gestorPanelPath(slug || setup.store_slug), { replace: true })
    } catch (err) {
      setError(
        getUserFacingMessage(
          err,
          'No pudimos guardar tus datos. El enlace puede haber expirado; vuelve a iniciar sesión.',
        ),
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <GestorShell backTo={gestorLoginPath(slug)} backLabel="Volver al login">
      <section className="animate-fade-in" aria-labelledby="gestor-setup-title">
        <AuthHeader
          eyebrow="Primer ingreso"
          title="Completa tu cuenta"
          description={
            setup.username
              ? `Hola @${setup.username}. Define tu contraseña y el teléfono de WhatsApp para tus pedidos.`
              : 'Define tu contraseña y el teléfono de WhatsApp para tus pedidos.'
          }
        />

        <AuthCard>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
            <PasswordField
              id="gestor-setup-password"
              label="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
            />
            <PasswordField
              id="gestor-setup-password-confirm"
              label="Confirmar contraseña"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              autoComplete="new-password"
            />
            <div>
              <PhoneField
                id="gestor-setup-phone"
                label="Teléfono WhatsApp"
                value={phoneDigits}
                onChange={setPhoneDigits}
              />
              <p className={hintClass}>Los clientes te escribirán a este número al pedir.</p>
            </div>

            {error ? (
              <p className={alertErrorClass} role="alert">
                {error}
              </p>
            ) : null}

            <Button type="submit" disabled={loading} className="mt-1">
              {loading ? 'Guardando…' : 'Guardar y entrar'}
            </Button>
          </form>
        </AuthCard>
      </section>
    </GestorShell>
  )
}

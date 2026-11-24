import { useEffect, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import AuthCard from '../../auth/componentes/AuthCard.jsx'
import AuthHeader from '../../auth/componentes/AuthHeader.jsx'
import PasswordField from '../../auth/componentes/PasswordField.jsx'
import PhoneField from '../../auth/componentes/PhoneField.jsx'
import Button from '../../shared/componentes/Button.jsx'
import GestorShell from '../componentes/GestorShell.jsx'
import { hintClass } from '../../auth/componentes/formStyles.js'
import { useFormErrorToast } from '../../shared/componentes/useFormErrorToast.jsx'
import { gestorSetup } from '../../gestor/api.js'
import {
  clearGestorSetup,
  getGestorSetup,
  gestorLoginPath,
  gestorPanelPath,
  setGestorSession,
} from '../utils/gestorAuth.js'
import { PHONE_DIGITS_LENGTH } from '../../shared/utils/phone.js'
import { getUserFacingMessage } from '../../shared/utils/userFacingError.js'

export default function GestorSetup() {
  const { storeSlug } = useParams()
  const navigate = useNavigate()
  const slug = String(storeSlug ?? '').trim()
  const setup = getGestorSetup()

  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [phoneDigits, setPhoneDigits] = useState('')
  const { showError, toastNode } = useFormErrorToast({ aboveNav: true })
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
    showError('')

    if (password.length < 6) {
      showError('La contraseña debe tener al menos 6 caracteres.')
      return
    }
    if (password !== passwordConfirm) {
      showError('Las contraseñas no coinciden.')
      return
    }
    if (phoneDigits.length !== PHONE_DIGITS_LENGTH) {
      showError('El teléfono debe tener 8 dígitos.')
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
        showError('No pudimos completar el registro. Inténtalo de nuevo.')
        return
      }

      clearGestorSetup()
      setGestorSession(data.access_token, data.gestor, {
        store_slug: slug || setup.store_slug,
        store_name: setup.store_name || slug,
      })
      navigate(gestorPanelPath(slug || setup.store_slug), { replace: true })
    } catch (err) {
      showError(
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
    <>
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

            <Button type="submit" disabled={loading} className="mt-1">
              {loading ? 'Guardando…' : 'Guardar y entrar'}
            </Button>
          </form>
        </AuthCard>
      </section>
    </GestorShell>
    {toastNode}
    </>
  )
}

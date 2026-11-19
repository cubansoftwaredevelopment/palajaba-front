import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import AuthCard from '../components/AuthCard'
import AuthHeader from '../components/AuthHeader'
import AuthShell from '../components/AuthShell'
import MethodTabs from '../components/MethodTabs'
import PhoneField from '../components/PhoneField'
import Button from '../../components/Button'
import { inputClass, labelClass } from '../components/formStyles'
import { useFormErrorToast } from '../../components/ui/useFormErrorToast'
import { confirmPasswordResetOtp, startPasswordReset } from '../api.js'
import { getUserFacingMessage } from '../../lib/userFacingError'

const METHODS = [
  { id: 'phone', label: 'Teléfono' },
  { id: 'store_name', label: 'Tienda' },
]

export default function ForgotPassword() {
  const navigate = useNavigate()
  const location = useLocation()
  const canGoBack = location.key !== 'default'
  const [method, setMethod] = useState('phone')
  const [phoneDigits, setPhoneDigits] = useState('')
  const [storeName, setStoreName] = useState('')
  const [loading, setLoading] = useState(false)
  const { showError, toastNode } = useFormErrorToast()

  async function handleSubmit(event) {
    event.preventDefault()
    showError('')
    setLoading(true)
    try {
      const payload =
        method === 'phone'
          ? { method: 'phone', phone: phoneDigits }
          : { method: 'store_name', store_name: storeName.trim() }
      const result = await startPasswordReset(payload)
      if (result.otp_bypassed) {
        const confirmed = await confirmPasswordResetOtp({
          challenge_id: result.challenge_id,
          email_code: '000000',
          phone_code: '000000',
        })
        navigate('/recuperar/nueva', {
          replace: true,
          state: { challengeId: result.challenge_id, message: confirmed.message },
        })
        return
      }
      navigate('/recuperar/codigo', {
        replace: true,
        state: {
          challengeId: result.challenge_id,
          emailHint: result.email_hint,
          phoneHint: result.phone_hint,
          emailExpiresAt: result.email_expires_at,
          phoneExpiresAt: result.phone_expires_at,
          phone: method === 'phone' ? phoneDigits : '',
          message: result.message,
        },
      })
    } catch (err) {
      showError(
        getUserFacingMessage(
          err,
          'No pudimos enviar los códigos. Revisa los datos e inténtalo de nuevo.',
        ),
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
    <AuthShell
      onBack={() => {
        if (canGoBack) navigate(-1)
        else navigate('/')
      }}
      backLabel={canGoBack ? 'Volver' : 'Inicio'}
      contentWidth="narrow"
    >
      <section className="animate-fade-in lg:mx-auto lg:max-w-md" aria-labelledby="forgot-title">
        <AuthHeader
          eyebrow="Recuperar acceso"
          title="¿Olvidaste tu contraseña?"
          description="Indica el teléfono o el nombre de tu tienda. Te enviaremos un código al correo y otro por SMS."
        />

        <AuthCard>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
            <MethodTabs
              options={METHODS}
              value={method}
              onChange={setMethod}
              ariaLabel="Cómo identificar tu cuenta"
            />

            {method === 'phone' ? (
              <PhoneField id="reset-phone" value={phoneDigits} onChange={setPhoneDigits} />
            ) : (
              <div>
                <label htmlFor="reset-store" className={labelClass}>
                  Nombre de la tienda <span className="text-brand-carmelita">*</span>
                </label>
                <input
                  id="reset-store"
                  type="text"
                  value={storeName}
                  onChange={(event) => setStoreName(event.target.value)}
                  className={inputClass}
                  placeholder="Ej. Mi Tienda"
                  autoComplete="organization"
                  required
                />
              </div>
            )}

            <Button type="submit" disabled={loading} className="mt-1">
              {loading ? 'Enviando códigos…' : 'Enviar códigos'}
            </Button>
          </form>
        </AuthCard>

        <p className="mt-6 text-center text-sm text-brand-carmelita/90">
          ¿La recuerdas?{' '}
          <Link
            to="/login"
            className="font-semibold text-brand-green underline-offset-2 hover:underline"
          >
            Inicia sesión
          </Link>
        </p>
      </section>
    </AuthShell>
    {toastNode}
    </>
  )
}

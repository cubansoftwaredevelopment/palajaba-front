import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import AuthCard from '../components/auth/AuthCard'
import AuthHeader from '../components/auth/AuthHeader'
import AuthShell from '../components/auth/AuthShell'
import MethodTabs from '../components/auth/MethodTabs'
import PasswordField from '../components/auth/PasswordField'
import PhoneField from '../components/auth/PhoneField'
import Button from '../components/Button'
import SubscriptionExpiredScreen from '../components/seller/SubscriptionExpiredScreen'
import { alertErrorClass, inputClass, labelClass } from '../components/auth/formStyles'
import { ApiError, sellerLogin } from '../lib/api'
import { isSellerAuthenticated, setSellerSession } from '../lib/sellerAuth'
import { getUserFacingMessage } from '../lib/userFacingError'
const LOGIN_METHODS = [
  { id: 'phone', label: 'Teléfono' },
  { id: 'store_name', label: 'Tienda' },
]

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const redirectTo = location.state?.from ?? '/tienda'
  const [method, setMethod] = useState('phone')
  const [phoneDigits, setPhoneDigits] = useState('')
  const [storeName, setStoreName] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [expiredInfo, setExpiredInfo] = useState(null)

  useEffect(() => {
    if (isSellerAuthenticated()) {
      navigate(redirectTo, { replace: true })
    }
  }, [navigate, redirectTo])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setExpiredInfo(null)
    setLoading(true)

    try {
      const payload = {
        method,
        password,
        ...(method === 'phone'
          ? { phone: phoneDigits }
          : { store_name: storeName.trim() }),
      }
      const data = await sellerLogin(payload)
      setSellerSession(data.access_token, data.seller)
      navigate(redirectTo, { replace: true })
    } catch (err) {
      if (err instanceof ApiError && err.code === 'subscription_expired') {
        setExpiredInfo(err.data)
        return
      }
      setError(
        getUserFacingMessage(
          err,
          'No pudimos iniciar sesión. Revisa tus datos e inténtalo de nuevo.',
        ),
      )
    } finally {
      setLoading(false)
    }
  }

  if (expiredInfo) {
    return (
      <SubscriptionExpiredScreen
        storeName={expiredInfo.store_name}
        subscriptionEndsAt={expiredInfo.subscription_ends_at}
        renewalContactPhone={expiredInfo.renewal_contact_phone}
        onBack={() => setExpiredInfo(null)}
      />
    )
  }

  return (
    <AuthShell backTo="/" backLabel="Inicio" contentWidth="narrow">
      <section className="animate-fade-in lg:mx-auto lg:max-w-md" aria-labelledby="login-title">
        <AuthHeader
          eyebrow="Vendedores"
          title="Inicia sesión"
          description="Accede con tu teléfono o el nombre de tu tienda y tu contraseña."
        />

        <AuthCard>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
            <MethodTabs
              options={LOGIN_METHODS}
              value={method}
              onChange={setMethod}
              ariaLabel="Método de inicio de sesión"
            />

            {method === 'phone' ? (
              <PhoneField
                id="login-phone"
                value={phoneDigits}
                onChange={setPhoneDigits}
              />
            ) : (
              <div>
                <label htmlFor="login-store" className={labelClass}>
                  Nombre de la tienda <span className="text-brand-carmelita">*</span>
                </label>
                <input
                  id="login-store"
                  type="text"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  className={inputClass}
                  placeholder="Ej. Mi Tienda"
                  autoComplete="organization"
                  required
                />
              </div>
            )}

            <PasswordField
              id="login-password"
              label="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            {error && (
              <p className={alertErrorClass} role="alert">
                {error}
              </p>
            )}

            <Button type="submit" disabled={loading} className="mt-1">
              {loading ? 'Entrando…' : 'Entrar'}
            </Button>
          </form>
        </AuthCard>

        <p className="mt-6 text-center text-sm text-brand-carmelita/90">
          ¿Aún no tienes cuenta?{' '}
          <Link
            to="/registro"
            className="font-semibold text-brand-green underline-offset-2 hover:underline"
          >
            Crear cuenta
          </Link>
        </p>
      </section>
    </AuthShell>
  )
}

import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import AuthCard from '../components/AuthCard'
import AuthHeader from '../components/AuthHeader'
import AuthShell from '../components/AuthShell'
import MethodTabs from '../components/MethodTabs'
import PasswordField from '../components/PasswordField'
import Button from '../../components/Button'
import { alertErrorClass, inputClass, labelClass } from '../components/formStyles'
import { authLoginContainer } from '../components/authStyles'
import { ApiError } from '../../lib/api'
import { adminLogin, sellerLogin } from '../api.js'
import { addCustomerFavorite, customerLogin } from '../../buyer/api.js'
import { setAdminToken } from '../../lib/adminAuth'
import { setSellerSession } from '../../lib/sellerAuth'
import { setCustomerSession, updateCustomerProfile } from '../../lib/customerAuth'
import { requestAppReleasePromptOnLogin } from '../../appReleases/lib/prompt.js'
import { resolveBuyerEntryPath } from '../../lib/buyerLocation'
import { getUserFacingMessage } from '../../lib/userFacingError'

const ACCOUNT_TYPES = [
  { id: 'store', label: 'Tienda' },
  { id: 'customer', label: 'Cliente' },
]

function loginBackTarget(state) {
  const backTo = state?.backTo
  if (
    typeof backTo !== 'string' ||
    !backTo.startsWith('/') ||
    backTo.startsWith('//') ||
    backTo.startsWith('/login')
  ) {
    return { backTo: '/', backLabel: 'Inicio' }
  }
  return { backTo, backLabel: 'Volver' }
}

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const { backTo, backLabel } = loginBackTarget(location.state)
  const [accountType, setAccountType] = useState(location.state?.accountType === 'customer' ? 'customer' : 'store')
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const notice = typeof location.state?.notice === 'string' ? location.state.notice : ''

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (accountType === 'customer') {
        const data = await customerLogin(identifier.trim(), password)
        setCustomerSession(data.access_token, data.customer)
        requestAppReleasePromptOnLogin()
        try {
          const favoriteId = sessionStorage.getItem('pala_jaba_pending_favorite')
          if (favoriteId) {
            updateCustomerProfile(await addCustomerFavorite(data.access_token, favoriteId))
            sessionStorage.removeItem('pala_jaba_pending_favorite')
          }
        } catch { /* account sign-in succeeds even if saving a favorite temporarily fails */ }
        navigate(resolveBuyerEntryPath(), { replace: true })
      } else {
        const normalizedIdentifier = identifier.trim()
        const phoneDigits = normalizedIdentifier.replace(/\D/g, '')
        const isPhone = /^[+\d()\s-]+$/.test(normalizedIdentifier) && [8, 10].includes(phoneDigits.length)
        const payload = isPhone
          ? { method: 'phone', phone: phoneDigits.slice(-8), password }
          : { method: 'store_name', store_name: normalizedIdentifier, password }
        const data = await sellerLogin(payload)
        setSellerSession(data.access_token, data.seller)
        requestAppReleasePromptOnLogin()
        navigate('/tienda', { replace: true })
      }
    } catch (err) {
      if (accountType === 'store' && err instanceof ApiError && err.status === 401) {
        try {
          const admin = await adminLogin(identifier.trim(), password)
          setAdminToken(admin.access_token)
          navigate('/admin/estadisticas', { replace: true })
          return
        } catch {
          // Las credenciales tampoco son de administrador.
        }
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

  return (
    <AuthShell backTo={backTo} backLabel={backLabel} contentWidth="narrow">
      <section className={`animate-fade-in lg:mx-auto ${authLoginContainer}`} aria-labelledby="login-title">
        <AuthHeader
          eyebrow={accountType === 'customer' ? 'Clientes' : 'Pa’ La Jaba · cuentas'}
          title="Inicia sesión"
          description={accountType === 'customer'
            ? 'Accede con tu teléfono y tu contraseña.'
            : 'Accede con el nombre de tu tienda o tu teléfono y tu contraseña.'}
        />

        <AuthCard>
          {notice ? (
            <p className="mb-4 rounded-xl border border-brand-yellow/30 bg-brand-yellow/10 px-3.5 py-2.5 text-sm text-brand-green">
              {notice}
            </p>
          ) : null}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
            <MethodTabs
              options={ACCOUNT_TYPES}
              value={accountType}
              onChange={(next) => { setAccountType(next); setError('') }}
              ariaLabel="Tipo de cuenta"
            />
            {accountType === 'customer' ? (
              <div>
                <label htmlFor="login-customer-identifier" className={labelClass}>
                  Teléfono <span className="text-brand-carmelita">*</span>
                </label>
                <input
                  id="login-customer-identifier"
                  type="tel"
                  value={identifier}
                  onChange={(event) => setIdentifier(event.target.value)}
                  className={inputClass}
                  placeholder="Tu número de teléfono"
                  autoComplete="tel"
                  required
                />
              </div>
            ) : (
              <div>
                <label htmlFor="login-store-identifier" className={labelClass}>
                  Nombre de la tienda o teléfono <span className="text-brand-carmelita">*</span>
                </label>
                <input
                  id="login-store-identifier"
                  type="text"
                  value={identifier}
                  onChange={(event) => setIdentifier(event.target.value)}
                  className={inputClass}
                  placeholder="Nombre de la tienda o número de teléfono"
                  autoComplete="username"
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

            <p className="-mt-1 text-right text-sm">
              <Link
                to={accountType === 'customer' ? '/cliente/recuperar' : '/recuperar'}
                className="font-semibold text-brand-green underline-offset-2 hover:underline"
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </p>

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
            to="/crear-cuenta"
            state={{ backTo: location.state?.backTo || '/login' }}
            className="font-semibold text-brand-green underline-offset-2 hover:underline"
          >
            Crear cuenta
          </Link>
        </p>
      </section>
    </AuthShell>
  )
}

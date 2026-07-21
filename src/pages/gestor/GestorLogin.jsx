import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import AuthCard from '../../components/auth/AuthCard'
import AuthHeader from '../../components/auth/AuthHeader'
import PasswordField from '../../components/auth/PasswordField'
import Button from '../../components/Button'
import GestorShell from '../../components/gestor/GestorShell'
import { alertErrorClass, hintClass, inputClass, labelClass } from '../../components/auth/formStyles'
import { fetchMarketplaceStore, gestorLogin } from '../../lib/api'
import {
  gestorPanelPath,
  gestorSetupPath,
  isGestorAuthenticated,
  setGestorSession,
  setGestorSetup,
} from '../../lib/gestorAuth'
import { validateGestorUsername } from '../../lib/sellerGestores'
import { getUserFacingMessage } from '../../lib/userFacingError'

export default function GestorLogin() {
  const { storeSlug } = useParams()
  const navigate = useNavigate()
  const slug = String(storeSlug ?? '').trim()

  const [storeName, setStoreName] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isGestorAuthenticated()) {
      navigate(gestorPanelPath(slug), { replace: true })
    }
  }, [navigate, slug])

  useEffect(() => {
    if (!slug) return undefined
    let cancelled = false
    fetchMarketplaceStore(slug)
      .then((store) => {
        if (!cancelled) setStoreName(store.store_name || slug)
      })
      .catch(() => {
        if (!cancelled) setStoreName(slug)
      })
    return () => {
      cancelled = true
    }
  }, [slug])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    const validated = validateGestorUsername(username)
    if (!validated.ok) {
      setError(validated.message)
      return
    }

    setLoading(true)
    try {
      const data = await gestorLogin({
        store_name: slug || storeName,
        username: validated.username,
        password: password.trim() || undefined,
      })

      if (data.requires_setup) {
        const setup = data.requires_setup
        setGestorSetup({
          setup_token: setup.setup_token,
          username: setup.username,
          store_name: setup.store_name,
          store_slug: slug,
        })
        navigate(gestorSetupPath(slug), { replace: true })
        return
      }

      if (!data.access_token || !data.gestor) {
        setError('No pudimos iniciar sesión. Inténtalo de nuevo.')
        return
      }

      setGestorSession(data.access_token, data.gestor, {
        store_slug: slug,
        store_name: storeName || data.requires_setup?.store_name || slug,
      })
      navigate(gestorPanelPath(slug), { replace: true })
    } catch (err) {
      setError(
        getUserFacingMessage(err, 'No pudimos iniciar sesión. Revisa tus datos e inténtalo de nuevo.'),
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <GestorShell backTo="/" backLabel="Inicio">
      <section className="animate-fade-in" aria-labelledby="gestor-login-title">
        <AuthHeader
          eyebrow="Gestores de venta"
          title="Inicia sesión"
          description={
            storeName
              ? `Accede a tu panel para ${storeName}.`
              : 'Accede a tu panel de gestor de venta.'
          }
        />

        <AuthCard>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
            <div>
              <label htmlFor="gestor-login-username" className={labelClass}>
                Usuario <span className="text-brand-carmelita">*</span>
              </label>
              <input
                id="gestor-login-username"
                type="text"
                autoComplete="username"
                spellCheck={false}
                maxLength={32}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className={inputClass}
                placeholder="tu_usuario"
                required
              />
              <p className={hintClass}>Solo minúsculas, números, _ y -.</p>
            </div>

            <div>
              <PasswordField
                id="gestor-login-password"
                label="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required={false}
                autoComplete="current-password"
              />
              <p className={hintClass}>Si es tu primer ingreso, déjala vacía.</p>
            </div>

            {error ? (
              <p className={alertErrorClass} role="alert">
                {error}
              </p>
            ) : null}

            <Button type="submit" disabled={loading} className="mt-1">
              {loading ? 'Entrando…' : 'Entrar'}
            </Button>
          </form>
        </AuthCard>
      </section>
    </GestorShell>
  )
}

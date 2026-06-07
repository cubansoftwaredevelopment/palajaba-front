import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import AdminButton from '../components/admin/AdminButton'
import {
  adminAlertError,
  adminInput,
  adminLabel,
  adminSubtle,
} from '../components/admin/adminStyles'
import Logo from '../components/Logo'
import { LOGO_HERO_CLASS } from '../constants/branding'
import { adminLogin } from '../lib/api'
import { setAdminToken } from '../lib/adminAuth'

export default function AdminLogin() {
  const navigate = useNavigate()
  const location = useLocation()
  const redirectTo = location.state?.from ?? '/admin/estadisticas'

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const data = await adminLogin(username, password)
      setAdminToken(data.access_token)
      navigate(redirectTo, { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="admin-theme flex min-h-dvh flex-col items-center justify-center bg-black px-5 py-10 text-zinc-100">
      <section className="relative z-10 w-full max-w-md animate-fade-in">
        <header className="mb-10 flex flex-col items-center text-center">
          <h1 className="sr-only">Panel de administración — Pa&apos; La Jaba</h1>
          <Logo
            variant="admin"
            priority
            className={`mb-6 ${LOGO_HERO_CLASS}`}
          />
          <p className={`max-w-xs text-sm ${adminSubtle}`}>
            Estadísticas, solicitudes, avisos y suscripciones.
          </p>
        </header>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-6 backdrop-blur-sm">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
            <div>
              <label htmlFor="admin-username" className={adminLabel}>
                Usuario
              </label>
              <input
                id="admin-username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className={adminInput}
                autoComplete="username"
                required
              />
            </div>

            <div>
              <label htmlFor="admin-password" className={adminLabel}>
                Contraseña
              </label>
              <input
                id="admin-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={adminInput}
                autoComplete="current-password"
                required
              />
            </div>

            {error && (
              <p className={adminAlertError} role="alert">
                {error}
              </p>
            )}

            <AdminButton type="submit" disabled={loading} className="mt-2">
              {loading ? 'Entrando…' : 'Entrar'}
            </AdminButton>
          </form>
        </div>
      </section>
    </main>
  )
}

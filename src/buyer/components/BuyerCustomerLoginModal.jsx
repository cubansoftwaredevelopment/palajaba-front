import { useState } from 'react'
import { Link } from 'react-router-dom'
import { customerLogin } from '../api.js'
import { setCustomerSession } from '../../lib/customerAuth'
import { isSellerAuthenticated } from '../../lib/sellerAuth'
import { getUserFacingMessage } from '../../lib/userFacingError'
import PasswordField from '../../auth/components/PasswordField'
import { alertErrorClass, inputClass, labelClass } from '../../auth/components/formStyles'
import { authLoginContainer } from '../../auth/components/authStyles'

export default function BuyerCustomerLoginModal({ onClose, onLogin }) {
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(event) {
    event.preventDefault()
    setLoading(true)
    setError('')
    try {
      const data = await customerLogin(phone.trim(), password)
      setCustomerSession(data.access_token, data.customer)
      onLogin(data.customer)
    } catch (cause) {
      setError(getUserFacingMessage(cause, 'No pudimos iniciar sesión. Revisa tus datos.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-brand-carmelita/55 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <section role="dialog" aria-modal="true" aria-labelledby="buyer-login-title" className={`${authLoginContainer} rounded-3xl bg-brand-white p-5 shadow-2xl sm:p-7`}>
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-brand-green">Cuenta de cliente</p>
            <h2 id="buyer-login-title" className="mt-1 font-display text-2xl font-bold text-brand-carmelita">Inicia sesión para comprar</h2>
            <p className="mt-2 text-sm text-brand-carmelita/75">
              {isSellerAuthenticated()
                ? 'La cuenta de la tienda no puede comprar. Entra con una cuenta de cliente.'
                : 'Tu pedido quedará guardado en tu historial.'}
            </p>
          </div>
          <button type="button" onClick={onClose} className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-xl text-brand-carmelita/70 hover:bg-brand-green/8" aria-label="Cerrar">×</button>
        </div>
        <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
          <div>
            <label htmlFor="buyer-login-phone" className={labelClass}>Teléfono <span className="text-brand-carmelita">*</span></label>
            <input id="buyer-login-phone" type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} className={inputClass} autoComplete="tel" placeholder="Tu número de teléfono" required />
          </div>
          <PasswordField id="buyer-login-password" label="Contraseña" value={password} onChange={(event) => setPassword(event.target.value)} />
          {error ? <p className={alertErrorClass} role="alert">{error}</p> : null}
          <button type="submit" disabled={loading} className="min-h-12 rounded-xl bg-brand-green px-4 font-bold text-white disabled:opacity-60">{loading ? 'Entrando…' : 'Entrar y continuar'}</button>
        </form>
        <p className="mt-4 text-center text-sm text-brand-carmelita/80">¿Aún no tienes cuenta?{' '}
          <Link to="/crear-cuenta" state={{ backTo: `${window.location.pathname}${window.location.search}${window.location.hash}` }} className="font-bold text-brand-green underline">Crear cuenta</Link>
        </p>
      </section>
    </div>
  )
}

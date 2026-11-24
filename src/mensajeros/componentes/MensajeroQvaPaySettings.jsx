import { useEffect, useState } from 'react'
import { sellerBtnDanger, sellerBtnPrimary, sellerInput, sellerLabel } from '../../seller/componentes/sellerStyles.js'
import { deleteMensajeroQvapay, saveMensajeroQvapay } from '../api'
import { updateMensajeroProfile } from '../utils/session.js'

export default function MensajeroQvaPaySettings({ profile, onChange }) {
  const [username, setUsername] = useState(profile.qvapay_username || '')
  const [savedUsername, setSavedUsername] = useState(profile.qvapay_username || '')
  const [verified, setVerified] = useState(Boolean(profile.qvapay_verified))
  const [verificationUnavailable, setVerificationUnavailable] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    setUsername(profile.qvapay_username || '')
    setSavedUsername(profile.qvapay_username || '')
    setVerified(Boolean(profile.qvapay_verified))
  }, [profile.qvapay_username, profile.qvapay_verified])

  function apply(next) {
    updateMensajeroProfile(next)
    onChange(next)
    setUsername(next.qvapay_username || '')
    setSavedUsername(next.qvapay_username || '')
    setVerified(Boolean(next.qvapay_verified))
  }

  async function save(event, skipVerification = false) {
    event?.preventDefault()
    setSaving(true)
    setError('')
    setMessage('')
    setVerificationUnavailable(false)
    try {
      const next = await saveMensajeroQvapay(username.trim(), { skipVerification })
      apply(next)
      setMessage(next.qvapay_verified
        ? 'Tu cuenta QvaPay fue verificada y guardada.'
        : 'Guardamos el usuario sin verificar. La verificación falló por un problema temporal de nuestro lado; puedes volver a intentarlo más tarde.')
    } catch (cause) {
      const serviceUnavailable = cause?.status >= 500 || cause?.code === 'network_error'
      setVerificationUnavailable(serviceUnavailable)
      setError(serviceUnavailable
        ? 'No pudimos verificar el usuario por un problema temporal de nuestro lado.'
        : cause?.message || 'No pudimos verificar esa cuenta QvaPay.')
    } finally {
      setSaving(false)
    }
  }

  async function remove() {
    setSaving(true)
    setError('')
    setMessage('')
    try {
      const next = await deleteMensajeroQvapay()
      apply(next)
      setVerificationUnavailable(false)
      setMessage('Cuenta QvaPay eliminada.')
    } catch (cause) {
      setError(cause?.message || 'No pudimos eliminar la cuenta.')
    } finally {
      setSaving(false)
    }
  }

  const sameSaved = username.trim().toLowerCase() === savedUsername.toLowerCase()

  return (
    <section className="rounded-2xl border border-brand-green/12 bg-brand-white p-3">
      <h2 className="font-display text-xl font-bold text-brand-green">Cuenta QvaPay</h2>
      <p className="mt-1 text-sm text-brand-carmelita/80">Verificaremos que el usuario exista antes de habilitar los pagos y las devoluciones.</p>
      <form onSubmit={save} className="mt-4 flex flex-col gap-3">
        <label htmlFor="mensajero-qvapay-username" className={sellerLabel}>Usuario QvaPay
          <input id="mensajero-qvapay-username" value={username} onChange={(event) => setUsername(event.target.value)} placeholder="Tu usuario de QvaPay" autoComplete="off" disabled={saving} className={`${sellerInput} mt-1`} />
        </label>
        {error ? <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
        {message ? <p role="status" className="rounded-xl bg-brand-green/10 p-3 text-sm text-brand-green">{message}</p> : null}
        {verificationUnavailable ? (
          <div className="rounded-xl border border-brand-green/15 bg-brand-green/5 p-3">
            <p className="text-sm leading-relaxed text-brand-carmelita">La verificación de QvaPay no está disponible ahora. Puedes guardar el usuario de todas formas; el problema está de nuestro lado.</p>
            <button type="button" onClick={() => { void save(null, true) }} disabled={saving || !username.trim()} className={`${sellerBtnPrimary} mt-3 min-h-11`}>
              Guardar de todas formas
            </button>
          </div>
        ) : null}
        <div className="grid grid-cols-2 gap-2">
          <button type="submit" disabled={saving || !username.trim() || (verified && sameSaved)} className={`${sellerBtnPrimary} min-h-11 px-3 text-sm ${savedUsername ? '!w-auto' : 'col-span-2'}`}>
            {saving ? 'Verificando…' : savedUsername && sameSaved && !verified ? 'Reintentar verificación' : savedUsername ? 'Actualizar usuario' : 'Verificar y guardar'}
          </button>
          {savedUsername ? <button type="button" onClick={remove} disabled={saving} className={`${sellerBtnDanger} min-h-11 !w-auto px-3 text-sm`}>Eliminar cuenta</button> : null}
        </div>
      </form>
    </section>
  )
}

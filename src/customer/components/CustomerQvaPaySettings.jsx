import { useEffect, useState } from 'react'
import { deleteCustomerQvaPayAccount, fetchCustomerProfile, fetchCustomerQvaPayAccount, saveCustomerQvaPayAccount } from '../api.js'
import { sectionClass } from '../constants.js'
import { getCustomerToken, updateCustomerProfile } from '../../lib/customerAuth'

export default function CustomerQvaPaySettings({ onUpdated }) {
  const [username, setUsername] = useState('')
  const [savedUsername, setSavedUsername] = useState('')
  const [verified, setVerified] = useState(false)
  const [verificationUnavailable, setVerificationUnavailable] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    fetchCustomerQvaPayAccount(getCustomerToken())
      .then((data) => {
        if (!active) return
        setUsername(data.username || '')
        setSavedUsername(data.username || '')
        setVerified(Boolean(data.verified))
      })
      .catch(() => { if (active) setError('No pudimos cargar tu cuenta QvaPay.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  async function refreshProfile() {
    const profile = await fetchCustomerProfile(getCustomerToken())
    updateCustomerProfile(profile)
    onUpdated?.(profile)
  }

  async function save(event, skipVerification = false) {
    event?.preventDefault()
    setSaving(true); setError(''); setMessage('')
    setVerificationUnavailable(false)
    try {
      const data = await saveCustomerQvaPayAccount(getCustomerToken(), username.trim(), { skipVerification })
      setUsername(data.username)
      setSavedUsername(data.username)
      setVerified(Boolean(data.verified))
      setMessage(data.verified
        ? 'Tu cuenta QvaPay fue verificada y guardada.'
        : 'Guardamos el usuario sin verificar. La verificación falló por un problema temporal de nuestro lado; puedes volver a intentarlo más tarde.')
      await refreshProfile()
    } catch (cause) {
      const serviceUnavailable = cause?.status >= 500 || cause?.code === 'network_error'
      setVerificationUnavailable(serviceUnavailable)
      setError(serviceUnavailable
        ? 'No pudimos verificar el usuario por un problema temporal de nuestro lado.'
        : cause?.message || 'No pudimos verificar esa cuenta QvaPay.')
    } finally { setSaving(false) }
  }

  async function remove() {
    setSaving(true); setError(''); setMessage('')
    try {
      await deleteCustomerQvaPayAccount(getCustomerToken())
      setUsername(''); setSavedUsername(''); setVerified(false); setVerificationUnavailable(false)
      setMessage('Cuenta QvaPay eliminada.')
      await refreshProfile()
    } catch (cause) { setError(cause?.message || 'No pudimos eliminar la cuenta.') }
    finally { setSaving(false) }
  }

  const sameSaved = username.trim().toLowerCase() === savedUsername.toLowerCase()

  return (
    <section id="cuenta-qvapay" className={sectionClass}>
      <h2 className="text-lg font-bold">Cuenta QvaPay</h2>
      <p className="mt-1 text-sm text-brand-carmelita/80">Verificaremos que el usuario exista antes de habilitar los pagos y las devoluciones.</p>
      <form onSubmit={save} className="mt-4 flex flex-col gap-3">
        <label htmlFor="customer-qvapay-username" className="text-sm font-semibold">Usuario QvaPay
          <input id="customer-qvapay-username" value={username} onChange={(event) => setUsername(event.target.value)} placeholder="Tu usuario de QvaPay" autoComplete="off" disabled={loading || saving} className="mt-1 min-h-11 w-full rounded-xl border border-brand-green/15 bg-white px-3 py-2" />
        </label>
        {error ? <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
        {message ? <p role="status" className="rounded-xl bg-brand-green/10 p-3 text-sm text-brand-green">{message}</p> : null}
        {verificationUnavailable ? (
          <div className="rounded-xl border border-brand-green/15 bg-brand-green/5 p-3">
            <p className="text-sm leading-relaxed text-brand-carmelita">La verificación de QvaPay no está disponible ahora. Puedes guardar el usuario de todas formas; el problema está de nuestro lado.</p>
            <button type="button" onClick={() => { void save(null, true) }} disabled={saving || !username.trim()} className="mt-3 min-h-11 w-full rounded-xl bg-brand-green font-bold text-white disabled:opacity-50">
              Guardar de todas formas
            </button>
          </div>
        ) : null}
        <div className="grid grid-cols-2 gap-2">
          <button type="submit" disabled={loading || saving || !username.trim() || (verified && sameSaved)} className={`min-h-11 rounded-xl bg-brand-green px-3 text-sm font-bold text-white disabled:opacity-50 ${savedUsername ? '' : 'col-span-2'}`}>
            {saving ? 'Verificando…' : savedUsername && sameSaved && !verified ? 'Reintentar verificación' : savedUsername ? 'Actualizar usuario' : 'Verificar y guardar'}
          </button>
          {savedUsername ? <button type="button" onClick={remove} disabled={saving} className="min-h-11 rounded-xl border border-red-200 px-3 text-sm font-bold text-red-700 disabled:opacity-50">Eliminar cuenta</button> : null}
        </div>
      </form>
    </section>
  )
}

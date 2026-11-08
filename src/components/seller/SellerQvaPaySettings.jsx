import { useEffect, useState } from 'react'
import { fetchSellerQvaPayAccount, saveSellerQvaPayAccount, deleteSellerQvaPayAccount } from '../../auth/api.js'
import { getSellerToken } from '../../lib/sellerAuth'
import SellerSection from './SellerSection'
import { sellerAlertError, sellerAlertSuccess, sellerBtnDanger, sellerBtnPrimary, sellerHint, sellerInput, sellerLabel } from './sellerStyles'

export default function SellerQvaPaySettings({ onUpdated, readOnly = false }) {
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
    fetchSellerQvaPayAccount(getSellerToken())
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

  async function save(event, skipVerification = false) {
    event?.preventDefault()
    setSaving(true); setError(''); setMessage('')
    setVerificationUnavailable(false)
    try {
      const data = await saveSellerQvaPayAccount(getSellerToken(), username.trim(), { skipVerification })
      setUsername(data.username); setSavedUsername(data.username)
      setVerified(Boolean(data.verified))
      setMessage(data.verified
        ? 'Tu cuenta QvaPay fue verificada y guardada.'
        : 'Guardamos el usuario sin verificar. La verificación falló por un problema temporal de nuestro lado; puedes volver a intentarlo más tarde.')
      onUpdated?.()
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
      await deleteSellerQvaPayAccount(getSellerToken())
      setUsername(''); setSavedUsername(''); setVerified(false); setVerificationUnavailable(false); setMessage('Cuenta QvaPay eliminada.'); onUpdated?.()
    } catch (cause) { setError(cause?.message || 'No pudimos eliminar la cuenta.') }
    finally { setSaving(false) }
  }

  return (
    <SellerSection label="Cuenta QvaPay" hint="Los pagos se retienen hasta que el cliente acepte la entrega o venza el plazo de revisión de 48 horas.">
      <form onSubmit={save} className="flex flex-col gap-3">
        <label htmlFor="qvapay-username" className={sellerLabel}>Usuario QvaPay</label>
        <input id="qvapay-username" value={username} onChange={(event) => setUsername(event.target.value)} className={sellerInput} placeholder="Tu usuario de QvaPay" autoComplete="off" disabled={readOnly || loading || saving} />
        <p className={sellerHint}>Verificaremos que el usuario exista antes de habilitarlo. El mismo método estará disponible para todos los planes.</p>
        {error ? <p role="alert" className={sellerAlertError}>{error}</p> : null}
        {message ? <p role="status" className={sellerAlertSuccess}>{message}</p> : null}
        {verificationUnavailable ? (
          <div className="rounded-xl border border-brand-green/15 bg-brand-green/5 p-3">
            <p className="text-sm leading-relaxed text-brand-carmelita">La verificación de QvaPay no está disponible ahora. Puedes guardar el usuario de todas formas; el problema está de nuestro lado.</p>
            <button type="button" onClick={() => { void save(null, true) }} disabled={readOnly || saving || !username.trim()} className={`${sellerBtnPrimary} mt-3 min-h-11 w-full`}>
              Guardar de todas formas
            </button>
          </div>
        ) : null}
        <div className="grid grid-cols-2 gap-2">
          <button type="submit" disabled={readOnly || loading || saving || !username.trim() || (verified && username.trim().toLowerCase() === savedUsername.toLowerCase())} className={`${sellerBtnPrimary} min-h-12 min-w-0 px-2 text-xs leading-tight sm:text-sm ${savedUsername ? '!w-auto' : 'col-span-2'}`}>
            {saving ? 'Verificando…' : savedUsername && username.trim().toLowerCase() === savedUsername.toLowerCase() && !verified ? 'Reintentar verificación' : savedUsername ? 'Actualizar usuario' : 'Verificar y guardar'}
          </button>
          {savedUsername ? <button type="button" onClick={remove} disabled={readOnly || saving} className={`${sellerBtnDanger} min-h-12 min-w-0 !w-auto px-2 text-xs leading-tight sm:text-sm`}>Eliminar cuenta</button> : null}
        </div>
      </form>
    </SellerSection>
  )
}

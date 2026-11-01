import { useEffect, useState } from 'react'
import { fetchSellerQvaPayAccount, saveSellerQvaPayAccount, deleteSellerQvaPayAccount } from '../../auth/api.js'
import { getSellerToken } from '../../lib/sellerAuth'
import SellerSection from './SellerSection'
import { sellerAlertError, sellerAlertSuccess, sellerBtnDanger, sellerBtnPrimary, sellerHint, sellerInput, sellerLabel } from './sellerStyles'

export default function SellerQvaPaySettings({ onUpdated }) {
  const [username, setUsername] = useState('')
  const [savedUsername, setSavedUsername] = useState('')
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
      })
      .catch(() => { if (active) setError('No pudimos cargar tu cuenta QvaPay.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  async function save(event) {
    event.preventDefault()
    setSaving(true); setError(''); setMessage('')
    try {
      const data = await saveSellerQvaPayAccount(getSellerToken(), username.trim())
      setUsername(data.username); setSavedUsername(data.username)
      setMessage('Tu cuenta QvaPay fue verificada y guardada.')
      onUpdated?.()
    } catch (cause) {
      setError(cause?.message || 'No pudimos verificar esa cuenta QvaPay.')
    } finally { setSaving(false) }
  }

  async function remove() {
    setSaving(true); setError(''); setMessage('')
    try {
      await deleteSellerQvaPayAccount(getSellerToken())
      setUsername(''); setSavedUsername(''); setMessage('Cuenta QvaPay eliminada.'); onUpdated?.()
    } catch (cause) { setError(cause?.message || 'No pudimos eliminar la cuenta.') }
    finally { setSaving(false) }
  }

  return (
    <SellerSection label="Cuenta QvaPay" hint="Los pagos se retienen hasta que el cliente acepte la entrega o venza el plazo de revisión de 48 horas.">
      <form onSubmit={save} className="flex flex-col gap-3">
        <label htmlFor="qvapay-username" className={sellerLabel}>Usuario QvaPay</label>
        <input id="qvapay-username" value={username} onChange={(event) => setUsername(event.target.value)} className={sellerInput} placeholder="Tu usuario de QvaPay" autoComplete="off" disabled={loading || saving} />
        <p className={sellerHint}>Verificaremos que el usuario exista antes de habilitarlo. El mismo método estará disponible para todos los planes.</p>
        {error ? <p role="alert" className={sellerAlertError}>{error}</p> : null}
        {message ? <p role="status" className={sellerAlertSuccess}>{message}</p> : null}
        <div className="flex flex-wrap gap-2">
          <button type="submit" disabled={loading || saving || !username.trim() || username.trim().toLowerCase() === savedUsername.toLowerCase()} className={sellerBtnPrimary}>
            {saving ? 'Verificando…' : savedUsername ? 'Actualizar usuario' : 'Verificar y guardar'}
          </button>
          {savedUsername ? <button type="button" onClick={remove} disabled={saving} className={sellerBtnDanger}>Eliminar cuenta</button> : null}
        </div>
      </form>
    </SellerSection>
  )
}

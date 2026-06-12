import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AdminButton from '../components/admin/AdminButton'
import {
  adminAlertError,
  adminAlertSuccess,
  adminCard,
  adminInput,
  adminLabel,
  adminMuted,
  adminSubtle,
} from '../components/admin/adminStyles'
import { fetchAdminSettings, updateAdminSettings } from '../lib/api'
import { getUserFacingMessage, isSessionError } from '../lib/userFacingError'
import { clearAdminToken, getAdminToken } from '../lib/adminAuth'
import { PHONE_PREFIX, formatPhoneDigits, getPhoneDigits } from '../lib/phone'
import LoadingState from '../components/ui/LoadingState'

export default function AdminSettings() {
  const navigate = useNavigate()
  const [phoneDigits, setPhoneDigits] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const loadSettings = useCallback(async () => {
    setError('')
    setLoading(true)
    try {
      const token = getAdminToken()
      const data = await fetchAdminSettings(token)
      setPhoneDigits(data.renewal_contact_phone ?? '')
    } catch (err) {
      if (isSessionError(err)) {
        clearAdminToken()
        navigate('/admin', { replace: true })
        return
      }
      setError(getUserFacingMessage(err, 'No pudimos cargar la configuración.'))
    } finally {
      setLoading(false)
    }
  }, [navigate])

  useEffect(() => {
    loadSettings()
  }, [loadSettings])

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSuccess('')

    if (phoneDigits.length !== 8) {
      setError('Indica un teléfono cubano de 8 dígitos.')
      return
    }

    setSaving(true)
    try {
      const token = getAdminToken()
      const updated = await updateAdminSettings(token, {
        renewal_contact_phone: phoneDigits,
      })
      setPhoneDigits(updated.renewal_contact_phone ?? phoneDigits)
      setSuccess('Configuración guardada.')
    } catch (err) {
      setError(getUserFacingMessage(err, 'No pudimos guardar la configuración.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-5 pb-28 sm:px-6">
      <p className={`mb-5 text-sm leading-relaxed ${adminSubtle}`}>
        Este número recibe los mensajes de WhatsApp cuando un vendedor quiere renovar su plan.
      </p>

      {success && (
        <p className={`mb-4 ${adminAlertSuccess}`} role="status">
          {success}
        </p>
      )}

      {error && (
        <p className={`mb-4 ${adminAlertError}`} role="alert">
          {error}
        </p>
      )}

      {loading ? (
        <LoadingState variant="admin" message="Cargando configuración…" />
      ) : (
        <form onSubmit={handleSubmit} className={adminCard}>
          <div>
            <label htmlFor="renewal-contact-phone" className={adminLabel}>
              Teléfono para renovaciones
              <span className="text-orange-300" aria-hidden="true">
                {' '}
                *
              </span>
            </label>
            <div className="mt-2 flex overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900 focus-within:border-zinc-500 focus-within:ring-1 focus-within:ring-zinc-500">
              <span className="flex shrink-0 items-center border-r border-zinc-800 bg-zinc-950 px-3 text-sm font-semibold text-zinc-300">
                {PHONE_PREFIX}
              </span>
              <input
                id="renewal-contact-phone"
                type="tel"
                inputMode="numeric"
                value={formatPhoneDigits(phoneDigits)}
                onChange={(event) => setPhoneDigits(getPhoneDigits(event.target.value))}
                className={`${adminInput} min-h-12 rounded-none border-0 bg-transparent focus:ring-0`}
                placeholder="5 123 4567"
                autoComplete="tel-national"
                required
              />
            </div>
            <p className={`mt-2 text-xs ${adminMuted}`}>
              Obligatorio para que el botón «Renovar plan» abra WhatsApp con un mensaje prellenado.
            </p>
          </div>

          <div className="mt-5">
            <AdminButton type="submit" disabled={saving || phoneDigits.length !== 8}>
              {saving ? 'Guardando…' : 'Guardar configuración'}
            </AdminButton>
          </div>
        </form>
      )}
    </div>
  )
}

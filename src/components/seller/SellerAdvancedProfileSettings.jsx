import { useEffect, useMemo, useState } from 'react'

import SellerProfileFieldGroup from './SellerProfileFieldGroup'
import SellerSection from './SellerSection'
import {
  sellerAlertError,
  sellerBtnPrimary,
  sellerFocusRing,
  sellerHint,
  sellerInputBare,
  sellerInputPrefix,
  sellerInputPrefixWrap,
  sellerLabel,
} from './sellerStyles'
import { updateSellerPhone } from '../../lib/api'
import {
  PHONE_DIGITS_LENGTH,
  PHONE_PREFIX,
  formatPhoneDigits,
  getPhoneDigits,
  phoneDigitsFromStored,
} from '../../lib/phone'
import { getSellerToken, updateSellerProfileCache } from '../../lib/sellerAuth'
import { getUserFacingMessage } from '../../lib/userFacingError'

export default function SellerAdvancedProfileSettings({ profile, onUpdated }) {
  const [open, setOpen] = useState(false)
  const [phoneDigits, setPhoneDigits] = useState(() => phoneDigitsFromStored(profile?.phone))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  const storedDigits = useMemo(() => phoneDigitsFromStored(profile?.phone), [profile?.phone])

  useEffect(() => {
    setPhoneDigits(storedDigits)
    setSaved(false)
  }, [storedDigits])

  const hasChanges = phoneDigits !== storedDigits
  const canSave = hasChanges && phoneDigits.length === PHONE_DIGITS_LENGTH && !loading

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSaved(false)

    if (phoneDigits.length !== PHONE_DIGITS_LENGTH) {
      setError('Indica un teléfono cubano de 8 dígitos.')
      return
    }

    setLoading(true)
    try {
      const token = getSellerToken()
      const updated = await updateSellerPhone(token, phoneDigits)
      updateSellerProfileCache(updated)
      await onUpdated?.()
      setSaved(true)
    } catch (err) {
      setError(getUserFacingMessage(err, 'No pudimos actualizar el teléfono.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <SellerProfileFieldGroup
      title="Configuración avanzada"
      description="Opciones sensibles de tu cuenta. Los cambios aquí no afectan el resto del perfil hasta que los guardes."
    >
      <SellerSection>
        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          aria-expanded={open}
          className={`flex w-full items-center justify-between rounded-2xl border border-brand-green/15 bg-brand-white px-4 py-3 text-left text-sm font-semibold text-brand-green touch-manipulation active:bg-brand-yellow/10 ${sellerFocusRing}`}
        >
          <span>Cambiar número de teléfono</span>
          <svg
            width="16"
            height="16"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden
            className={`shrink-0 text-brand-carmelita/70 transition-transform ${open ? 'rotate-180' : ''}`}
          >
            <path
              fillRule="evenodd"
              d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
              clipRule="evenodd"
            />
          </svg>
        </button>

        {open && (
          <form onSubmit={handleSubmit} className="mt-3 rounded-2xl border border-brand-green/12 bg-brand-green/[0.02] p-4">
            <label htmlFor="seller-advanced-phone" className={sellerLabel}>
              Nuevo teléfono
            </label>
            <div className={`mt-1.5 ${sellerInputPrefixWrap}`}>
              <span className={sellerInputPrefix}>{PHONE_PREFIX}</span>
              <input
                id="seller-advanced-phone"
                type="tel"
                inputMode="numeric"
                value={formatPhoneDigits(phoneDigits)}
                onChange={(event) => {
                  setPhoneDigits(getPhoneDigits(event.target.value))
                  setError('')
                  setSaved(false)
                }}
                className={sellerInputBare}
                placeholder="5 123 4567"
                autoComplete="tel-national"
              />
            </div>
            <p className={`mt-2 ${sellerHint}`}>
              Actual: {profile?.phone || '—'}. Usarás este número para iniciar sesión.
            </p>

            {error && (
              <p className={`mt-3 ${sellerAlertError}`} role="alert">
                {error}
              </p>
            )}

            {saved && !error && (
              <p className="mt-3 text-center text-xs font-semibold text-brand-green sm:text-sm" role="status">
                Teléfono actualizado.
              </p>
            )}

            <button type="submit" disabled={!canSave} className={`mt-4 ${sellerBtnPrimary}`}>
              {loading ? 'Guardando…' : 'Guardar teléfono'}
            </button>
          </form>
        )}
      </SellerSection>
    </SellerProfileFieldGroup>
  )
}

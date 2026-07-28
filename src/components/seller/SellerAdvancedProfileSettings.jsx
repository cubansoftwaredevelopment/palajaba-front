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
import { updateSellerPhone, updateSellerStoreName } from '../../lib/api'
import {
  PHONE_DIGITS_LENGTH,
  PHONE_PREFIX,
  formatPhoneDigits,
  getPhoneDigits,
  phoneDigitsFromStored,
} from '../../lib/phone'
import { getSellerToken, updateSellerProfileCache } from '../../lib/sellerAuth'
import { getUserFacingMessage } from '../../lib/userFacingError'

function CollapsibleSection({ title, open, onToggle, children }) {
  return (
    <SellerSection>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className={`flex w-full items-center justify-between rounded-2xl border border-brand-green/15 bg-brand-white px-4 py-3 text-left text-sm font-semibold text-brand-green touch-manipulation active:bg-brand-yellow/10 ${sellerFocusRing}`}
      >
        <span>{title}</span>
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
      {open && children}
    </SellerSection>
  )
}

export default function SellerAdvancedProfileSettings({ profile, onUpdated, embedded = false }) {
  const [phoneOpen, setPhoneOpen] = useState(false)
  const [storeNameOpen, setStoreNameOpen] = useState(false)

  const [phoneDigits, setPhoneDigits] = useState(() => phoneDigitsFromStored(profile?.phone))
  const [phoneLoading, setPhoneLoading] = useState(false)
  const [phoneError, setPhoneError] = useState('')
  const [phoneSaved, setPhoneSaved] = useState(false)

  const [storeName, setStoreName] = useState(() => profile?.store_name || '')
  const [storeNameLoading, setStoreNameLoading] = useState(false)
  const [storeNameError, setStoreNameError] = useState('')
  const [storeNameSaved, setStoreNameSaved] = useState(false)

  const storedDigits = useMemo(() => phoneDigitsFromStored(profile?.phone), [profile?.phone])
  const storedStoreName = useMemo(() => profile?.store_name || '', [profile?.store_name])

  useEffect(() => {
    setPhoneDigits(storedDigits)
    setPhoneSaved(false)
  }, [storedDigits])

  useEffect(() => {
    setStoreName(storedStoreName)
    setStoreNameSaved(false)
  }, [storedStoreName])

  const phoneHasChanges = phoneDigits !== storedDigits
  const canSavePhone =
    phoneHasChanges && phoneDigits.length === PHONE_DIGITS_LENGTH && !phoneLoading

  const normalizedStoreName = storeName.trim()
  const storeNameHasChanges =
    normalizedStoreName.toLowerCase() !== storedStoreName.toLowerCase()
  const canSaveStoreName =
    storeNameHasChanges && normalizedStoreName.length > 0 && !storeNameLoading

  async function handlePhoneSubmit(event) {
    event.preventDefault()
    setPhoneError('')
    setPhoneSaved(false)

    if (phoneDigits.length !== PHONE_DIGITS_LENGTH) {
      setPhoneError('Indica un teléfono cubano de 8 dígitos.')
      return
    }

    setPhoneLoading(true)
    try {
      const token = getSellerToken()
      const updated = await updateSellerPhone(token, phoneDigits)
      updateSellerProfileCache(updated)
      await onUpdated?.()
      setPhoneSaved(true)
    } catch (err) {
      setPhoneError(getUserFacingMessage(err, 'No pudimos actualizar el teléfono.'))
    } finally {
      setPhoneLoading(false)
    }
  }

  async function handleStoreNameSubmit(event) {
    event.preventDefault()
    setStoreNameError('')
    setStoreNameSaved(false)

    if (!normalizedStoreName) {
      setStoreNameError('Indica el nombre de tu negocio.')
      return
    }

    setStoreNameLoading(true)
    try {
      const token = getSellerToken()
      const updated = await updateSellerStoreName(token, normalizedStoreName)
      updateSellerProfileCache(updated)
      await onUpdated?.()
      setStoreNameSaved(true)
    } catch (err) {
      setStoreNameError(getUserFacingMessage(err, 'No pudimos actualizar el nombre.'))
    } finally {
      setStoreNameLoading(false)
    }
  }

  const body = (
    <>
      <CollapsibleSection
        title="Cambiar nombre del negocio"
        open={storeNameOpen}
        onToggle={() => setStoreNameOpen((current) => !current)}
      >
        <form
          onSubmit={handleStoreNameSubmit}
          className="mt-3 rounded-2xl border border-brand-green/12 bg-brand-green/[0.02] p-4"
        >
          <label htmlFor="seller-advanced-store-name" className={sellerLabel}>
            Nuevo nombre del negocio
          </label>
          <input
            id="seller-advanced-store-name"
            type="text"
            value={storeName}
            onChange={(event) => {
              setStoreName(event.target.value)
              setStoreNameError('')
              setStoreNameSaved(false)
            }}
            className={`mt-1.5 ${sellerInputBare}`}
            placeholder="Ej. Ferretería El Martillo"
            autoComplete="organization"
            maxLength={120}
          />
          <p className={`mt-2 ${sellerHint}`}>
            Actual: {profile?.store_name || '—'}. Usarás este nombre para iniciar sesión.
          </p>

          {storeNameError && (
            <p className={`mt-3 ${sellerAlertError}`} role="alert">
              {storeNameError}
            </p>
          )}

          {storeNameSaved && !storeNameError && (
            <p className="mt-3 text-center text-xs font-semibold text-brand-green sm:text-sm" role="status">
              Nombre actualizado.
            </p>
          )}

          <button type="submit" disabled={!canSaveStoreName} className={`mt-4 ${sellerBtnPrimary}`}>
            {storeNameLoading ? 'Guardando…' : 'Guardar nombre'}
          </button>
        </form>
      </CollapsibleSection>

      <CollapsibleSection
        title="Cambiar número de teléfono"
        open={phoneOpen}
        onToggle={() => setPhoneOpen((current) => !current)}
      >
        <form onSubmit={handlePhoneSubmit} className="mt-3 rounded-2xl border border-brand-green/12 bg-brand-green/[0.02] p-4">
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
                setPhoneError('')
                setPhoneSaved(false)
              }}
              className={sellerInputBare}
              placeholder="5 123 4567"
              autoComplete="tel-national"
            />
          </div>
          <p className={`mt-2 ${sellerHint}`}>
            Actual: {profile?.phone || '—'}. Usarás este número para iniciar sesión.
          </p>

          {phoneError && (
            <p className={`mt-3 ${sellerAlertError}`} role="alert">
              {phoneError}
            </p>
          )}

          {phoneSaved && !phoneError && (
            <p className="mt-3 text-center text-xs font-semibold text-brand-green sm:text-sm" role="status">
              Teléfono actualizado.
            </p>
          )}

          <button type="submit" disabled={!canSavePhone} className={`mt-4 ${sellerBtnPrimary}`}>
            {phoneLoading ? 'Guardando…' : 'Guardar teléfono'}
          </button>
        </form>
      </CollapsibleSection>
    </>
  )

  if (embedded) {
    return <div className="flex flex-col gap-2.5 sm:gap-3">{body}</div>
  }

  return (
    <SellerProfileFieldGroup
      title="Configuración avanzada"
      description="Opciones sensibles de tu cuenta. Los cambios aquí no afectan el resto del perfil hasta que los guardes."
    >
      {body}
    </SellerProfileFieldGroup>
  )
}

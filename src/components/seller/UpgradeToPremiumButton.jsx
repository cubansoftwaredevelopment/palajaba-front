import { useState } from 'react'

import { fetchRenewalContactPhone } from '../../lib/api'
import { openPremiumUpgradeWhatsApp } from '../../lib/renewalWhatsApp'
import { sellerBtnPrimary, sellerFocusRing } from './sellerStyles'

export default function UpgradeToPremiumButton({
  className = '',
  storeName = '',
  contactPhone = null,
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleUpgrade() {
    setError('')
    setLoading(true)

    try {
      let phone = contactPhone
      if (!phone) {
        const data = await fetchRenewalContactPhone()
        phone = data.renewal_contact_phone
      }

      if (!phone) {
        setError('El administrador aún no configuró un teléfono de contacto.')
        return
      }

      const opened = openPremiumUpgradeWhatsApp({ storeName, adminPhone: phone })
      if (!opened) {
        setError('No pudimos abrir WhatsApp. Revisa el número de contacto.')
      }
    } catch {
      setError('No pudimos obtener el teléfono de contacto. Inténtalo más tarde.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={className.includes('w-full') ? 'w-full' : ''}>
      <button
        type="button"
        onClick={handleUpgrade}
        disabled={loading}
        className={`${sellerBtnPrimary} min-h-11 px-5 text-sm ${sellerFocusRing} ${className}`}
      >
        {loading ? 'Abriendo WhatsApp…' : 'Pasar a Premium'}
      </button>
      {error ? (
        <p className="mt-2 text-xs leading-relaxed text-brand-carmelita/90" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}

import { useState } from 'react'
import { fetchRenewalContactPhone } from '../../lib/api'
import { openRenewalWhatsApp } from '../../lib/renewalWhatsApp'
import { sellerBtnPrimary } from './sellerStyles'

export default function RenewPlanButton({
  className = '',
  size = 'default',
  storeName = '',
  renewalPhone = null,
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const sizeClass = size === 'compact' ? 'min-h-9 py-2 text-xs' : 'min-h-10 py-2.5 text-sm'

  async function handleRenew() {
    setError('')
    setLoading(true)

    try {
      let phone = renewalPhone
      if (!phone) {
        const data = await fetchRenewalContactPhone()
        phone = data.renewal_contact_phone
      }

      if (!phone) {
        setError('El administrador aún no configuró un teléfono para renovaciones.')
        return
      }

      const opened = openRenewalWhatsApp({ storeName, adminPhone: phone })
      if (!opened) {
        setError('No pudimos abrir WhatsApp. Revisa el número de contacto.')
      }
    } catch {
      setError('No pudimos obtener el teléfono de renovación. Inténtalo más tarde.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={className.includes('w-full') ? 'w-full' : ''}>
      <button
        type="button"
        onClick={handleRenew}
        disabled={loading}
        className={`${sellerBtnPrimary} ${sizeClass} ${className}`}
      >
        {loading ? 'Abriendo WhatsApp…' : 'Renovar plan'}
      </button>
      {error ? (
        <p className="mt-2 text-xs leading-relaxed text-brand-carmelita/90" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}

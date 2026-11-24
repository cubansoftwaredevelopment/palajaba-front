import { useState } from 'react'
import { getUserFacingMessage } from '../../shared/utils/userFacingError.js'
import { downloadMensajeroEvidence, downloadSellerCourierEvidence } from '../api'

function DownloadIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 4v10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="m8 11 4 4 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 19h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

export default function CourierEvidenceDownload({ orderId, role = 'mensajero' }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function download() {
    setBusy(true)
    setError('')
    try {
      if (role === 'seller') await downloadSellerCourierEvidence(orderId)
      else await downloadMensajeroEvidence(orderId)
    } catch (err) {
      setError(getUserFacingMessage({ message: err?.message }, 'No pudimos descargar el PDF de la evidencia.'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={download}
        disabled={busy}
        className="inline-flex min-h-9 items-center gap-2 rounded-full border border-brand-green/22 px-3 text-xs font-semibold text-brand-green disabled:opacity-60"
      >
        <DownloadIcon />
        {busy ? 'Preparando PDF…' : 'Descargar PDF'}
      </button>
      {error ? <p className="mt-1 text-xs font-semibold text-red-700">{error}</p> : null}
    </div>
  )
}

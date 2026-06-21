import { useState } from 'react'

import SellerProfileFieldGroup from './SellerProfileFieldGroup'
import SellerSection from './SellerSection'
import {
  sellerAlertError,
  sellerBtnPrimary,
  sellerFocusRing,
  sellerHint,
  sellerLabel,
  sellerTextarea,
} from './sellerStyles'
import { submitSellerFeedback } from '../../lib/api'
import { getSellerToken } from '../../lib/sellerAuth'
import { getUserFacingMessage } from '../../lib/userFacingError'

const FEEDBACK_TYPES = [
  { id: 'complaint', label: 'Queja' },
  { id: 'suggestion', label: 'Sugerencia' },
]

export default function SellerFeedbackSection() {
  const [open, setOpen] = useState(false)
  const [feedbackType, setFeedbackType] = useState('suggestion')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const trimmed = message.trim()
  const canSubmit = trimmed.length >= 10 && !loading

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSuccess('')

    if (trimmed.length < 10) {
      setError('Escribe al menos 10 caracteres.')
      return
    }

    setLoading(true)
    try {
      const result = await submitSellerFeedback(getSellerToken(), {
        feedback_type: feedbackType,
        message: trimmed,
      })
      setSuccess(result.message)
      setMessage('')
    } catch (err) {
      setError(getUserFacingMessage(err, 'No pudimos enviar tu mensaje.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <SellerProfileFieldGroup
      title="Quejas y sugerencias"
      description="Cuéntanos si algo no funciona bien o cómo podemos mejorar Pa' La Jaba. Tu mensaje llega directo al equipo."
    >
      <SellerSection>
        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          aria-expanded={open}
          className={`flex w-full items-center justify-between rounded-2xl border border-brand-green/15 bg-brand-white px-4 py-3 text-left text-sm font-semibold text-brand-green touch-manipulation active:bg-brand-yellow/10 ${sellerFocusRing}`}
        >
          <span>Enviar mensaje al equipo</span>
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
          <form
            onSubmit={handleSubmit}
            className="mt-3 rounded-2xl border border-brand-green/12 bg-brand-green/[0.02] p-4"
          >
            <fieldset>
              <legend className={sellerLabel}>Tipo de mensaje</legend>
              <div className="mt-2 flex flex-wrap gap-2">
                {FEEDBACK_TYPES.map((option) => {
                  const active = feedbackType === option.id
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => {
                        setFeedbackType(option.id)
                        setError('')
                        setSuccess('')
                      }}
                      className={`rounded-full border px-4 py-2 text-sm font-semibold touch-manipulation ${sellerFocusRing} ${
                        active
                          ? 'border-brand-green bg-brand-green text-brand-white'
                          : 'border-brand-green/20 bg-brand-white text-brand-green'
                      }`}
                    >
                      {option.label}
                    </button>
                  )
                })}
              </div>
            </fieldset>

            <label htmlFor="seller-feedback-message" className={`mt-4 block ${sellerLabel}`}>
              Tu mensaje
            </label>
            <textarea
              id="seller-feedback-message"
              value={message}
              onChange={(event) => {
                setMessage(event.target.value)
                setError('')
                setSuccess('')
              }}
              className={`mt-1.5 ${sellerTextarea}`}
              placeholder="Describe con detalle la queja o la idea que quieres compartir…"
              maxLength={2000}
              rows={5}
            />
            <p className={`mt-2 ${sellerHint}`}>
              Mínimo 10 caracteres · {trimmed.length}/2000
            </p>

            {error && (
              <p className={`mt-3 ${sellerAlertError}`} role="alert">
                {error}
              </p>
            )}

            {success && !error && (
              <p className="mt-3 text-center text-xs font-semibold text-brand-green sm:text-sm" role="status">
                {success}
              </p>
            )}

            <button type="submit" disabled={!canSubmit} className={`mt-4 ${sellerBtnPrimary}`}>
              {loading ? 'Enviando…' : 'Enviar mensaje'}
            </button>
          </form>
        )}
      </SellerSection>
    </SellerProfileFieldGroup>
  )
}

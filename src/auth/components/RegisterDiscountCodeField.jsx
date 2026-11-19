import { useEffect, useState } from 'react'
import { inputClass, labelClass } from './formStyles'
import Button from '../../components/Button'
import { validateDiscountCode } from '../api.js'
import { getUserFacingMessage } from '../../lib/userFacingError'
import { useFormErrorToast } from '../../components/ui/useFormErrorToast'

export default function RegisterDiscountCodeField({
  billing,
  planTier,
  applied,
  onApplied,
  onClear,
}) {
  const [code, setCode] = useState(applied?.code ?? '')
  const { showError, toastNode } = useFormErrorToast()
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setCode(applied?.code ?? '')
  }, [applied?.code])

  async function handleApply(event) {
    event.preventDefault()
    const trimmed = code.trim()
    if (!trimmed) {
      showError('Escribe un código de descuento.')
      return
    }

    setLoading(true)
    showError('')
    try {
      const result = await validateDiscountCode({
        code: trimmed,
        planTier,
        billingPeriod: billing,
      })
      onApplied(result)
    } catch (err) {
      onClear()
      showError(getUserFacingMessage(err, 'No pudimos validar el código.'))
    } finally {
      setLoading(false)
    }
  }

  function handleRemove() {
    setCode('')
    showError('')
    onClear()
  }

  return (
    <div className="rounded-2xl border border-brand-green/15 bg-brand-white/90 p-4">
      <form onSubmit={handleApply} className="flex flex-col gap-3">
        <div>
          <label htmlFor="discount-code" className={labelClass}>
            Código de descuento
          </label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              id="discount-code"
              type="text"
              value={code}
              onChange={(event) => setCode(event.target.value.toUpperCase())}
              className={inputClass}
              placeholder="Ej. AMIGO20"
              autoComplete="off"
              disabled={Boolean(applied)}
            />
            {applied ? (
              <Button type="button" variant="ghost" onClick={handleRemove}>
                Quitar
              </Button>
            ) : (
              <Button type="submit" disabled={loading}>
                {loading ? 'Validando…' : 'Aplicar'}
              </Button>
            )}
          </div>
        </div>

        {applied ? (
          <p className="text-sm font-medium text-brand-green">
            Código <span className="font-bold">{applied.code}</span> aplicado ({applied.percent_off}% de
            descuento).
          </p>
        ) : null}
        {toastNode}
      </form>
    </div>
  )
}

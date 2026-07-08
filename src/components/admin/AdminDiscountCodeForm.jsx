import { useState } from 'react'
import AdminButton from './AdminButton'
import AdminModal from './AdminModal'
import {
  adminAlertError,
  adminFocusRing,
  adminInput,
  adminLabel,
  adminSubtle,
} from './adminStyles'

const PERCENT_PRESETS = [10, 15, 20, 25, 50]

function ActiveToggle({ checked, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`flex w-full items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left transition-colors ${adminFocusRing} ${
        checked
          ? 'border-brand-green/30 bg-brand-green/10'
          : 'border-zinc-800 bg-zinc-900/50'
      }`}
    >
      <span>
        <span className="block text-sm font-medium text-zinc-100">Visible en el registro</span>
        <span className={`mt-0.5 block text-xs ${adminSubtle}`}>
          {checked
            ? 'Los nuevos vendedores podrán usar este código.'
            : 'Queda guardado pero no aparece en el formulario de registro.'}
        </span>
      </span>
      <span
        className={`relative inline-flex h-7 w-12 shrink-0 rounded-full transition-colors ${
          checked ? 'bg-brand-green' : 'bg-zinc-700'
        }`}
        aria-hidden="true"
      >
        <span
          className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${
            checked ? 'translate-x-5' : 'translate-x-0.5'
          }`}
        />
      </span>
    </button>
  )
}

export default function AdminDiscountCodeForm({ initial, onSubmit, onClose, submitLabel, loading }) {
  const [code, setCode] = useState(initial?.code ?? '')
  const [percentOff, setPercentOff] = useState(String(initial?.percent_off ?? ''))
  const [isActive, setIsActive] = useState(initial?.is_active ?? true)
  const [error, setError] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()
    const parsedPercent = Number.parseInt(percentOff, 10)
    if (!code.trim()) {
      setError('El código es obligatorio.')
      return
    }
    if (!Number.isFinite(parsedPercent) || parsedPercent < 1 || parsedPercent > 100) {
      setError('El descuento debe estar entre 1 y 100.')
      return
    }

    setError('')
    await onSubmit({
      code: code.trim().toUpperCase(),
      percent_off: parsedPercent,
      is_active: isActive,
    })
  }

  return (
    <AdminModal
      title={initial ? 'Editar código' : 'Nuevo código de descuento'}
      subtitle={
        initial
          ? 'Actualiza el código, el porcentaje o su visibilidad en el registro.'
          : 'Los vendedores lo usarán al elegir plan y pagar su solicitud.'
      }
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div>
          <label htmlFor="discount-code-value" className={adminLabel}>
            Código
          </label>
          <input
            id="discount-code-value"
            type="text"
            value={code}
            onChange={(event) => setCode(event.target.value.toUpperCase())}
            className={`${adminInput} font-mono uppercase tracking-wider`}
            placeholder="Ej. AMIGO20"
            autoComplete="off"
            spellCheck={false}
            required
          />
        </div>

        <div>
          <label htmlFor="discount-code-percent" className={adminLabel}>
            Descuento (%)
          </label>
          <input
            id="discount-code-percent"
            type="number"
            min={1}
            max={100}
            inputMode="numeric"
            value={percentOff}
            onChange={(event) => setPercentOff(event.target.value)}
            className={adminInput}
            required
          />
          <div className="mt-2 flex flex-wrap gap-2">
            {PERCENT_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setPercentOff(String(preset))}
                className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${adminFocusRing} ${
                  Number(percentOff) === preset
                    ? 'border-brand-green/40 bg-brand-green/12 text-brand-green'
                    : 'border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                }`}
              >
                {preset}%
              </button>
            ))}
          </div>
        </div>

        <ActiveToggle checked={isActive} onChange={setIsActive} />

        {error ? (
          <p className={adminAlertError} role="alert">
            {error}
          </p>
        ) : null}

        <div className="flex flex-col gap-2 sm:flex-row">
          <AdminButton type="button" variant="secondary" onClick={onClose} disabled={loading}>
            Cancelar
          </AdminButton>
          <AdminButton type="submit" disabled={loading}>
            {loading ? 'Guardando…' : submitLabel}
          </AdminButton>
        </div>
      </form>
    </AdminModal>
  )
}

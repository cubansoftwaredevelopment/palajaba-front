import { useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import AdminButton from '../AdminButton'
import AdminDatePicker from '../AdminDatePicker'
import AdminModal from '../AdminModal'
import AdminSelect from '../AdminSelect'
import { adminAlertError, adminCard, adminInput, adminLabel, adminMuted, adminSubtle } from '../adminStyles'
import { DISPLAY_CURRENCIES } from '../../../constants/currencies'
import { formatPrice } from '../../../lib/money'
import { getUserFacingMessage } from '../../../lib/userFacingError'
import { isoDate, startOfToday, startOfTomorrow } from '../AdminDateRangeControls'

function formatWhen(value) {
  if (!value) return '—'
  try {
    return new Intl.DateTimeFormat('es', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
  } catch {
    return value
  }
}

const CURRENCY_OPTIONS = DISPLAY_CURRENCIES.map((item) => ({ value: item.code, label: item.code }))

const KIND_LABELS = {
  income: 'Ingreso',
  extraction: 'Extracción',
}

function RateHint({ rates }) {
  const triggerRef = useRef(null)
  const [place, setPlace] = useState(null)
  const lines = DISPLAY_CURRENCIES.filter((item) => item.code !== 'CUP' && rates?.[item.code]).map((item) => ({
    code: item.code,
    cup: Number(rates[item.code]),
  }))
  if (lines.length === 0) return null

  const summary = lines.map((line) => `1 ${line.code} = ${line.cup.toLocaleString('es')} CUP`).join(' · ')

  function show() {
    const rect = triggerRef.current?.getBoundingClientRect()
    if (!rect) return
    const width = 176
    const left = Math.min(Math.max(8, rect.left), window.innerWidth - width - 8)
    if (rect.top < 96) {
      setPlace({ left, width, top: rect.bottom + 8 })
    } else {
      setPlace({ left, width, bottom: window.innerHeight - rect.top + 8 })
    }
  }

  function hide() {
    setPlace(null)
  }

  return (
    <span className="relative ml-1.5 inline-flex align-middle">
      <span
        ref={triggerRef}
        className="inline-flex h-4 w-4 cursor-help items-center justify-center rounded-full border border-zinc-600 text-[0.65rem] leading-none text-zinc-400"
        tabIndex={0}
        aria-label={`Tipo de cambio al registrar: ${summary}`}
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
      >
        ⇄
      </span>
      {place
        ? createPortal(
            <span
              className="pointer-events-none fixed z-[80] rounded-lg border border-zinc-700 bg-zinc-950 px-2.5 py-1.5 text-[0.65rem] leading-relaxed text-zinc-200 shadow-xl"
              style={place}
            >
              <span className="mb-0.5 block text-[0.6rem] uppercase tracking-wide text-zinc-500">Cambio al registrar</span>
              {lines.map((line) => (
                <span key={line.code} className="block whitespace-nowrap tabular-nums">
                  1 {line.code} = {line.cup.toLocaleString('es')} CUP
                </span>
              ))}
            </span>,
            document.body,
          )
        : null}
    </span>
  )
}

export default function FinanceLedgerSection({
  items,
  totals,
  loading,
  error,
  currency,
  onCurrencyChange,
  onCreateExtraction,
}) {
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [newestFirst, setNewestFirst] = useState(true)
  const [form, setForm] = useState({
    amount: '',
    currency: 'CUP',
    reason: '',
    at: startOfToday(),
  })

  async function submitExtraction(event) {
    event.preventDefault()
    const amount = Number(String(form.amount).replace(',', '.'))
    const reason = form.reason.trim()
    if (!Number.isFinite(amount) || amount <= 0) {
      setFormError('Indica un monto mayor que cero.')
      return
    }
    if (!reason) {
      setFormError('El motivo es obligatorio.')
      return
    }
    setSaving(true)
    setFormError('')
    try {
      await onCreateExtraction({
        amount,
        currency: form.currency,
        reason,
        at: form.at ? `${isoDate(form.at)}T12:00:00-04:00` : undefined,
      })
      setOpen(false)
      setForm({ amount: '', currency: 'CUP', reason: '', at: startOfToday() })
    } catch (err) {
      setFormError(getUserFacingMessage(err, 'No pudimos registrar la extracción.'))
    } finally {
      setSaving(false)
    }
  }

  const rows = useMemo(() => {
    const copy = [...items]
    copy.sort((a, b) => {
      const left = new Date(a.at || 0).getTime()
      const right = new Date(b.at || 0).getTime()
      return newestFirst ? right - left : left - right
    })
    return copy
  }, [items, newestFirst])

  const balanceCurrency = currency || 'CUP'

  return (
    <section className={adminCard}>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-zinc-50">Libro de finanzas</h2>
          <p className={`mt-1 text-sm ${adminSubtle}`}>
            Ingresos por planes y extracciones, incluidas las deudas que se van liquidando.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <AdminSelect
            className="w-[11rem]"
            triggerClassName="min-h-10 py-2 text-sm"
            value={currency}
            onChange={onCurrencyChange}
            ariaLabel="Mostrar en moneda"
            options={[{ value: '', label: 'Todas las monedas' }, ...CURRENCY_OPTIONS]}
          />
          <AdminButton
            type="button"
            onClick={() => {
              setFormError('')
              setOpen(true)
            }}
          >
            Registrar extracción
          </AdminButton>
        </div>
      </div>

      {Object.keys(totals).length > 0 ? (
        <div className="mb-4 flex flex-wrap gap-2">
          {Object.entries(totals).map(([code, amount]) => (
            <span
              key={code}
              className="rounded-full border border-zinc-700 bg-zinc-900/60 px-2.5 py-1 text-xs font-semibold tabular-nums text-zinc-200"
            >
              Neto {formatPrice(amount, code)}
            </span>
          ))}
        </div>
      ) : null}

      {error ? (
        <p className={`mb-3 ${adminAlertError}`} role="alert">
          {error}
        </p>
      ) : null}

      {loading ? (
        <p className={`py-8 text-center text-sm ${adminMuted}`}>Cargando libro…</p>
      ) : items.length === 0 ? (
        <p className={`rounded-xl border border-dashed border-zinc-800 px-4 py-8 text-center text-sm ${adminSubtle}`}>
          No hay movimientos en este periodo.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-zinc-800/80">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-800 text-xs uppercase tracking-wide text-zinc-500">
                <th className="px-3 py-2 font-medium">
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 text-xs font-medium uppercase tracking-wide text-zinc-500 hover:text-zinc-200"
                    onClick={() => setNewestFirst((value) => !value)}
                    aria-label={newestFirst ? 'Ordenar de más antiguo a más reciente' : 'Ordenar de más reciente a más antiguo'}
                  >
                    Fecha
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 12 12"
                      fill="none"
                      aria-hidden="true"
                      className={`transition-transform ${newestFirst ? 'rotate-180' : ''}`}
                    >
                      <path d="M6 2.5v7M3.2 6.8 6 9.5l2.8-2.7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </th>
                <th className="px-3 py-2 font-medium">Tipo</th>
                <th className="px-3 py-2 font-medium">Motivo</th>
                <th className="px-3 py-2 font-medium">Monto</th>
                <th className="px-3 py-2 font-medium">Resultante ({balanceCurrency})</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((item) => (
                <tr key={`${item.source}-${item.id}`} className="border-b border-zinc-800/70 last:border-0">
                  <td className="whitespace-nowrap px-3 py-2.5 text-zinc-400">{formatWhen(item.at)}</td>
                  <td className="px-3 py-2.5">
                    <span
                      className={`rounded-md px-2 py-0.5 text-[0.65rem] font-semibold uppercase ${
                        item.kind === 'income'
                          ? 'border border-brand-green/30 bg-brand-green/10 text-brand-green'
                          : 'border border-brand-carmelita/30 bg-brand-carmelita/10 text-orange-200'
                      }`}
                    >
                      {KIND_LABELS[item.kind] ?? item.kind}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-zinc-100">
                    {item.reason}
                    {item.source === 'debt_liquidation' ? (
                      <span className={`mt-0.5 block text-[0.65rem] ${adminMuted}`}>Desde una deuda liquidada</span>
                    ) : null}
                  </td>
                  <td
                    className={`px-3 py-2.5 tabular-nums ${
                      item.kind === 'income' ? 'text-brand-green' : 'text-orange-200'
                    }`}
                  >
                    <span className="inline-flex items-center">
                      {item.kind === 'extraction' ? '−' : '+'}
                      {formatPrice(item.display_amount ?? item.amount, item.display_currency ?? item.currency)}
                      <RateHint rates={item.rates} />
                    </span>
                    {item.display_currency && item.display_currency !== item.currency ? (
                      <span className={`mt-0.5 block text-[0.65rem] ${adminMuted}`}>
                        {formatPrice(item.amount, item.currency)}
                      </span>
                    ) : null}
                  </td>
                  <td
                    className={`px-3 py-2.5 tabular-nums font-medium ${
                      Number(item.balance) < 0 ? 'text-orange-200' : 'text-zinc-100'
                    }`}
                  >
                    {formatPrice(item.balance, balanceCurrency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {open ? (
        <AdminModal title="Registrar extracción" subtitle="Sale del libro como un retiro de fondos." onClose={() => setOpen(false)}>
          <form onSubmit={submitExtraction} className="flex flex-col gap-3">
            <div>
              <label className={adminLabel} htmlFor="extraction-date">
                Fecha
              </label>
              <AdminDatePicker
                value={form.at}
                onChange={(next) => next && setForm((current) => ({ ...current, at: next }))}
                minDate={new Date(2015, 0, 1)}
                maxDate={startOfTomorrow()}
                caption={false}
              />
            </div>
            <div className="grid grid-cols-[1fr_6.5rem] gap-2">
              <div>
                <label className={adminLabel} htmlFor="extraction-amount">
                  Monto
                </label>
                <input
                  id="extraction-amount"
                  type="number"
                  min="0.01"
                  step="0.01"
                  inputMode="decimal"
                  value={form.amount}
                  onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))}
                  className={adminInput}
                  required
                />
              </div>
              <div>
                <label className={adminLabel} htmlFor="extraction-currency">
                  Moneda
                </label>
                <AdminSelect
                  id="extraction-currency"
                  value={form.currency}
                  onChange={(nextCurrency) => setForm((current) => ({ ...current, currency: nextCurrency }))}
                  options={CURRENCY_OPTIONS}
                  dropdownZIndex={70}
                />
              </div>
            </div>
            <div>
              <label className={adminLabel} htmlFor="extraction-reason">
                Motivo
              </label>
              <input
                id="extraction-reason"
                value={form.reason}
                onChange={(event) => setForm((current) => ({ ...current, reason: event.target.value }))}
                className={adminInput}
                placeholder="Retiro, pago a proveedor…"
                required
              />
            </div>
            {formError ? (
              <p className={adminAlertError} role="alert">
                {formError}
              </p>
            ) : null}
            <div className="mt-2 flex flex-col gap-2 sm:flex-row">
              <AdminButton type="button" variant="secondary" onClick={() => setOpen(false)}>
                Cancelar
              </AdminButton>
              <AdminButton type="submit" disabled={saving}>
                {saving ? 'Guardando…' : 'Registrar'}
              </AdminButton>
            </div>
          </form>
        </AdminModal>
      ) : null}
    </section>
  )
}

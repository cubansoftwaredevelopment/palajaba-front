import { useEffect, useMemo, useState } from 'react'
import AdminButton from '../AdminButton'
import AdminModal from '../AdminModal'
import AdminSelect from '../AdminSelect'
import ConfirmDialog from '../ConfirmDialog'
import Checkbox from '../../ui/Checkbox'
import { adminAlertError, adminCard, adminFocusRing, adminInput, adminLabel, adminMuted, adminSubtle } from '../adminStyles'
import { DISPLAY_CURRENCIES } from '../../../constants/currencies'
import { formatPrice } from '../../../lib/money'
import { getUserFacingMessage } from '../../../lib/userFacingError'

const CURRENCY_OPTIONS = DISPLAY_CURRENCIES.map((item) => ({ value: item.code, label: item.code }))
const PAGE_SIZES = [10, 15, 20]
const PAGE_SIZE_OPTIONS = PAGE_SIZES.map((size) => ({ value: String(size), label: `${size} por página` }))
const pagerButton =
  'inline-flex min-h-9 items-center rounded-xl border border-zinc-800/90 bg-zinc-900/70 px-3 text-xs font-medium text-zinc-100 disabled:opacity-40'

const MONTHS = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
]

function periodLabel(year, month) {
  return `${MONTHS[(month || 1) - 1] ?? month} ${year}`
}

function emptyExpenseForm() {
  return { title: '', amount: '', currency: 'CUP' }
}

function parseExpenseForm(form) {
  const title = form.title.trim()
  const amount = Number(String(form.amount).replace(',', '.'))
  if (!title) return { error: 'El título es obligatorio.' }
  if (!Number.isFinite(amount) || amount < 0) return { error: 'El monto debe ser un número mayor o igual a 0.' }
  return { title, amount, currency: form.currency }
}

function Toggle({ checked, onChange, children }) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 text-sm text-zinc-300">
      <Checkbox tone="admin" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      {children}
    </label>
  )
}

export default function FinanceDebtsSection({
  debts,
  totals,
  expenses,
  loading,
  error,
  generating,
  includeLiquidated,
  onIncludeLiquidated,
  includeDeleted,
  onIncludeDeleted,
  currency,
  onCurrencyChange,
  onCreateExpense,
  onUpdateExpense,
  onDeleteExpense,
  onGenerate,
  onLiquidate,
  onDeleteDebts,
  onUpdateDebt,
}) {
  const [selected, setSelected] = useState(() => new Set())
  const [expenseForm, setExpenseForm] = useState(emptyExpenseForm)
  const [editing, setEditing] = useState(null)
  const [expenseError, setExpenseError] = useState('')
  const [savingExpense, setSavingExpense] = useState(false)
  const [liquidateOpen, setLiquidateOpen] = useState(false)
  const [liquidateIds, setLiquidateIds] = useState([])
  const [editOpen, setEditOpen] = useState(false)
  const [editingDebtId, setEditingDebtId] = useState(null)
  const [editForm, setEditForm] = useState(emptyExpenseForm)
  const [editError, setEditError] = useState('')
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [expenseDelete, setExpenseDelete] = useState(null)
  const [reason, setReason] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [actionError, setActionError] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const debtsKey = debts.map((item) => item.id).join(',')

  useEffect(() => {
    setPage(1)
  }, [debtsKey])

  const pageCount = Math.max(1, Math.ceil(debts.length / pageSize))
  const currentPage = Math.min(page, pageCount)
  const pageStart = debts.length === 0 ? 0 : (currentPage - 1) * pageSize
  const pageItems = debts.slice(pageStart, pageStart + pageSize)

  const selectableIds = useMemo(
    () => debts.filter((item) => !item.deleted).map((item) => item.id),
    [debts],
  )
  const pageSelectableIds = useMemo(
    () => pageItems.filter((item) => !item.deleted).map((item) => item.id),
    [pageItems],
  )
  const pendingIds = useMemo(
    () => debts.filter((item) => !item.deleted && !item.liquidated).map((item) => item.id),
    [debts],
  )
  const selectedIds = [...selected].filter((id) => selectableIds.includes(id))
  const selectedPending = selectedIds.filter((id) => pendingIds.includes(id))
  const selectedDebt = selectedIds.length === 1 ? debts.find((item) => item.id === selectedIds[0]) : null
  const canEditDebt = Boolean(selectedDebt && !selectedDebt.deleted)

  function openDebtEditor(debt) {
    if (!debt || debt.deleted) return
    setEditError('')
    setActionError('')
    setEditingDebtId(debt.id)
    setEditForm({
      title: debt.title,
      amount: String(debt.amount),
      currency: debt.currency,
    })
    setEditOpen(true)
  }

  function closeDebtEditor() {
    setEditOpen(false)
    setEditingDebtId(null)
    setEditError('')
  }
  const pageAllSelected =
    pageSelectableIds.length > 0 && pageSelectableIds.every((id) => selected.has(id))

  function toggleAll(select) {
    setSelected((current) => {
      const next = new Set(current)
      pageSelectableIds.forEach((id) => {
        if (select) next.add(id)
        else next.delete(id)
      })
      return next
    })
  }

  function setChecked(id, checked) {
    setSelected((current) => {
      const next = new Set(current)
      if (checked) next.add(id)
      else next.delete(id)
      return next
    })
  }

  async function submitExpense(event) {
    event.preventDefault()
    const parsed = parseExpenseForm(editing ?? expenseForm)
    if (parsed.error) {
      setExpenseError(parsed.error)
      return
    }
    setSavingExpense(true)
    setExpenseError('')
    try {
      if (editing) {
        await onUpdateExpense(editing.id, parsed)
        setEditing(null)
      } else {
        await onCreateExpense(parsed)
        setExpenseForm(emptyExpenseForm())
      }
    } catch (err) {
      setExpenseError(getUserFacingMessage(err, 'No pudimos guardar el gasto.'))
    } finally {
      setSavingExpense(false)
    }
  }

  async function confirmLiquidate() {
    setActionLoading(true)
    setActionError('')
    try {
      await onLiquidate({ ids: liquidateIds, reason: reason.trim() || undefined })
      setLiquidateOpen(false)
      setReason('')
      setLiquidateIds([])
      setSelected(new Set())
    } catch (err) {
      setActionError(getUserFacingMessage(err, 'No pudimos liquidar las deudas.'))
    } finally {
      setActionLoading(false)
    }
  }

  async function confirmDeleteDebts() {
    setActionLoading(true)
    setActionError('')
    try {
      await onDeleteDebts({ ids: selectedIds })
      setDeleteOpen(false)
      setSelected(new Set())
    } catch (err) {
      setActionError(getUserFacingMessage(err, 'No pudimos eliminar las deudas.'))
    } finally {
      setActionLoading(false)
    }
  }

  const form = editing ?? expenseForm

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(18rem,0.9fr)]">
      <section className={adminCard}>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-zinc-50">Deudas de la plataforma</h2>
            <p className={`mt-1 text-sm ${adminSubtle}`}>
              Genera las deudas del mes a partir de los gastos configurados y liquídalas para el libro.
            </p>
          </div>
          <AdminSelect
            className="w-full max-w-[11rem]"
            triggerClassName="min-h-10 py-2 text-sm"
            value={currency}
            onChange={onCurrencyChange}
            ariaLabel="Filtrar por moneda"
            options={[{ value: '', label: 'Todas las monedas' }, ...CURRENCY_OPTIONS]}
          />
        </div>

        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <Toggle checked={includeLiquidated} onChange={onIncludeLiquidated}>
              Incluir liquidadas
            </Toggle>
            <Toggle checked={includeDeleted} onChange={onIncludeDeleted}>
              Ver eliminadas
            </Toggle>
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            <AdminButton
              type="button"
              size="sm"
              variant="secondary"
              disabled={!canEditDebt}
              title={canEditDebt ? 'Editar la deuda seleccionada' : 'Selecciona una sola deuda para editarla'}
              onClick={() => openDebtEditor(selectedDebt)}
            >
              Editar
            </AdminButton>
            <AdminButton
              type="button"
              size="sm"
              disabled={selectedPending.length === 0}
              onClick={() => {
                setActionError('')
                setLiquidateIds(selectedPending)
                if (selectedPending.length > 1 && !reason.trim()) {
                  setReason('Liquidación de deudas')
                }
                setLiquidateOpen(true)
              }}
            >
              Liquidar {selectedPending.length || ''}
            </AdminButton>
            <AdminButton
              type="button"
              size="sm"
              variant="danger"
              disabled={selectedIds.length === 0}
              onClick={() => {
                setActionError('')
                setDeleteOpen(true)
              }}
            >
              Eliminar
            </AdminButton>
          </div>
        </div>

        {error ? (
          <p className={`mb-3 ${adminAlertError}`} role="alert">
            {error}
          </p>
        ) : null}

        {loading ? (
          <p className={`py-8 text-center text-sm ${adminMuted}`}>Cargando deudas…</p>
        ) : debts.length === 0 ? (
          <p className={`rounded-xl border border-dashed border-zinc-800 px-4 py-8 text-center text-sm ${adminSubtle}`}>
            No hay deudas en este periodo.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-zinc-800/80">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-800 text-xs uppercase tracking-wide text-zinc-500">
                  <th className="px-3 py-2">
                    <Checkbox
                      tone="admin"
                      checked={pageAllSelected}
                      onChange={() => toggleAll(!pageAllSelected)}
                      aria-label="Seleccionar las deudas de esta página"
                    />
                  </th>
                  <th className="px-3 py-2 font-medium">Concepto</th>
                  <th className="px-3 py-2 font-medium">Periodo</th>
                  <th className="px-3 py-2 font-medium">Monto</th>
                  <th className="px-3 py-2 font-medium">Estado</th>
                  <th className="px-3 py-2 font-medium">
                    <span className="sr-only">Acciones</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((item) => (
                  <tr key={item.id} className={`border-b border-zinc-800/70 ${item.deleted ? 'opacity-60' : ''}`}>
                    <td className="px-3 py-2.5">
                      <Checkbox
                        tone="admin"
                        disabled={item.deleted}
                        checked={selected.has(item.id)}
                        onChange={(event) => setChecked(item.id, event.target.checked)}
                        aria-label={`Seleccionar ${item.title}`}
                      />
                    </td>
                    <td className={`px-3 py-2.5 text-zinc-100 ${item.deleted ? 'line-through' : ''}`}>
                      {item.title}
                    </td>
                    <td className="px-3 py-2.5 text-zinc-400">{periodLabel(item.period_year, item.period_month)}</td>
                    <td className="px-3 py-2.5 tabular-nums text-zinc-100">
                      {item.converted_amount != null && item.converted_currency
                        ? formatPrice(item.converted_amount, item.converted_currency)
                        : formatPrice(item.amount, item.currency)}
                      {item.converted_amount != null && item.converted_currency && item.currency !== item.converted_currency ? (
                        <span className={`mt-0.5 block text-[0.65rem] ${adminMuted}`}>
                          {formatPrice(item.amount, item.currency)}
                        </span>
                      ) : item.currency !== 'CUP' && item.cup_amount != null ? (
                        <span className={`mt-0.5 block text-[0.65rem] ${adminMuted}`}>
                          ≈ {formatPrice(item.cup_amount, 'CUP')}
                        </span>
                      ) : null}
                    </td>
                    <td className="px-3 py-2.5">
                      {item.deleted ? (
                        <span className="rounded-md border border-zinc-600/40 bg-zinc-800 px-2 py-0.5 text-[0.65rem] font-semibold uppercase text-zinc-400">
                          Eliminada
                        </span>
                      ) : item.liquidated ? (
                        <span className="rounded-md border border-brand-green/30 bg-brand-green/10 px-2 py-0.5 text-[0.65rem] font-semibold uppercase text-brand-green">
                          Liquidada
                        </span>
                      ) : (
                        <span className="rounded-md border border-brand-yellow/30 bg-brand-yellow/10 px-2 py-0.5 text-[0.65rem] font-semibold uppercase text-brand-yellow">
                          Pendiente
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      {item.deleted ? null : (
                        <button
                          type="button"
                          className={`text-xs font-semibold text-brand-green ${adminFocusRing}`}
                          onClick={() => openDebtEditor(item)}
                        >
                          Editar
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-zinc-700 bg-zinc-950/50">
                  <td className="px-3 py-3" colSpan={3}>
                    <span className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Total</span>
                  </td>
                  <td className="px-3 py-3">
                    {Object.keys(totals).length === 0 ? (
                      <span className={`text-sm tabular-nums ${adminMuted}`}>—</span>
                    ) : (
                      <div className="flex flex-col gap-0.5">
                        {Object.entries(totals).map(([code, amount]) => (
                          <span key={code} className="text-sm font-semibold tabular-nums text-zinc-50">
                            {formatPrice(amount, code)}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-3" colSpan={2} />
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {!loading && debts.length > 0 ? (
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className={`text-sm ${adminSubtle}`}>
              {pageStart + 1}–{pageStart + pageItems.length} de {debts.length} · Página {currentPage} de {pageCount}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <AdminSelect
                className="w-[9.5rem]"
                triggerClassName="min-h-9 py-1.5 text-xs"
                ariaLabel="Deudas por página"
                value={String(pageSize)}
                onChange={(value) => {
                  setPageSize(Number(value))
                  setPage(1)
                }}
                options={PAGE_SIZE_OPTIONS}
              />
              <button
                type="button"
                className={pagerButton}
                disabled={currentPage <= 1}
                onClick={() => setPage(currentPage - 1)}
              >
                Anterior
              </button>
              <button
                type="button"
                className={pagerButton}
                disabled={currentPage >= pageCount}
                onClick={() => setPage(currentPage + 1)}
              >
                Siguiente
              </button>
            </div>
          </div>
        ) : null}
      </section>

      <aside className={adminCard}>
        <div className="mb-4">
          <h2 className="text-sm font-semibold text-zinc-50">Gastos de plataforma</h2>
          <p className={`mt-1 text-sm ${adminSubtle}`}>Configura los cargos fijos y genera la deuda del mes.</p>
        </div>
        <AdminButton type="button" size="sm" className="mb-4" disabled={generating} onClick={onGenerate}>
          {generating ? 'Generando…' : 'Generar deuda del mes'}
        </AdminButton>

        <form onSubmit={submitExpense} className="mb-4 space-y-3 rounded-xl border border-zinc-800/80 bg-zinc-950/30 p-3">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            {editing ? 'Editar gasto' : 'Añadir gasto'}
          </p>
          <div>
            <label className={adminLabel} htmlFor="expense-title">
              Título
            </label>
            <input
              id="expense-title"
              value={form.title}
              onChange={(event) => {
                const next = { ...form, title: event.target.value }
                if (editing) setEditing({ ...editing, ...next })
                else setExpenseForm(next)
              }}
              className={adminInput}
              placeholder="Hosting, dominio…"
              required
            />
          </div>
          <div className="grid grid-cols-[1fr_6.5rem] gap-2">
            <div>
              <label className={adminLabel} htmlFor="expense-amount">
                Monto
              </label>
              <input
                id="expense-amount"
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                value={form.amount}
                onChange={(event) => {
                  const next = { ...form, amount: event.target.value }
                  if (editing) setEditing({ ...editing, ...next })
                  else setExpenseForm(next)
                }}
                className={`${adminInput} [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none`}
                required
              />
            </div>
            <div>
              <label className={adminLabel} htmlFor="expense-currency">
                Moneda
              </label>
              <AdminSelect
                id="expense-currency"
                value={form.currency}
                onChange={(nextCurrency) => {
                  const next = { ...form, currency: nextCurrency }
                  if (editing) setEditing({ ...editing, ...next })
                  else setExpenseForm(next)
                }}
                options={CURRENCY_OPTIONS}
              />
            </div>
          </div>
          {expenseError ? (
            <p className="text-sm text-orange-200" role="alert">
              {expenseError}
            </p>
          ) : null}
          <div className="flex flex-wrap items-center gap-2">
            <AdminButton type="submit" size="xs" disabled={savingExpense}>
              {savingExpense ? 'Guardando…' : editing ? 'Guardar' : 'Añadir'}
            </AdminButton>
            {editing ? (
              <AdminButton
                type="button"
                size="xs"
                variant="secondary"
                onClick={() => {
                  setEditing(null)
                  setExpenseError('')
                }}
              >
                Cancelar
              </AdminButton>
            ) : null}
          </div>
        </form>

        <ul className="space-y-2">
          {expenses.length === 0 ? (
            <li className={`rounded-xl border border-dashed border-zinc-800 px-3 py-6 text-center text-sm ${adminSubtle}`}>
              Aún no hay gastos configurados.
            </li>
          ) : (
            expenses.map((item) => (
              <li key={item.id} className="rounded-xl border border-zinc-800/80 bg-zinc-950/25 px-3 py-3">
                <p className="font-medium text-zinc-100">{item.title}</p>
                <p className="mt-1 text-sm tabular-nums text-zinc-300">{formatPrice(item.amount, item.currency)}</p>
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    className={`text-xs font-semibold text-brand-green ${adminFocusRing}`}
                    onClick={() => {
                      setEditing({
                        id: item.id,
                        title: item.title,
                        amount: String(item.amount),
                        currency: item.currency,
                      })
                      setExpenseError('')
                    }}
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    className={`text-xs font-semibold text-orange-200 ${adminFocusRing}`}
                    onClick={() => setExpenseDelete(item)}
                  >
                    Quitar
                  </button>
                </div>
              </li>
            ))
          )}
        </ul>
      </aside>

      {editOpen && editingDebtId ? (
        <AdminModal
          title="Editar deuda"
          subtitle="Cambia el concepto, el monto o la moneda de esta deuda."
          onClose={closeDebtEditor}
        >
          <form
            className="flex flex-col gap-3"
            onSubmit={async (event) => {
              event.preventDefault()
              const parsed = parseExpenseForm(editForm)
              if (parsed.error) {
                setEditError(parsed.error)
                return
              }
              setActionLoading(true)
              setEditError('')
              try {
                await onUpdateDebt(editingDebtId, {
                  title: parsed.title,
                  amount: parsed.amount,
                  currency: parsed.currency,
                })
                closeDebtEditor()
              } catch (err) {
                setEditError(getUserFacingMessage(err, 'No pudimos guardar la deuda.'))
              } finally {
                setActionLoading(false)
              }
            }}
          >
            <div>
              <label className={adminLabel} htmlFor="edit-debt-title">
                Título
              </label>
              <input
                id="edit-debt-title"
                value={editForm.title}
                onChange={(event) => setEditForm((current) => ({ ...current, title: event.target.value }))}
                className={adminInput}
                required
              />
            </div>
            <div className="grid grid-cols-[1fr_6.5rem] gap-2">
              <div>
                <label className={adminLabel} htmlFor="edit-debt-amount">
                  Monto
                </label>
                <input
                  id="edit-debt-amount"
                  type="number"
                  min="0"
                  step="0.01"
                  inputMode="decimal"
                  value={editForm.amount}
                  onChange={(event) => setEditForm((current) => ({ ...current, amount: event.target.value }))}
                  className={`${adminInput} [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none`}
                  required
                />
              </div>
              <div>
                <label className={adminLabel} htmlFor="edit-debt-currency">
                  Moneda
                </label>
                <AdminSelect
                  id="edit-debt-currency"
                  value={editForm.currency}
                  onChange={(nextCurrency) => setEditForm((current) => ({ ...current, currency: nextCurrency }))}
                  options={CURRENCY_OPTIONS}
                  dropdownZIndex={70}
                />
              </div>
            </div>
            {editError ? (
              <p className={adminAlertError} role="alert">
                {editError}
              </p>
            ) : null}
            <div className="mt-2 flex flex-col gap-2 sm:flex-row">
              <AdminButton type="button" variant="secondary" onClick={closeDebtEditor}>
                Cancelar
              </AdminButton>
              <AdminButton type="submit" disabled={actionLoading}>
                {actionLoading ? 'Guardando…' : 'Guardar'}
              </AdminButton>
            </div>
          </form>
        </AdminModal>
      ) : null}

      {liquidateOpen ? (
        <AdminModal
          title="Liquidar deudas"
          subtitle="Cada deuda genera un movimiento en el libro, todas con el mismo motivo."
          onClose={() => setLiquidateOpen(false)}
        >
          <p className={`text-sm ${adminSubtle}`}>
            {liquidateIds.length === 1
              ? '1 deuda pendiente seleccionada.'
              : `${liquidateIds.length} deudas pendientes seleccionadas.`}
          </p>
          <label className={`${adminLabel} mt-4`} htmlFor="liquidate-reason">
            Motivo {liquidateIds.length > 1 ? '(igual para todas)' : '(opcional)'}
          </label>
          <input
            id="liquidate-reason"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            className={adminInput}
            placeholder="Pago de hosting, etc."
          />
          {actionError ? (
            <p className={`mt-3 ${adminAlertError}`} role="alert">
              {actionError}
            </p>
          ) : null}
          <div className="mt-5 flex flex-col gap-2 sm:flex-row">
            <AdminButton type="button" variant="secondary" onClick={() => setLiquidateOpen(false)}>
              Cancelar
            </AdminButton>
            <AdminButton type="button" disabled={actionLoading || liquidateIds.length === 0} onClick={confirmLiquidate}>
              {actionLoading ? 'Liquidando…' : 'Liquidar'}
            </AdminButton>
          </div>
        </AdminModal>
      ) : null}

      {deleteOpen ? (
        <ConfirmDialog
          title="Eliminar deudas"
          subtitle="El registro se conserva marcado como eliminado. Nunca se borra del sistema."
          confirmLabel="Eliminar"
          confirmVariant="danger"
          loading={actionLoading}
          onConfirm={confirmDeleteDebts}
          onClose={() => setDeleteOpen(false)}
        >
          <p className={`text-sm ${adminSubtle}`}>
            {selectedIds.length === 1
              ? '¿Eliminar 1 deuda seleccionada?'
              : `¿Eliminar ${selectedIds.length} deudas seleccionadas?`}
          </p>
          {actionError ? (
            <p className={`mt-3 ${adminAlertError}`} role="alert">
              {actionError}
            </p>
          ) : null}
        </ConfirmDialog>
      ) : null}

      {expenseDelete ? (
        <ConfirmDialog
          title="Quitar gasto"
          subtitle="Deja de usarse al generar deudas nuevas. Las deudas ya creadas se mantienen."
          confirmLabel="Quitar"
          confirmVariant="danger"
          loading={actionLoading}
          onConfirm={async () => {
            setActionLoading(true)
            setActionError('')
            try {
              await onDeleteExpense(expenseDelete.id)
              setExpenseDelete(null)
            } catch (err) {
              setActionError(getUserFacingMessage(err, 'No pudimos quitar el gasto.'))
            } finally {
              setActionLoading(false)
            }
          }}
          onClose={() => setExpenseDelete(null)}
        >
          <p className={`text-sm ${adminSubtle}`}>¿Quitar «{expenseDelete.title}» del catálogo?</p>
          {actionError ? (
            <p className={`mt-3 ${adminAlertError}`} role="alert">
              {actionError}
            </p>
          ) : null}
        </ConfirmDialog>
      ) : null}
    </div>
  )
}

import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AdminDateRangeControls, {
  isoDate,
  rangeForPeriod,
} from '../components/admin/AdminDateRangeControls'
import FinanceDebtsSection from '../components/admin/finance/FinanceDebtsSection'
import FinanceLedgerSection from '../components/admin/finance/FinanceLedgerSection'
import { adminFocusRing, adminSection } from '../components/admin/adminStyles'
import {
  createFinanceExpense,
  createFinanceExtraction,
  deleteFinanceDebts,
  deleteFinanceExpense,
  fetchFinanceDebts,
  fetchFinanceExpenses,
  fetchFinanceLedger,
  generateFinanceDebts,
  liquidateFinanceDebts,
  updateFinanceDebt,
  updateFinanceExpense,
} from '../lib/api'
import { clearAdminToken, getAdminToken } from '../lib/adminAuth'
import { getUserFacingMessage, isSessionError } from '../lib/userFacingError'

const TABS = [
  { id: 'debts', label: 'Deudas' },
  { id: 'ledger', label: 'Libro de finanzas' },
]

function tabClass(active) {
  return `rounded-xl border px-3 py-2 text-sm font-semibold transition-colors ${adminFocusRing} ${
    active
      ? 'border-brand-green/40 bg-brand-green/12 text-brand-green'
      : 'border-zinc-800 bg-zinc-900/50 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
  }`
}

function Toast({ message, type, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000)
    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <div
      className={`admin-theme fixed bottom-[max(4.5rem,calc(3.25rem+var(--safe-bottom)))] left-1/2 z-50 flex max-w-sm -translate-x-1/2 items-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium shadow-xl animate-jaba-toast-in ${
        type === 'success'
          ? 'border-brand-green/30 bg-zinc-900/95 text-zinc-100'
          : 'border-brand-carmelita/25 bg-zinc-950/95 text-zinc-200'
      }`}
      role="status"
    >
      <span className="flex-1">{message}</span>
      <button type="button" onClick={onClose} className="text-zinc-500 hover:text-white" aria-label="Cerrar">
        ×
      </button>
    </div>
  )
}

function windowFromRange(range) {
  if (!range?.from || !range?.to) return {}
  return { start: isoDate(range.from), end: isoDate(range.to) }
}

function periodFromRange(range) {
  if (!range?.to) {
    const now = new Date()
    return { year: now.getFullYear(), month: now.getMonth() + 1 }
  }
  return { year: range.to.getFullYear(), month: range.to.getMonth() + 1 }
}

export default function AdminFinance() {
  const navigate = useNavigate()
  const [tab, setTab] = useState('debts')
  const [debtsPeriod, setDebtsPeriod] = useState('monthly')
  const [debtsRange, setDebtsRange] = useState(() => rangeForPeriod('monthly'))
  const [ledgerPeriod, setLedgerPeriod] = useState('monthly')
  const [ledgerRange, setLedgerRange] = useState(() => rangeForPeriod('monthly'))
  const [debtsCurrency, setDebtsCurrency] = useState('')
  const [ledgerCurrency, setLedgerCurrency] = useState('')
  const [includeLiquidated, setIncludeLiquidated] = useState(false)
  const [includeDeleted, setIncludeDeleted] = useState(false)
  const [expenses, setExpenses] = useState([])
  const [debts, setDebts] = useState([])
  const [debtTotals, setDebtTotals] = useState({})
  const [ledgerItems, setLedgerItems] = useState([])
  const [ledgerTotals, setLedgerTotals] = useState({})
  const [debtsLoading, setDebtsLoading] = useState(true)
  const [ledgerLoading, setLedgerLoading] = useState(true)
  const [debtsError, setDebtsError] = useState('')
  const [ledgerError, setLedgerError] = useState('')
  const [generating, setGenerating] = useState(false)
  const [toast, setToast] = useState(null)

  const handleSession = useCallback(
    (err) => {
      if (!isSessionError(err)) return false
      clearAdminToken()
      navigate('/admin', { replace: true })
      return true
    },
    [navigate],
  )

  const loadExpenses = useCallback(async () => {
    const token = getAdminToken()
    const data = await fetchFinanceExpenses(token)
    setExpenses(Array.isArray(data) ? data : [])
  }, [])

  const loadDebts = useCallback(async () => {
    setDebtsLoading(true)
    setDebtsError('')
    try {
      const token = getAdminToken()
      const data = await fetchFinanceDebts(token, {
        ...windowFromRange(debtsRange),
        currency: debtsCurrency || undefined,
        includeLiquidated,
        includeDeleted,
      })
      setDebts(data?.items ?? [])
      setDebtTotals(data?.totals ?? {})
    } catch (err) {
      if (handleSession(err)) return
      setDebts([])
      setDebtTotals({})
      setDebtsError(getUserFacingMessage(err, 'No pudimos cargar las deudas.'))
    } finally {
      setDebtsLoading(false)
    }
  }, [debtsCurrency, debtsRange, handleSession, includeDeleted, includeLiquidated])

  const loadLedger = useCallback(async () => {
    setLedgerLoading(true)
    setLedgerError('')
    try {
      const token = getAdminToken()
      const data = await fetchFinanceLedger(token, {
        ...windowFromRange(ledgerRange),
        currency: ledgerCurrency || undefined,
      })
      setLedgerItems(data?.items ?? [])
      setLedgerTotals(data?.totals ?? {})
    } catch (err) {
      if (handleSession(err)) return
      setLedgerItems([])
      setLedgerTotals({})
      setLedgerError(getUserFacingMessage(err, 'No pudimos cargar el libro.'))
    } finally {
      setLedgerLoading(false)
    }
  }, [handleSession, ledgerCurrency, ledgerRange])

  useEffect(() => {
    loadExpenses().catch((err) => {
      if (!handleSession(err)) setDebtsError(getUserFacingMessage(err, 'No pudimos cargar los gastos.'))
    })
  }, [handleSession, loadExpenses])

  useEffect(() => {
    loadDebts()
  }, [loadDebts])

  useEffect(() => {
    loadLedger()
  }, [loadLedger])

  async function refreshDebtsAndLedger() {
    await Promise.all([loadDebts(), loadLedger(), loadExpenses()])
  }

  return (
    <div className={`${adminSection} pb-24`}>
      <div className="mb-4 grid grid-cols-2 gap-2" role="tablist" aria-label="Finanzas">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={tab === item.id}
            className={tabClass(tab === item.id)}
            onClick={() => setTab(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === 'debts' ? (
        <FinanceDebtsSection
          debts={debts}
          totals={debtTotals}
          expenses={expenses}
          loading={debtsLoading}
          error={debtsError}
          generating={generating}
          includeLiquidated={includeLiquidated}
          onIncludeLiquidated={setIncludeLiquidated}
          includeDeleted={includeDeleted}
          onIncludeDeleted={setIncludeDeleted}
          currency={debtsCurrency}
          onCurrencyChange={setDebtsCurrency}
          onCreateExpense={async (payload) => {
            await createFinanceExpense(getAdminToken(), payload)
            await loadExpenses()
          }}
          onUpdateExpense={async (id, payload) => {
            await updateFinanceExpense(getAdminToken(), id, payload)
            await loadExpenses()
          }}
          onDeleteExpense={async (id) => {
            await deleteFinanceExpense(getAdminToken(), id)
            await loadExpenses()
          }}
          onGenerate={async () => {
            setGenerating(true)
            setDebtsError('')
            try {
              const result = await generateFinanceDebts(getAdminToken(), periodFromRange(debtsRange))
              await loadDebts()
              const created = Number(result?.created_count) || 0
              const message =
                result?.message ||
                (created
                  ? `Se generaron ${created} deudas.`
                  : 'No se pudieron generar deudas para este mes.')
              setToast({ type: created ? 'success' : 'error', message })
            } catch (err) {
              if (!handleSession(err)) {
                setToast({
                  type: 'error',
                  message: getUserFacingMessage(err, 'No pudimos generar las deudas.'),
                })
              }
            } finally {
              setGenerating(false)
            }
          }}
          onLiquidate={async (payload) => {
            await liquidateFinanceDebts(getAdminToken(), payload)
            await refreshDebtsAndLedger()
          }}
          onDeleteDebts={async (payload) => {
            await deleteFinanceDebts(getAdminToken(), payload)
            await loadDebts()
          }}
          onUpdateDebt={async (id, payload) => {
            await updateFinanceDebt(getAdminToken(), id, payload)
            await refreshDebtsAndLedger()
          }}
        />
      ) : (
        <FinanceLedgerSection
          items={ledgerItems}
          totals={ledgerTotals}
          loading={ledgerLoading}
          error={ledgerError}
          currency={ledgerCurrency}
          onCurrencyChange={setLedgerCurrency}
          onCreateExtraction={async (payload) => {
            await createFinanceExtraction(getAdminToken(), payload)
            await loadLedger()
          }}
        />
      )}

      {tab === 'debts' ? (
        <AdminDateRangeControls
          period={debtsPeriod}
          onPeriodChange={setDebtsPeriod}
          range={debtsRange}
          onRangeChange={(next) => setDebtsRange(next ?? rangeForPeriod(debtsPeriod))}
          applyPeriodToRange
          allowUntilTomorrow
        />
      ) : (
        <AdminDateRangeControls
          period={ledgerPeriod}
          onPeriodChange={setLedgerPeriod}
          range={ledgerRange}
          onRangeChange={(next) => setLedgerRange(next ?? rangeForPeriod(ledgerPeriod))}
          applyPeriodToRange
          allowUntilTomorrow
        />
      )}
      {toast ? (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      ) : null}
    </div>
  )
}

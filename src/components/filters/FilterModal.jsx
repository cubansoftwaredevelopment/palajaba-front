import { useEffect, useRef, useState } from 'react'
import AdminDateRangeControls from '../admin/AdminDateRangeControls'
import SellerFilterDropdown from '../seller/SellerFilterDropdown'
import SellerModalPortal from '../seller/SellerModalPortal'
import { sellerModalOverlay, sellerModalSheet } from '../seller/sellerStyles'
import { orderModalMotionClass, useOrderModalPresence } from '../../buyer/components/useOrderModalPresence'
import { clearedDateFilter } from './filterState.js'

export function FilterButton({ count, label, expanded, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={expanded}
      aria-label={label}
      title={label}
      className="absolute right-1.5 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-lg border border-brand-green/15 bg-brand-white text-brand-green shadow-sm"
    >
      <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 5h16l-6.2 7v5l-3.6 2v-7L4 5Z" /></svg>
      {count > 0 ? <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-brand-green px-1 text-[9px] font-bold leading-none text-white">{count}</span> : null}
    </button>
  )
}

export default function FilterModal({
  open,
  onClose,
  title,
  description,
  titleId,
  applyLabel,
  fields,
  values,
  onValuesChange,
  onApply,
  dateLabel,
  emptyValues,
  columns = 2,
}) {
  const deferred = typeof onApply === 'function'
  const { present, closing } = useOrderModalPresence(open)
  const [draft, setDraft] = useState(values)
  const [syncedOpen, setSyncedOpen] = useState(open)
  const onCloseRef = useRef(onClose)

  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  if (deferred && open !== syncedOpen) {
    setSyncedOpen(open)
    if (open) setDraft(values)
  }

  const current = deferred ? draft : values

  useEffect(() => {
    if (!present) return undefined
    function onKeyDown(event) {
      if (event.key === 'Escape') onCloseRef.current()
    }
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [present])

  function update(partial) {
    const next = { ...current, ...partial }
    if (deferred) setDraft(next)
    else onValuesChange(next)
  }

  function clear() {
    if (deferred) {
      setDraft(emptyValues)
      onApply(emptyValues)
      onClose()
      return
    }
    onValuesChange(emptyValues)
  }

  function apply() {
    if (deferred) onApply(current)
    onClose()
  }

  if (!present) return null

  return (
    <SellerModalPortal>
      <div
        className={`${sellerModalOverlay} ${orderModalMotionClass(closing)}`}
        role="presentation"
        onMouseDown={(event) => {
          if (event.target === event.currentTarget) onClose()
        }}
      >
        <section
          className={`${sellerModalSheet} h-auto max-h-[80dvh] overflow-visible ${columns === 2 ? 'max-w-2xl' : 'max-w-xl'}`}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
        >
          <header className="flex items-center justify-between border-b border-brand-green/10 px-5 py-4">
            <div>
              <h2 id={titleId} className="font-display text-lg font-bold text-brand-green">{title}</h2>
              {description ? <p className="mt-1 text-xs text-brand-carmelita/75">{description}</p> : null}
            </div>
            <button type="button" onClick={onClose} aria-label="Cerrar filtros" className="grid h-10 w-10 place-items-center rounded-full text-xl text-brand-carmelita/60 hover:bg-brand-green/5">×</button>
          </header>
          <div className={`grid flex-1 gap-4 overflow-y-auto p-5 ${columns === 2 ? 'sm:grid-cols-2' : ''}`}>
            {fields.map((field) => (
              <SellerFilterDropdown
                key={field.key}
                label={field.label}
                placeholder={field.placeholder}
                options={field.options}
                value={current[field.key]}
                onChange={(value) => update({ [field.key]: value })}
                multiple={Boolean(field.multiple)}
              />
            ))}
            {dateLabel ? (
              <div className={columns === 2 ? 'sm:col-span-2' : 'border-t border-brand-green/10 pt-4'}>
                <p className="mb-2 text-xs font-semibold text-brand-green">{dateLabel}</p>
                <AdminDateRangeControls
                  inline
                  period={current.datePeriod}
                  onPeriodChange={(period) => update({ datePeriod: period, dateEnabled: true })}
                  range={current.dateRange}
                  onRangeChange={(nextRange, nextPeriod) => {
                    if (nextRange) {
                      update({ dateRange: nextRange, datePeriod: nextPeriod || 'custom', dateEnabled: true })
                      return
                    }
                    update(clearedDateFilter())
                  }}
                  applyPeriodToRange
                />
              </div>
            ) : null}
          </div>
          <footer className="flex justify-between gap-3 border-t border-brand-green/10 p-4">
            <button type="button" onClick={clear} className="min-h-10 rounded-xl border border-brand-green/15 px-4 text-sm font-semibold text-brand-green">Limpiar filtros</button>
            <button type="button" onClick={apply} className="min-h-10 rounded-xl bg-brand-green px-5 text-sm font-semibold text-white">{applyLabel}</button>
          </footer>
        </section>
      </div>
    </SellerModalPortal>
  )
}

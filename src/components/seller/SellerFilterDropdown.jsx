import { useEffect, useRef, useState } from 'react'

export default function SellerFilterDropdown({ label, placeholder, options, value, onChange, multiple = false }) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null)
  const entries = options.map((option) => typeof option === 'object'
    ? { value: option.value, label: option.label ?? String(option.value) }
    : { value: option, label: option })
  const selected = multiple ? value : value ? [value] : []
  const selectedLabel = entries.find((entry) => entry.value === selected[0])?.label ?? selected[0]
  const labelText = selected.length === 0
    ? placeholder
    : multiple
      ? `${selected.length} seleccionado${selected.length === 1 ? '' : 's'}`
      : selectedLabel

  useEffect(() => {
    if (!open) return undefined
    rootRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    function closeOnOutside(event) {
      if (!rootRef.current?.contains(event.target)) setOpen(false)
    }
    document.addEventListener('pointerdown', closeOnOutside)
    return () => document.removeEventListener('pointerdown', closeOnOutside)
  }, [open])

  return (
    <div ref={rootRef} className="relative flex flex-col gap-1.5 text-xs font-semibold text-brand-green">
      <span>{label}</span>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-haspopup="listbox"
        className="flex min-h-11 items-center justify-between gap-3 rounded-xl border border-white bg-white px-3.5 text-left text-sm font-normal text-brand-carmelita shadow-sm transition hover:border-brand-green/25 focus:outline-none focus:ring-2 focus:ring-brand-green/15"
      >
        <span className={selected.length ? 'truncate text-brand-green' : 'truncate text-brand-carmelita/55'}>{labelText}</span>
        <svg className={`h-4 w-4 shrink-0 text-brand-green/65 transition-transform ${open ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
      </button>
      <div
        role="listbox"
        aria-label={label}
        aria-multiselectable={multiple}
        aria-hidden={!open}
        className={`rounded-xl border border-white bg-white shadow-[0_14px_36px_rgba(41,55,29,0.18)] transition-[max-height,opacity,margin,padding] duration-300 ease-out motion-reduce:transition-none ${open ? 'mt-1 max-h-48 overflow-y-auto p-1.5 opacity-100' : 'pointer-events-none mt-0 max-h-0 overflow-hidden border-transparent p-0 opacity-0 shadow-none'}`}
      >
        {!multiple ? (
          <button type="button" role="option" aria-selected={!value} onClick={() => { onChange(''); setOpen(false) }} className="w-full rounded-lg px-3 py-2.5 text-left text-sm font-normal text-brand-carmelita/75 hover:bg-brand-green/5">{placeholder}</button>
        ) : null}
        {entries.map((option) => {
          const checked = selected.includes(option.value)
          return (
            <button
              key={option.value}
              type="button"
              role="option"
              aria-selected={checked}
              onClick={() => {
                if (multiple) onChange(checked ? value.filter((item) => item !== option.value) : [...value, option.value])
                else { onChange(option.value); setOpen(false) }
              }}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-normal transition ${checked ? 'bg-brand-green/8 text-brand-green' : 'text-brand-carmelita hover:bg-brand-green/5'}`}
            >
              {multiple ? (
                <span className={`grid h-4 w-4 shrink-0 place-items-center rounded-[4px] border transition-colors ${checked ? 'border-brand-green bg-brand-green' : 'border-brand-green/30 bg-white'}`} aria-hidden="true">
                  {checked ? <svg viewBox="0 0 16 16" className="h-3 w-3" fill="none"><path d="m3.25 8.25 3 3L12.75 4.75" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg> : null}
                </span>
              ) : null}
              <span className="truncate">{option.label}</span>
            </button>
          )
        })}
        {entries.length === 0 ? <p className="px-3 py-2 text-sm font-normal text-brand-carmelita/60">No hay opciones disponibles</p> : null}
      </div>
    </div>
  )
}

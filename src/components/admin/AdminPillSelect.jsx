import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { adminFocusRing } from './adminStyles'

export default function AdminPillSelect({
  value,
  onChange,
  options,
  allLabel = 'Todos',
  ariaLabel,
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [place, setPlace] = useState(null)
  const buttonRef = useRef(null)
  const menuRef = useRef(null)
  const selected = options.find((option) => option.value === value)
  const showSearch = options.length > 8

  const visibleOptions = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return options
    return options.filter((option) => option.label.toLowerCase().includes(needle))
  }, [options, query])

  useEffect(() => {
    if (!open || !buttonRef.current) return undefined
    function updatePlace() {
      const rect = buttonRef.current?.getBoundingClientRect()
      if (!rect) return
      const width = Math.max(rect.width, 180)
      const left = Math.min(rect.left, window.innerWidth - width - 8)
      const spaceBelow = window.innerHeight - rect.bottom
      setPlace(
        spaceBelow < 220
          ? { left, width, bottom: window.innerHeight - rect.top + 6 }
          : { left, width, top: rect.bottom + 6 },
      )
    }
    updatePlace()
    window.addEventListener('resize', updatePlace)
    window.addEventListener('scroll', updatePlace, true)
    return () => {
      window.removeEventListener('resize', updatePlace)
      window.removeEventListener('scroll', updatePlace, true)
    }
  }, [open])

  useEffect(() => {
    if (!open) return undefined
    function handleKey(event) {
      if (event.key === 'Escape') setOpen(false)
    }
    function handlePointer(event) {
      const target = event.target
      if (buttonRef.current?.contains(target) || menuRef.current?.contains(target)) return
      setOpen(false)
    }
    document.addEventListener('keydown', handleKey)
    document.addEventListener('pointerdown', handlePointer)
    return () => {
      document.removeEventListener('keydown', handleKey)
      document.removeEventListener('pointerdown', handlePointer)
    }
  }, [open])

  const host = typeof document === 'undefined' ? null : document.querySelector('.admin-theme')

  function choose(next) {
    onChange(next)
    setOpen(false)
    setQuery('')
  }

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => setOpen((current) => !current)}
        className={`inline-flex min-h-9 w-full items-center justify-between gap-1 rounded-full border border-brand-green/40 bg-brand-green/10 px-3 text-left text-xs font-semibold text-brand-green ${adminFocusRing}`}
      >
        <span className="min-w-0 truncate">{selected?.label ?? allLabel}</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" className="shrink-0">
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      {open && place && host
        ? createPortal(
            <div
              ref={menuRef}
              role="listbox"
              className="fixed z-50 max-h-64 overflow-hidden rounded-2xl border border-brand-green/25 bg-[var(--admin-header)] p-1.5 shadow-[0_16px_40px_rgba(0,0,0,0.28)]"
              style={place}
            >
              {showSearch ? (
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Buscar"
                  aria-label={`Buscar en ${ariaLabel}`}
                  className="mb-1 w-full rounded-full border border-brand-green/25 bg-transparent px-3 py-1.5 text-xs text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-brand-green"
                />
              ) : null}
              <div className="max-h-52 overflow-y-auto">
                <button
                  type="button"
                  role="option"
                  aria-selected={!value}
                  onClick={() => choose('')}
                  className={`mb-0.5 flex w-full rounded-full px-3 py-1.5 text-left text-xs font-semibold ${
                    !value ? 'bg-brand-green text-brand-white' : 'text-brand-green hover:bg-brand-green/10'
                  }`}
                >
                  {allLabel}
                </button>
                {visibleOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    role="option"
                    aria-selected={option.value === value}
                    onClick={() => choose(option.value)}
                    className={`mb-0.5 flex w-full rounded-full px-3 py-1.5 text-left text-xs font-semibold ${
                      option.value === value
                        ? 'bg-brand-green text-brand-white'
                        : 'text-zinc-100 hover:bg-brand-green/10 hover:text-brand-green'
                    }`}
                  >
                    <span className="min-w-0 truncate">{option.label}</span>
                  </button>
                ))}
                {visibleOptions.length === 0 ? (
                  <p className="px-3 py-2 text-xs text-zinc-500">Sin coincidencias</p>
                ) : null}
              </div>
            </div>,
            host,
          )
        : null}
    </>
  )
}

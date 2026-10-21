import { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { adminFocusRing, adminInput } from './adminStyles'

export default function AdminMultiSelect({
  id,
  values = [],
  onChange,
  options,
  placeholder = 'Seleccionar…',
  disabled = false,
  ariaLabel,
  className = '',
  dropdownZIndex = 70,
}) {
  const listId = useId()
  const buttonRef = useRef(null)
  const menuRef = useRef(null)
  const [open, setOpen] = useState(false)
  const [place, setPlace] = useState(null)

  const selected = options.filter((option) => values.includes(option.value))
  const summary =
    selected.length === 0
      ? placeholder
      : selected.length <= 2
        ? selected.map((option) => option.label).join(', ')
        : `${selected.length} seleccionados`

  useEffect(() => {
    if (!open || !buttonRef.current) return undefined
    function updatePlace() {
      const rect = buttonRef.current?.getBoundingClientRect()
      if (!rect) return
      const width = Math.max(rect.width, 220)
      const left = Math.min(Math.max(8, rect.left), window.innerWidth - width - 8)
      const spaceBelow = window.innerHeight - rect.bottom
      setPlace({
        left,
        width,
        zIndex: dropdownZIndex,
        ...(spaceBelow < 260 && rect.top > spaceBelow
          ? { bottom: window.innerHeight - rect.top + 6 }
          : { top: rect.bottom + 6 }),
      })
    }
    updatePlace()
    window.addEventListener('resize', updatePlace)
    window.addEventListener('scroll', updatePlace, true)
    return () => {
      window.removeEventListener('resize', updatePlace)
      window.removeEventListener('scroll', updatePlace, true)
    }
  }, [dropdownZIndex, open])

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

  function toggle(value) {
    if (values.includes(value)) {
      onChange(values.filter((item) => item !== value))
      return
    }
    onChange([...values, value])
  }

  const host = typeof document === 'undefined' ? null : document.querySelector('.admin-theme') ?? document.body

  return (
    <div className={className}>
      <button
        ref={buttonRef}
        id={id}
        type="button"
        disabled={disabled}
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={listId}
        onClick={() => setOpen((current) => !current)}
        className={`${adminInput} flex items-center justify-between gap-2 text-left disabled:cursor-not-allowed disabled:opacity-50 ${adminFocusRing}`}
      >
        <span className={`min-w-0 truncate ${selected.length ? 'text-zinc-100' : 'text-zinc-500'}`}>
          {summary}
        </span>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
          className={`shrink-0 text-zinc-400 transition-transform ${open ? 'rotate-180' : ''}`}
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      {open && place && host
        ? createPortal(
            <div
              ref={menuRef}
              id={listId}
              role="listbox"
              aria-multiselectable="true"
              aria-label={ariaLabel}
              className="fixed max-h-72 overflow-y-auto rounded-2xl border border-brand-green/25 bg-[var(--admin-header)] p-1.5 shadow-[0_16px_40px_rgba(0,0,0,0.28)]"
              style={place}
            >
              {options.map((option) => {
                const isSelected = values.includes(option.value)
                return (
                  <button
                    key={option.value}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => toggle(option.value)}
                    className={`mb-0.5 flex w-full items-center gap-2 rounded-full px-3 py-1.5 text-left text-sm font-semibold last:mb-0 ${
                      isSelected
                        ? 'bg-brand-green text-brand-white'
                        : 'text-zinc-100 hover:bg-brand-green/10 hover:text-brand-green'
                    }`}
                  >
                    <span
                      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                        isSelected ? 'border-brand-white bg-brand-white text-brand-green' : 'border-zinc-500'
                      }`}
                      aria-hidden="true"
                    >
                      {isSelected ? (
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                          <path d="M5 12l5 5L20 7" />
                        </svg>
                      ) : null}
                    </span>
                    <span className="min-w-0 truncate">{option.label}</span>
                  </button>
                )
              })}
            </div>,
            host,
          )
        : null}
    </div>
  )
}

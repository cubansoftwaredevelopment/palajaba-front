import { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { adminFocusRing, adminInput } from './adminStyles'

export default function AdminSelect({
  id,
  value,
  onChange,
  options,
  placeholder = 'Seleccionar…',
  disabled = false,
  ariaLabel,
  className = '',
  triggerClassName = '',
  variant = 'field',
  dropdownZIndex = 60,
}) {
  const listId = useId()
  const buttonRef = useRef(null)
  const menuRef = useRef(null)
  const [open, setOpen] = useState(false)
  const [place, setPlace] = useState(null)
  const [activeIndex, setActiveIndex] = useState(0)

  const selectedIndex = options.findIndex((option) => option.value === value)
  const selected = selectedIndex >= 0 ? options[selectedIndex] : null

  useEffect(() => {
    if (!open || !buttonRef.current) return undefined
    function updatePlace() {
      const rect = buttonRef.current?.getBoundingClientRect()
      if (!rect) return
      const width = Math.max(rect.width, 148)
      const left = Math.min(Math.max(8, rect.left), window.innerWidth - width - 8)
      const spaceBelow = window.innerHeight - rect.bottom
      setPlace({
        left,
        width,
        zIndex: dropdownZIndex,
        ...(spaceBelow < 220 && rect.top > spaceBelow
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

  function openList() {
    if (disabled) return
    setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0)
    setOpen(true)
  }

  function choose(option) {
    onChange(option.value)
    setOpen(false)
    buttonRef.current?.focus()
  }

  function handleTriggerKeyDown(event) {
    if (disabled) return
    if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      if (!open) openList()
      else if (event.key === 'ArrowDown') {
        setActiveIndex((current) => Math.min(options.length - 1, current + 1))
      } else if (options[activeIndex]) {
        choose(options[activeIndex])
      }
      return
    }
    if (!open) return
    if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveIndex((current) => Math.max(0, current - 1))
    }
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
        onClick={() => (open ? setOpen(false) : openList())}
        onKeyDown={handleTriggerKeyDown}
        className={`${
          variant === 'plain'
            ? 'flex h-full min-h-12 w-full items-center justify-between gap-1 border-0 border-l border-zinc-800/90 bg-zinc-950/40 px-3 text-left text-sm font-semibold outline-none'
            : `${adminInput} flex items-center justify-between gap-2 text-left`
        } disabled:cursor-not-allowed disabled:opacity-50 ${adminFocusRing} ${triggerClassName}`}
      >
        <span className={`min-w-0 truncate ${selected ? 'text-zinc-100' : 'text-zinc-500'}`}>
          {selected?.label ?? placeholder}
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
              aria-label={ariaLabel}
              className="fixed max-h-64 overflow-y-auto rounded-2xl border border-brand-green/25 bg-[var(--admin-header)] p-1.5 shadow-[0_16px_40px_rgba(0,0,0,0.28)]"
              style={place}
            >
              {options.map((option, index) => {
                const isSelected = option.value === value
                const active = index === activeIndex
                return (
                  <button
                    key={option.value || `empty-${index}`}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => choose(option)}
                    className={`mb-0.5 flex w-full rounded-full px-3 py-1.5 text-left text-sm font-semibold last:mb-0 ${
                      isSelected
                        ? 'bg-brand-green text-brand-white'
                        : active
                          ? 'bg-brand-green/10 text-brand-green'
                          : 'text-zinc-100 hover:bg-brand-green/10 hover:text-brand-green'
                    }`}
                  >
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

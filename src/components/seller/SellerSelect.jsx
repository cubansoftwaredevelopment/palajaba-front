import { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { sellerFocusRing, sellerInput, sellerModalInput } from './sellerStyles'

export default function SellerSelect({
  id,
  value,
  onChange,
  options,
  disabled = false,
  modal = false,
  dropdownZIndex = 220,
  ariaLabel,
}) {
  const listId = useId()
  const rootRef = useRef(null)
  const panelRef = useRef(null)
  const triggerRef = useRef(null)
  const [open, setOpen] = useState(false)
  const [panelStyle, setPanelStyle] = useState(null)
  const [activeIndex, setActiveIndex] = useState(0)

  const selectedIndex = options.findIndex((option) => option.value === value)
  const selected = selectedIndex >= 0 ? options[selectedIndex] : null
  const inputClassName = modal ? sellerModalInput : sellerInput

  useEffect(() => {
    if (!open) return undefined

    function updatePosition() {
      const trigger = triggerRef.current
      if (!trigger) return
      const rect = trigger.getBoundingClientRect()
      const spaceBelow = window.innerHeight - rect.bottom
      const openUp = spaceBelow < 200 && rect.top > spaceBelow
      setPanelStyle({
        position: 'fixed',
        left: rect.left,
        width: rect.width,
        zIndex: dropdownZIndex,
        ...(openUp
          ? { bottom: window.innerHeight - rect.top + 4 }
          : { top: rect.bottom + 4 }),
      })
    }

    updatePosition()
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)
    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [open, dropdownZIndex])

  useEffect(() => {
    if (!open) return undefined

    function handlePointerDown(event) {
      const target = event.target
      if (rootRef.current?.contains(target) || panelRef.current?.contains(target)) return
      setOpen(false)
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
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
    triggerRef.current?.focus()
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

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={triggerRef}
        id={id}
        type="button"
        disabled={disabled}
        onClick={() => (open ? setOpen(false) : openList())}
        onKeyDown={handleTriggerKeyDown}
        className={`${inputClassName} flex items-center justify-between gap-2 text-left disabled:cursor-not-allowed disabled:opacity-60 ${sellerFocusRing}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={ariaLabel}
      >
        <span className={selected ? 'font-semibold text-brand-green' : 'text-brand-carmelita/70'}>
          {selected?.label ?? 'Seleccionar…'}
        </span>
        <svg
          width="16"
          height="16"
          viewBox="0 0 20 20"
          fill="currentColor"
          className={`shrink-0 text-brand-carmelita/70 transition-transform ${open ? 'rotate-180' : ''}`}
          aria-hidden
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {open && panelStyle
        ? createPortal(
        <ul
          ref={panelRef}
          id={listId}
          role="listbox"
          aria-label={ariaLabel}
          style={panelStyle}
          className="max-h-52 overflow-y-auto rounded-xl border border-brand-green/15 bg-brand-white py-1 shadow-[0_12px_32px_rgba(89,128,44,0.18)]"
        >
          {options.map((option, index) => {
            const active = index === activeIndex
            const isSelected = option.value === value
            return (
              <li key={option.value || 'empty'} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => choose(option)}
                  className={`flex w-full px-3 py-2 text-left text-sm text-brand-green touch-manipulation ${
                    active || isSelected ? 'bg-brand-green/10' : 'active:bg-brand-yellow/15'
                  } ${isSelected ? 'font-semibold' : ''}`}
                >
                  {option.label}
                </button>
              </li>
            )
          })}
        </ul>,
        document.body,
      )
        : null}
    </div>
  )
}

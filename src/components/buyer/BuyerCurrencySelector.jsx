import { useEffect, useId, useRef, useState } from 'react'
import { DISPLAY_CURRENCIES } from '../../constants/currencies'
import { useBuyerDisplayCurrency } from '../../context/BuyerDisplayCurrencyContext'
import { buyerCurrencyOption, buyerCurrencyPanel, buyerCurrencyTrigger } from './buyerStyles'

export default function BuyerCurrencySelector({ panelZIndex = 60 }) {
  const listId = useId()
  const rootRef = useRef(null)
  const triggerRef = useRef(null)
  const { currency, setCurrency } = useBuyerDisplayCurrency()
  const [open, setOpen] = useState(false)
  const [panelStyle, setPanelStyle] = useState(null)

  const selected = DISPLAY_CURRENCIES.find((item) => item.code === currency) ?? DISPLAY_CURRENCIES[0]

  useEffect(() => {
    if (!open) return undefined

    function updatePosition() {
      const trigger = triggerRef.current
      if (!trigger) return
      const rect = trigger.getBoundingClientRect()
      setPanelStyle({
        position: 'fixed',
        top: rect.bottom + 6,
        right: window.innerWidth - rect.right,
        zIndex: panelZIndex,
      })
    }

    updatePosition()
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)

    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [open, panelZIndex])

  useEffect(() => {
    if (!open) return undefined

    function handlePointerDown(event) {
      if (!rootRef.current?.contains(event.target)) {
        setOpen(false)
      }
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

  function handleSelect(code) {
    setCurrency(code)
    setOpen(false)
  }

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((current) => !current)}
        className={buyerCurrencyTrigger}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={`Moneda de visualización: ${selected.fullLabel}`}
      >
        <span className="font-display text-sm font-bold">{selected.label}</span>
        <svg
          width="14"
          height="14"
          viewBox="0 0 20 20"
          fill="currentColor"
          className={`text-brand-carmelita/70 transition-transform ${open ? 'rotate-180' : ''}`}
          aria-hidden
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {open && panelStyle ? (
        <ul
          id={listId}
          role="listbox"
          aria-label="Moneda de visualización"
          className={buyerCurrencyPanel}
          style={panelStyle}
        >
          {DISPLAY_CURRENCIES.map((item) => {
            const active = item.code === currency
            return (
              <li key={item.code} role="option" aria-selected={active}>
                <button
                  type="button"
                  onClick={() => handleSelect(item.code)}
                  className={buyerCurrencyOption(active)}
                >
                  <span className="font-display font-bold">{item.label}</span>
                  <span className="text-[0.65rem] font-medium text-brand-carmelita/80">{item.fullLabel}</span>
                </button>
              </li>
            )
          })}
        </ul>
      ) : null}
    </div>
  )
}

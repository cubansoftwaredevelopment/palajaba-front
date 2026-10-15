import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { DISPLAY_CURRENCIES } from '../../constants/currencies'
import { useBuyerDisplayCurrency } from '../../context/BuyerDisplayCurrencyContext'

const SLIDE_MS = 320

function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export default function BuyerCurrencyTag() {
  const listId = useId()
  const shellRef = useRef(null)
  const trackRef = useRef(null)
  const closedMeasureRef = useRef(null)
  const { currency, setCurrency } = useBuyerDisplayCurrency()
  const [open, setOpen] = useState(false)
  const [motion, setMotion] = useState(null)
  const selected = DISPLAY_CURRENCIES.find((item) => item.code === currency) ?? DISPLAY_CURRENCIES[0]

  useEffect(() => {
    if (!open) return undefined
    function onKeyDown(event) {
      if (event.key !== 'Escape') return
      setMotion(null)
      setOpen(false)
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open])

  useLayoutEffect(() => {
    const shell = shellRef.current
    const track = trackRef.current
    if (!shell) return undefined

    function clearStyles() {
      shell.style.width = ''
      shell.style.transition = ''
      if (track) {
        track.style.transform = ''
        track.style.transition = ''
      }
    }

    if (!motion || prefersReducedMotion()) {
      clearStyles()
      return undefined
    }

    if (motion.type === 'open') {
      const toWidth = shell.offsetWidth
      shell.style.transition = 'none'
      shell.style.width = `${motion.fromWidth}px`
      if (track) {
        track.style.transition = 'none'
        track.style.transform = 'translateX(-16px)'
      }
      shell.getBoundingClientRect()
      shell.style.transition = `width ${SLIDE_MS}ms ease`
      shell.style.width = `${toWidth}px`
      if (track) {
        track.style.transition = `transform ${SLIDE_MS}ms ease`
        track.style.transform = 'translateX(0px)'
      }
      const clear = (event) => {
        if (event && event.target !== shell) return
        if (event && event.propertyName !== 'width') return
        clearStyles()
        setMotion(null)
      }
      shell.addEventListener('transitionend', clear)
      const timer = window.setTimeout(clear, SLIDE_MS + 40)
      return () => {
        window.clearTimeout(timer)
        shell.removeEventListener('transitionend', clear)
      }
    }

    if (motion.type === 'close' && open) {
      const closedWidth = closedMeasureRef.current?.offsetWidth || motion.fromWidth
      shell.style.transition = 'none'
      shell.style.width = `${motion.fromWidth}px`
      if (track) track.style.transition = 'none'
      shell.getBoundingClientRect()
      shell.style.transition = `width ${SLIDE_MS}ms ease`
      shell.style.width = `${closedWidth}px`
      if (track) {
        track.style.transition = `transform ${SLIDE_MS}ms ease`
        track.style.transform = `translateX(-${motion.shift}px)`
      }
      const finish = (event) => {
        if (event && event.target !== shell) return
        if (event && event.propertyName !== 'width') return
        setMotion({ type: 'settle' })
        setOpen(false)
      }
      shell.addEventListener('transitionend', finish)
      const timer = window.setTimeout(() => finish(), SLIDE_MS + 40)
      return () => {
        window.clearTimeout(timer)
        shell.removeEventListener('transitionend', finish)
      }
    }

    clearStyles()
    if (motion.type === 'settle') setMotion(null)
    return undefined
  }, [motion, open])

  function openTag() {
    setMotion({ type: 'open', fromWidth: shellRef.current?.offsetWidth ?? 0 })
    setOpen(true)
  }

  function choose(code, event) {
    if (prefersReducedMotion()) {
      setCurrency(code)
      setOpen(false)
      return
    }
    const shell = shellRef.current
    const option = event.currentTarget.getBoundingClientRect()
    const shellBox = shell?.getBoundingClientRect()
    setCurrency(code)
    setMotion({
      type: 'close',
      fromWidth: shell?.offsetWidth ?? 0,
      shift: shellBox ? Math.max(0, option.left - shellBox.left) : 0,
    })
  }

  return (
    <div className="relative z-20 shrink-0">
      <div className="mx-auto flex w-full max-w-5xl px-5 py-2 lg:px-10">
        <div className="relative -ml-1">
          <div
            ref={closedMeasureRef}
            aria-hidden="true"
            className="pointer-events-none invisible absolute inline-flex items-center gap-1.5 rounded-full border border-transparent px-2.5 py-1 text-xs whitespace-nowrap"
          >
            <span className="font-medium">Moneda</span>
            <span className="font-bold">{selected.label}</span>
          </div>
          <div
            ref={shellRef}
            id={listId}
            role="listbox"
            aria-label="Moneda de visualización"
            aria-expanded={open}
            className={`inline-flex max-w-full items-center overflow-hidden rounded-full border border-brand-green/20 bg-transparent ${
              open ? 'p-0.5' : ''
            }`}
          >
            {open ? (
              <div ref={trackRef} className="flex items-center gap-0.5">
                {DISPLAY_CURRENCIES.map((item) => {
                  const active = item.code === currency
                  return (
                    <button
                      key={item.code}
                      type="button"
                      role="option"
                      aria-selected={active}
                      aria-label={item.fullLabel}
                      onClick={(event) => choose(item.code, event)}
                      className={`rounded-full px-2.5 py-1 text-xs font-bold whitespace-nowrap transition-colors touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green/25 ${
                        active
                          ? 'bg-brand-green text-brand-white'
                          : 'text-brand-green active:bg-brand-yellow/25'
                      }`}
                    >
                      {item.label}
                    </button>
                  )
                })}
              </div>
            ) : (
              <button
                type="button"
                onClick={openTag}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs whitespace-nowrap touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green/25"
                aria-label={`Cambiar moneda, ${selected.fullLabel}`}
              >
                <span className="font-medium text-brand-carmelita/80">Moneda</span>
                <span className="font-bold text-brand-green">{selected.label}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

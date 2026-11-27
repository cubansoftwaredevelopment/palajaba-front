import { useEffect, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'

const PILL_SPRING = { type: 'spring', stiffness: 420, damping: 34 }
const SWIPE_MEDIA = '(max-width: 1023px)'
const SWIPE_DISTANCE = 80
const SWIPE_FLICK = 0.65
const SWIPE_LOCK = 12

function badgeClass(option, selected) {
  if (typeof option.badgeClassName === 'function') return option.badgeClassName(selected)
  if (option.badgeClassName) return option.badgeClassName
  return selected ? 'bg-brand-white/20 text-brand-white' : 'bg-brand-green/10 text-brand-green'
}

export default function PillTabs({
  options,
  value,
  onChange,
  ariaLabel,
  className = 'mb-4',
  selectionRole = 'tab',
}) {
  const reduced = useReducedMotion()
  const [node, setNode] = useState(null)
  const onChangeRef = useRef(onChange)
  const optionsRef = useRef(options)
  const valueRef = useRef(value)
  const suppressClick = useRef(false)
  onChangeRef.current = onChange
  optionsRef.current = options
  valueRef.current = value

  const count = Math.max(options.length, 1)
  const index = Math.max(0, options.findIndex((option) => option.id === value))
  const radio = selectionRole === 'radio'

  useEffect(() => {
    if (!node) return undefined
    let drag = null

    function onStart(event) {
      if (!window.matchMedia(SWIPE_MEDIA).matches || event.touches.length !== 1) return
      const touch = event.touches[0]
      drag = { x: touch.clientX, y: touch.clientY, t: event.timeStamp, locked: null }
    }

    function onMove(event) {
      if (!drag || event.touches.length !== 1) return
      const touch = event.touches[0]
      const dx = touch.clientX - drag.x
      const dy = touch.clientY - drag.y
      if (!drag.locked) {
        if (Math.abs(dx) < SWIPE_LOCK && Math.abs(dy) < SWIPE_LOCK) return
        drag.locked = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y'
      }
      if (drag.locked === 'x') event.preventDefault()
    }

    function onEnd(event) {
      const current = drag
      drag = null
      if (!current || current.locked !== 'x') return
      const touch = event.changedTouches?.[0]
      if (!touch) return
      const dx = touch.clientX - current.x
      const dy = touch.clientY - current.y
      if (Math.abs(dx) <= Math.abs(dy)) return
      const velocity = Math.abs(dx) / Math.max(event.timeStamp - current.t, 1)
      if (Math.abs(dx) < SWIPE_DISTANCE && velocity < SWIPE_FLICK) return
      const list = optionsRef.current
      const currentIndex = Math.max(0, list.findIndex((option) => option.id === valueRef.current))
      const nextIndex = dx < 0 ? currentIndex + 1 : currentIndex - 1
      const next = list[nextIndex]
      if (!next) return
      suppressClick.current = true
      onChangeRef.current(next.id)
      window.setTimeout(() => { suppressClick.current = false }, 400)
    }

    function onCancel() {
      drag = null
    }

    node.addEventListener('touchstart', onStart, { passive: true })
    node.addEventListener('touchmove', onMove, { passive: false })
    node.addEventListener('touchend', onEnd)
    node.addEventListener('touchcancel', onCancel)
    return () => {
      node.removeEventListener('touchstart', onStart)
      node.removeEventListener('touchmove', onMove)
      node.removeEventListener('touchend', onEnd)
      node.removeEventListener('touchcancel', onCancel)
    }
  }, [node])

  return (
    <div
      ref={setNode}
      data-pill-tabs=""
      className={`relative flex rounded-full border border-brand-green/15 bg-brand-white p-1 ${className}`}
      role={radio ? 'radiogroup' : 'tablist'}
      aria-label={ariaLabel}
    >
      <motion.span
        aria-hidden
        className="absolute top-1 bottom-1 left-1 rounded-full bg-brand-green shadow-sm"
        style={{ width: `calc(${100 / count}% - 4px)` }}
        initial={false}
        animate={{ x: `${index * 100}%` }}
        transition={reduced ? { duration: 0 } : PILL_SPRING}
      />
      {options.map((option) => {
        const selected = value === option.id
        return (
          <button
            key={option.id}
            type="button"
            role={radio ? 'radio' : 'tab'}
            aria-selected={radio ? undefined : selected}
            aria-checked={radio ? selected : undefined}
            onClick={() => {
              if (suppressClick.current) {
                suppressClick.current = false
                return
              }
              onChange(option.id)
            }}
            className={`relative z-10 flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full px-3 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green/25 focus-visible:ring-offset-2 focus-visible:ring-offset-brand-white ${
              selected ? 'text-brand-white' : 'text-brand-green sm:hover:bg-brand-yellow/15'
            }`}
          >
            <span className="truncate">{option.label}</span>
            {option.badge != null ? (
              <span className={`shrink-0 rounded-full px-2 py-0.5 text-[0.62rem] font-bold tabular-nums ${badgeClass(option, selected)}`}>
                {option.badge}
              </span>
            ) : null}
          </button>
        )
      })}
    </div>
  )
}

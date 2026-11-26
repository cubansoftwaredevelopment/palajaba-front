import { useEffect, useRef, useState } from 'react'
import { animate, useReducedMotion } from 'framer-motion'

function formatAmount(value, digits) {
  return Number(value).toLocaleString('es', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })
}

export default function CountingAmount({ value, currency = '', fractionDigits = 0 }) {
  const reduced = useReducedMotion()
  const target = Number(value)
  const [shown, setShown] = useState(Number.isFinite(target) ? target : 0)
  const shownRef = useRef(shown)
  const readyRef = useRef(false)

  useEffect(() => {
    if (!Number.isFinite(target)) return undefined
    const from = shownRef.current
    if (!readyRef.current || reduced || from === target) {
      readyRef.current = true
      shownRef.current = target
      setShown(target)
      return undefined
    }
    const delta = Math.abs(target - from)
    const controls = animate(from, target, {
      duration: Math.min(0.85, Math.max(0.45, 0.32 + Math.log10(delta + 1) * 0.22)),
      ease: 'linear',
      onUpdate: (next) => {
        shownRef.current = next
        setShown(next)
      },
    })
    return () => controls.stop()
  }, [target, reduced])

  if (!Number.isFinite(target) && !Number.isFinite(shownRef.current)) return null

  const moving = Math.abs(shown - target) > 0.05
  const digits = moving ? Math.max(fractionDigits, 2) : fractionDigits
  const text = `${formatAmount(shown, digits)}${currency ? ` ${currency}` : ''}`
  return <span className="tabular-nums">{text}</span>
}

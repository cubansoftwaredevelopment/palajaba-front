import { useEffect, useState } from 'react'
import { useReducedMotion } from 'framer-motion'

const CHARS_PER_SECOND = 120

function collapsedText(text, limit) {
  if (text.length <= limit) return text
  return `${text.slice(0, limit).trimEnd()}…`
}

function collapsedLength(text, limit) {
  if (text.length <= limit) return text.length
  return text.slice(0, limit).trimEnd().length
}

export default function TypeRevealText({ text, limit, expanded, className }) {
  const reduced = useReducedMotion()
  const full = text ?? ''
  const start = collapsedLength(full, limit)
  const [count, setCount] = useState(() => (expanded ? full.length : start))

  useEffect(() => {
    if (!expanded || reduced || start >= full.length) {
      setCount(expanded ? full.length : start)
      return undefined
    }

    setCount(start)
    const started = performance.now()
    let frame = 0

    const tick = (now) => {
      const next = Math.min(full.length, start + Math.floor(((now - started) / 1000) * CHARS_PER_SECOND))
      setCount(next)
      if (next < full.length) frame = requestAnimationFrame(tick)
    }

    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [expanded, full, reduced, start])

  const visible = expanded && count > start ? full.slice(0, count) : collapsedText(full, limit)

  return (
    <p className={className}>
      <span aria-hidden="true">{visible}</span>
      <span className="sr-only">{expanded ? full : collapsedText(full, limit)}</span>
    </p>
  )
}

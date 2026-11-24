import { useEffect, useState } from 'react'

const TYPE_MS = 58
const ERASE_MS = 32
const HOLD_MS = 1400
const GAP_MS = 320

export function useTypingPlaceholder(phrases) {
  const [text, setText] = useState('')

  useEffect(() => {
    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) {
      setText(phrases[0] || '')
      return undefined
    }

    let phraseIndex = 0
    let count = 0
    let erasing = false
    let timer = 0

    const step = () => {
      const phrase = phrases[phraseIndex] || ''
      if (!erasing) {
        count += 1
        setText(phrase.slice(0, count))
        if (count >= phrase.length) {
          erasing = true
          timer = window.setTimeout(step, HOLD_MS)
          return
        }
        timer = window.setTimeout(step, TYPE_MS)
        return
      }
      count -= 1
      setText(phrase.slice(0, Math.max(0, count)))
      if (count <= 0) {
        erasing = false
        phraseIndex = (phraseIndex + 1) % phrases.length
        timer = window.setTimeout(step, GAP_MS)
        return
      }
      timer = window.setTimeout(step, ERASE_MS)
    }

    timer = window.setTimeout(step, 360)
    return () => window.clearTimeout(timer)
  }, [phrases])

  return text
}

export function SearchHint({ text, className }) {
  return (
    <span
      className={`pointer-events-none absolute flex items-center overflow-hidden text-sm text-brand-carmelita/45 ${className}`}
      aria-hidden="true"
    >
      <span className="truncate">{text}</span>
      <span className="ml-px inline-block h-4 w-px shrink-0 bg-brand-carmelita/40 motion-safe:animate-pulse" />
    </span>
  )
}

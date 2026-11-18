import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, useReducedMotion } from 'framer-motion'

const BURST_MS = 640

const SPLASHES = [
  { x: -22, y: -18, size: 6, color: 'bg-brand-yellow', delay: 0 },
  { x: 20, y: -20, size: 5, color: 'bg-brand-green', delay: 0.02 },
  { x: -24, y: 6, size: 5, color: 'bg-brand-green', delay: 0.04 },
  { x: 22, y: 10, size: 6, color: 'bg-brand-yellow', delay: 0.03 },
  { x: -4, y: -26, size: 4, color: 'bg-brand-yellow', delay: 0.05 },
  { x: 6, y: 24, size: 4, color: 'bg-brand-green', delay: 0.04 },
  { x: -16, y: 18, size: 5, color: 'bg-brand-yellow', delay: 0.06 },
  { x: 16, y: -4, size: 3, color: 'bg-brand-green', delay: 0.02 },
  { x: -10, y: -8, size: 3, color: 'bg-brand-yellow', delay: 0.01 },
  { x: 10, y: 6, size: 3, color: 'bg-brand-green', delay: 0.05 },
]

function BookmarkSplash({ origin }) {
  return createPortal(
    <div
      className="pointer-events-none fixed z-[140]"
      style={{ left: origin.x, top: origin.y }}
      aria-hidden="true"
    >
      {SPLASHES.map((drop) => (
        <motion.span
          key={`${origin.key}-${drop.x}-${drop.y}`}
          className={`absolute rounded-full ${drop.color}`}
          style={{ width: drop.size, height: drop.size, marginLeft: -drop.size / 2, marginTop: -drop.size / 2 }}
          initial={{ x: 0, y: 0, scale: 0.2, opacity: 1 }}
          animate={{ x: drop.x, y: drop.y, scale: [0.2, 1.15, 0.7], opacity: [1, 1, 0] }}
          transition={{ duration: 0.58, delay: drop.delay, ease: [0.22, 1, 0.36, 1] }}
        />
      ))}
    </div>,
    document.body,
  )
}

export default function FavoriteBookmarkButton({
  saved = false,
  onClick,
  className = '',
  iconSize = 19,
}) {
  const reduced = useReducedMotion()
  const buttonRef = useRef(null)
  const [burst, setBurst] = useState(false)
  const [origin, setOrigin] = useState(null)

  useEffect(() => {
    if (!burst) return undefined
    const timer = window.setTimeout(() => {
      setBurst(false)
      setOrigin(null)
    }, BURST_MS)
    return () => window.clearTimeout(timer)
  }, [burst, origin])

  async function handleClick(event) {
    const result = await onClick?.(event)
    if (result !== 'saved' && result !== 'removed' || reduced) return
    const rect = buttonRef.current?.getBoundingClientRect()
    if (rect) {
      setOrigin({
        key: Date.now(),
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      })
    }
    setBurst(true)
  }

  return (
    <>
      <motion.button
        ref={buttonRef}
        type="button"
        onClick={handleClick}
        className={className}
        whileTap={reduced || burst ? undefined : { scale: 0.9 }}
        animate={reduced ? undefined : burst ? { scale: [1, 1.55, 0.92, 1] } : { scale: 1 }}
        transition={burst ? { duration: 0.58, times: [0, 0.32, 0.68, 1], ease: [0.22, 1, 0.36, 1] } : { duration: 0.16 }}
        aria-label={saved ? 'Quitar de guardados' : 'Guardar oferta'}
        title={saved ? 'Quitar de guardados' : 'Guardar oferta'}
      >
        <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill={saved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M6 4.75A1.75 1.75 0 0 1 7.75 3h8.5A1.75 1.75 0 0 1 18 4.75V21l-6-4-6 4V4.75Z" />
        </svg>
      </motion.button>
      {origin ? <BookmarkSplash origin={origin} /> : null}
    </>
  )
}

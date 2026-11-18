import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { animate, motion, useMotionValue, useReducedMotion } from 'framer-motion'
import { stepShift } from '../motion/presets'
import { FRONTEND_READY_EVENT } from '../lib/frontendReady'

const TAGLINE = 'El que quiere vender vende y que que quiere comprar resuelve'
const LABEL = "Pa' La Jaba"
const TRAVEL_S = 0.4
const HOLD_MS = 1000
const HOP_S = 0.42
const GAP = 10

function measureLabel(stage, row) {
  const textNode = row.firstChild
  if (!textNode || textNode.nodeType !== Node.TEXT_NODE) return null
  const stageBox = stage.getBoundingClientRect()
  const textBox = row.getBoundingClientRect()
  const stops = []
  let start = textBox.left - stageBox.left
  for (let i = 0; i < LABEL.length; i += 1) {
    if (LABEL[i] === ' ') continue
    const range = document.createRange()
    range.setStart(textNode, 0)
    range.setEnd(textNode, i + 1)
    const rect = range.getBoundingClientRect()
    if (stops.length === 0) {
      const head = document.createRange()
      head.setStart(textNode, 0)
      head.setEnd(textNode, 1)
      start = head.getBoundingClientRect().left - stageBox.left
    }
    stops.push(rect.right - stageBox.left)
  }
  if (!stops.length) return null
  return {
    start,
    stops,
    textLeft: textBox.left - stageBox.left,
    textWidth: textBox.width,
  }
}

export default function BootSplash() {
  const reduced = useReducedMotion()
  const location = useLocation()
  const choosingLocation =
    location.pathname === '/comprar/provincia' ||
    location.pathname === '/comprar/municipio'
  const readyRef = useRef(false)
  const stageRef = useRef(null)
  const rowRef = useRef(null)
  const logoX = useMotionValue(0)
  const logoY = useMotionValue(0)
  const [metrics, setMetrics] = useState(null)
  const [cursor, setCursor] = useState(-1)
  const [leaving, setLeaving] = useState(false)
  const [gone, setGone] = useState(false)
  const [entered, setEntered] = useState(false)

  useEffect(() => {
    if (entered || choosingLocation) document.getElementById('boot-splash')?.remove()
  }, [entered, choosingLocation])

  useEffect(() => {
    const markReady = () => {
      readyRef.current = true
      if (reduced) setLeaving(true)
    }
    window.addEventListener(FRONTEND_READY_EVENT, markReady)
    return () => window.removeEventListener(FRONTEND_READY_EVENT, markReady)
  }, [reduced])

  useEffect(() => {
    let cancelled = false
    const measure = () => {
      const stage = stageRef.current
      const row = rowRef.current
      if (!stage || !row) return
      const next = measureLabel(stage, row)
      if (!cancelled && next) setMetrics(next)
    }
    const fonts = document.fonts?.ready
    if (fonts) fonts.then(measure)
    else measure()
    window.addEventListener('resize', measure)
    return () => {
      cancelled = true
      window.removeEventListener('resize', measure)
    }
  }, [])

  useEffect(() => {
    if (!metrics || reduced || leaving || gone) return undefined
    let stopped = false
    let timer = 0
    let playback
    let shown = -1
    const start = metrics.start
    const end = metrics.stops[metrics.stops.length - 1] + GAP
    logoX.set(start)
    setCursor(-1)

    const unsub = logoX.on('change', (value) => {
      let next = -1
      for (let i = 0; i < metrics.stops.length; i += 1) {
        if (value >= metrics.stops[i] + GAP - 0.5) next = i
        else break
      }
      if (next !== shown) {
        shown = next
        setCursor(next)
      }
    })

    const pause = (ms) => new Promise((resolve) => {
      timer = window.setTimeout(resolve, ms)
    })

    const hopAtStart = async () => {
      logoY.set(0)
      playback = animate(logoY, [0, -28, 0], {
        duration: HOP_S,
        times: [0, 0.42, 1],
        ease: ['easeOut', 'easeIn'],
      })
      await playback
      if (stopped) return
      await pause(Math.max(0, HOLD_MS - HOP_S * 1000))
    }

    const run = async () => {
      while (!stopped) {
        playback = animate(logoX, end, { duration: TRAVEL_S, ease: 'linear' })
        await playback
        if (stopped) return
        await pause(HOLD_MS)
        if (stopped) return
        playback = animate(logoX, start, { duration: TRAVEL_S, ease: 'linear' })
        await playback
        if (stopped) return
        await hopAtStart()
        if (stopped) return
        if (readyRef.current) {
          setLeaving(true)
          return
        }
      }
    }

    run()
    return () => {
      stopped = true
      window.clearTimeout(timer)
      playback?.stop()
      logoY.set(0)
      unsub()
    }
  }, [metrics, reduced, leaving, gone, logoX, logoY])

  if (gone || choosingLocation) return null

  const shownWidth = !metrics || cursor < 0 ? 0 : metrics.stops[cursor] - metrics.textLeft
  const clipRight = !metrics
    ? '100%'
    : reduced || cursor >= metrics.stops.length - 1
      ? '0px'
      : `${Math.max(0, metrics.textWidth - shownWidth)}px`

  return (
    <motion.div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-brand-white px-5"
      initial={{ opacity: 0 }}
      animate={leaving
        ? { opacity: 0, x: -54, filter: 'blur(8px)' }
        : { opacity: 1, x: 0, filter: 'blur(0px)' }}
      transition={leaving ? stepShift.transition : { duration: 0.45, ease: 'easeOut' }}
      onAnimationComplete={() => {
        if (leaving) setGone(true)
        else setEntered(true)
      }}
      role="status"
      aria-label="Pa' La Jaba"
    >
      <div className="flex flex-col items-center">
        <div ref={stageRef} className="relative w-[7.5rem] max-w-[34vw]" style={{ aspectRatio: '842 / 595' }}>
          <p
            ref={rowRef}
            className="absolute left-1/2 top-1/2 w-max -translate-x-1/2 -translate-y-1/2 whitespace-nowrap text-center font-script text-[2rem] leading-none text-brand-carmelita"
            style={{ clipPath: `inset(-2.2rem ${clipRight} -2.6rem 0)` }}
          >
            {LABEL}
          </p>
          <div className="pointer-events-none absolute left-0 top-1/2 z-10 -translate-y-1/2">
            <motion.img
              src="/logo.png"
              alt=""
              width={512}
              height={512}
              className="h-auto w-[7.5rem] max-w-[34vw]"
              style={{ x: reduced && metrics ? metrics.stops[metrics.stops.length - 1] + GAP : logoX, y: logoY }}
            />
          </div>
        </div>
        <motion.p
          className="-mt-3 max-w-[19rem] text-center text-[0.8rem] leading-snug text-brand-carmelita/85"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
        >
          {TAGLINE}
        </motion.p>
      </div>
    </motion.div>
  )
}

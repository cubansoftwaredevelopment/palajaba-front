import { useEffect, useState } from 'react'
import { PresenceContext, motion, useReducedMotion } from 'framer-motion'
import { backdropFade, detailSpring, dialogSpring, sheetSpring } from './presets'

const PANEL = {
  sheet: {
    hidden: { y: '105%' },
    shown: { y: 0 },
    spring: sheetSpring,
  },
  detail: {
    hidden: { y: '104%' },
    shown: { y: 0 },
    spring: detailSpring,
  },
  dialog: {
    hidden: { y: 48, opacity: 0 },
    shown: { y: 0, opacity: 1 },
    gone: { y: 30, opacity: 0 },
    spring: dialogSpring,
  },
}

const STILL = { animation: 'none' }

const PANEL_TAG = {
  div: motion.div,
  section: motion.section,
}

const OVERLAY_TAG = {
  div: motion.div,
  button: motion.button,
}

export default function BuyerMotionFrame({
  variant = 'sheet',
  closing = false,
  sheetProps,
  overlayClassName = '',
  panelClassName = '',
  overlayProps = {},
  panelProps = {},
  overlayAs = 'div',
  panelAs = 'div',
  split = false,
  children,
}) {
  const reduced = useReducedMotion()
  const { offset = 0, dragging = false, style: _ignoredStyle, ref: sheetRef, ...pointer } = sheetProps ?? {}
  const spec = PANEL[variant] ?? PANEL.sheet
  const dragY = offset > 0 ? offset : 0
  const instant = Boolean(reduced || dragging)
  const exitTarget = dragY > 0 ? { y: '105%', opacity: 0 } : (spec.gone ?? spec.hidden)
  const panelAnimate = closing ? exitTarget : dragY ? { y: dragY } : spec.shown
  const Panel = PANEL_TAG[panelAs] ?? motion.div
  const Overlay = OVERLAY_TAG[overlayAs] ?? motion.div
  const closed = closing ? 'pointer-events-none' : ''
  const [settled, setSettled] = useState(Boolean(reduced))
  const moving = closing || dragging || dragY > 0

  useEffect(() => {
    if (moving) setSettled(false)
  }, [moving])

  const panel = (
    <Panel
      {...pointer}
      {...panelProps}
      ref={(node) => {
        if (typeof sheetRef === 'function') sheetRef(node)
      }}
      className={`${panelClassName} ${closed} ${settled && !moving ? 'sheet-at-rest' : ''}`}
      style={STILL}
      initial={reduced ? false : spec.hidden}
      animate={panelAnimate}
      transition={instant ? { duration: 0 } : spec.spring}
      onAnimationComplete={() => {
        if (!closing && dragY === 0 && !dragging) setSettled(true)
      }}
    >
      {children}
    </Panel>
  )

  const overlay = (
    <Overlay
      {...overlayProps}
      className={`${overlayClassName} ${closed}`}
      style={STILL}
      initial={reduced ? false : { opacity: 0 }}
      animate={{ opacity: closing ? 0 : 1 }}
      transition={reduced ? { duration: 0 } : backdropFade}
    >
      {split ? null : panel}
    </Overlay>
  )

  const frame = split ? (
    <>
      {overlay}
      {panel}
    </>
  ) : (
    overlay
  )

  // La transición de ruta marca initial=false y framer lo hereda a todo lo que
  // se abre después, así que la hoja aparecería ya abierta. Este contexto lo corta.
  return <PresenceContext.Provider value={null}>{frame}</PresenceContext.Provider>
}

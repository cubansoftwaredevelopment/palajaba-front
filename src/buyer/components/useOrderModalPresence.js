import { useCallback, useEffect, useRef, useState } from 'react'

export const ORDER_MODAL_EXIT_MS = 200

export function orderModalMotionClass(closing) {
  return closing
    ? 'pointer-events-none motion-safe:animate-order-modal-out'
    : 'motion-safe:animate-order-modal-in'
}

export function useOrderModalPresence(open) {
  const presentRef = useRef(open)
  const [present, setPresent] = useState(open)
  const [closing, setClosing] = useState(false)

  useEffect(() => {
    if (open) {
      presentRef.current = true
      setPresent(true)
      setClosing(false)
      return undefined
    }

    if (!presentRef.current) return undefined

    setClosing(true)
    const timer = window.setTimeout(() => {
      presentRef.current = false
      setPresent(false)
      setClosing(false)
    }, ORDER_MODAL_EXIT_MS)

    return () => window.clearTimeout(timer)
  }, [open])

  return { present, closing }
}

const SWIPE_MEDIA = '(max-width: 1023px)'
const SWIPE_DISTANCE = 80
const SWIPE_FLICK = 0.65
const SWIPE_IGNORE =
  'button, a, input, textarea, select, label, [role="slider"], [draggable="true"], .leaflet-container, [data-swipe-ignore]'

function swipeEnabled() {
  return window.matchMedia(SWIPE_MEDIA).matches
}

function scrollable(element) {
  const overflowY = getComputedStyle(element).overflowY
  return (
    (overflowY === 'auto' || overflowY === 'scroll' || overflowY === 'overlay') &&
    element.scrollHeight > element.clientHeight + 1
  )
}

function findScroller(node, sheet) {
  let current = node instanceof Element ? node : null
  while (current && current !== sheet) {
    if (scrollable(current)) return current
    current = current.parentElement
  }
  if (sheet instanceof Element && scrollable(sheet)) return sheet
  return null
}

function withDrag(base, dy) {
  if (!base || base === 'none') return `0 ${dy}px`
  const parts = base.trim().split(/\s+/)
  const x = parts[0] || '0px'
  const y = parts[1] || '0px'
  return `${x} calc(${y} + ${dy}px)`
}

/** Arrastre hacia abajo para cerrar la hoja en móvil y tablet. */
export function useSwipeDownSheet(onDismiss) {
  const onDismissRef = useRef(onDismiss)
  onDismissRef.current = onDismiss
  const dragRef = useRef(null)
  const activeRef = useRef(false)
  const baseTranslateRef = useRef('none')
  const [node, setNode] = useState(null)
  const ref = useCallback((element) => setNode(element), [])
  const [offset, setOffset] = useState(0)
  const [dragging, setDragging] = useState(false)
  const [settling, setSettling] = useState(false)
  const settleTimer = useRef(0)

  useEffect(() => () => window.clearTimeout(settleTimer.current), [])

  useEffect(() => {
    if (!node) return undefined
    function blockScroll(event) {
      if (activeRef.current) event.preventDefault()
    }
    node.addEventListener('touchmove', blockScroll, { passive: false })
    return () => node.removeEventListener('touchmove', blockScroll)
  }, [node])

  const onPointerDown = useCallback((event) => {
    if (!swipeEnabled() || event.pointerType === 'mouse' || event.button !== 0) return
    const sheet = event.currentTarget
    const target = event.target
    if (!(target instanceof Element)) return
    if (target.closest(SWIPE_IGNORE)) return
    const scroller = findScroller(target, sheet)
    if (scroller && scroller.scrollTop > 1) return
    dragRef.current = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      lastY: event.clientY,
      lastT: event.timeStamp,
      velocity: 0,
      active: false,
      scroller,
    }
  }, [])

  const onPointerMove = useCallback((event) => {
    const drag = dragRef.current
    if (!drag || drag.id !== event.pointerId) return
    const dx = event.clientX - drag.x
    const dy = event.clientY - drag.y
    if (!drag.active) {
      if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return
      const blocked = drag.scroller && drag.scroller.scrollTop > 1
      if (dy <= 0 || Math.abs(dx) > dy || blocked) {
        dragRef.current = null
        return
      }
      drag.active = true
      activeRef.current = true
      baseTranslateRef.current = getComputedStyle(event.currentTarget).translate || 'none'
      setDragging(true)
      try {
        event.currentTarget.setPointerCapture?.(event.pointerId)
      } catch {
        // El puntero puede soltarse antes de capturarlo.
      }
    }
    const dt = event.timeStamp - drag.lastT
    if (dt > 0) drag.velocity = (event.clientY - drag.lastY) / dt
    drag.lastY = event.clientY
    drag.lastT = event.timeStamp
    setOffset(Math.max(0, dy))
    event.preventDefault()
  }, [])

  const onPointerUp = useCallback((event) => {
    const drag = dragRef.current
    if (!drag || drag.id !== event.pointerId) return
    dragRef.current = null
    activeRef.current = false
    if (!drag.active) return
    setDragging(false)
    const dy = Math.max(0, event.clientY - drag.y)
    if (dy >= SWIPE_DISTANCE || drag.velocity > SWIPE_FLICK) {
      onDismissRef.current?.()
      return
    }
    setSettling(true)
    setOffset(0)
    window.clearTimeout(settleTimer.current)
    settleTimer.current = window.setTimeout(() => setSettling(false), 220)
  }, [])

  const translate = offset > 0 || settling ? withDrag(baseTranslateRef.current, offset) : undefined
  const moving = offset > 0 || dragging || settling

  return {
    ref,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel: onPointerUp,
    style: {
      translate,
      transition: !moving ? undefined : dragging ? 'none' : 'translate 200ms ease',
    },
  }
}

/** Mantiene el modal montado el tiempo del fade-out antes de avisar al padre. */
export function useDismissibleModal(onClose) {
  const [closing, setClosing] = useState(false)
  const onCloseRef = useRef(onClose)
  const closingRef = useRef(false)
  onCloseRef.current = onClose

  const dismiss = useCallback(() => {
    if (closingRef.current) return
    closingRef.current = true
    setClosing(true)
    window.setTimeout(() => onCloseRef.current?.(), ORDER_MODAL_EXIT_MS)
  }, [])

  const sheetProps = useSwipeDownSheet(dismiss)

  return { dismiss, motionClass: orderModalMotionClass(closing), closing, sheetProps }
}

import { useEffect, useRef, useState } from 'react'

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

import { useEffect, useRef, useState } from 'react'

const PULL_DISTANCE = 70

export function usePullToRefresh(onRefresh) {
  const start = useRef(null)
  const onRefreshRef = useRef(onRefresh)
  useEffect(() => {
    onRefreshRef.current = onRefresh
  }, [onRefresh])
  const [status, setStatus] = useState('')

  const handlers = {
    onTouchStart(event) {
      const el = event.currentTarget
      if (!el || el.scrollTop > 0) {
        start.current = null
        return
      }
      const touch = event.touches[0]
      start.current = { x: touch.clientX, y: touch.clientY, dx: 0, dy: 0 }
    },
    onTouchMove(event) {
      const gesture = start.current
      if (!gesture) return
      const touch = event.touches[0]
      gesture.dx = touch.clientX - gesture.x
      gesture.dy = touch.clientY - gesture.y
      if (Math.abs(gesture.dx) > Math.abs(gesture.dy)) start.current = null
    },
    onTouchEnd() {
      const gesture = start.current
      start.current = null
      if (!gesture || gesture.dy < PULL_DISTANCE) return
      const run = onRefreshRef.current
      if (!run) return
      setStatus('Actualizando…')
      Promise.resolve(run()).finally(() => setStatus(''))
    },
  }

  return { handlers, status }
}

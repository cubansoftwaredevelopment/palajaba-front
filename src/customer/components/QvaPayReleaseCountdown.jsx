import { useEffect, useState } from 'react'
import { parseDateValue } from '../constants.js'

export default function QvaPayReleaseCountdown({ deadline, compact = false }) {
  const [now, setNow] = useState(Date.now)
  const deadlineMs = parseDateValue(deadline)?.getTime()

  useEffect(() => {
    if (!deadlineMs) return undefined
    const interval = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(interval)
  }, [deadlineMs])

  if (!deadlineMs) return null
  const remainingMs = deadlineMs - now
  if (remainingMs <= 0) {
    return (
      <p className={compact ? 'mt-2 pl-1 text-xs font-semibold text-amber-900' : 'mt-2 text-sm font-semibold text-amber-900'}>
        El plazo venció. La liberación del pago está en proceso.
      </p>
    )
  }

  const totalSeconds = Math.floor(remainingMs / 1000)
  const days = Math.floor(totalSeconds / 86400)
  const hours = Math.floor((totalSeconds % 86400) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  const countdown = days > 0
    ? `${days} d ${String(hours).padStart(2, '0')} h ${String(minutes).padStart(2, '0')} min ${String(seconds).padStart(2, '0')} s`
    : `${String(hours).padStart(2, '0')} h ${String(minutes).padStart(2, '0')} min ${String(seconds).padStart(2, '0')} s`

  return (
    <p className={compact ? 'mt-2 pl-1 text-xs font-semibold text-amber-900' : 'mt-2 text-sm font-semibold text-amber-900'} aria-live="off">
      Liberación automática del pago en: <span className="tabular-nums">{countdown}</span>
    </p>
  )
}

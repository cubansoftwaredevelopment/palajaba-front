import { useEffect, useState } from 'react'
import { parseApiDateTime } from '../../lib/dates'

function formatRemaining(milliseconds) {
  const secondsTotal = Math.max(0, Math.floor(milliseconds / 1000))
  const days = Math.floor(secondsTotal / 86400)
  const hours = Math.floor((secondsTotal % 86400) / 3600)
  const minutes = Math.floor((secondsTotal % 3600) / 60)
  const seconds = secondsTotal % 60
  const clock = [hours, minutes, seconds].map((value) => String(value).padStart(2, '0')).join(':')
  return days ? `${days} d ${clock}` : clock
}

export default function SellerEvidenceCountdown({
  deadline,
  className = '',
  label = 'Tiempo restante:',
}) {
  const parsedDeadline = parseApiDateTime(deadline)
  const deadlineMs = parsedDeadline?.getTime() ?? null
  const [now, setNow] = useState(() => Date.now())
  const remaining = deadlineMs == null ? null : deadlineMs - now

  useEffect(() => {
    if (deadlineMs == null) return undefined
    setNow(Date.now())
    const intervalId = window.setInterval(() => {
      const currentTime = Date.now()
      setNow(currentTime)
      if (currentTime >= deadlineMs) window.clearInterval(intervalId)
    }, 1000)
    return () => window.clearInterval(intervalId)
  }, [deadlineMs])

  if (remaining == null) return null
  if (remaining <= 0) {
    return <span className={className}>El plazo venció; la liberación automática del pago está en proceso.</span>
  }

  return (
    <span className={`${className} tabular-nums`}>
      {label} <time dateTime={parsedDeadline.toISOString()}>{formatRemaining(remaining)}</time>
    </span>
  )
}

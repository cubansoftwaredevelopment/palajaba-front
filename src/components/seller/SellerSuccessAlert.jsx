import { useEffect } from 'react'
import { sellerAlertSuccess } from './sellerStyles'

const SUCCESS_ALERT_MS = 2000

export default function SellerSuccessAlert({ message, onDismiss, duration = SUCCESS_ALERT_MS }) {
  useEffect(() => {
    if (!message) return undefined

    const timer = setTimeout(onDismiss, duration)
    return () => clearTimeout(timer)
  }, [message, onDismiss, duration])

  if (!message) return null

  return (
    <p className={sellerAlertSuccess} role="status">
      {message}
    </p>
  )
}

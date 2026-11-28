import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import SellerNotificationToast from '../../seller/componentes/SellerNotificationToast.jsx'
import { BRAND_NAME } from '../../shared/utils/branding.js'
import { CUSTOMER_AUTH_CHANGE_EVENT, getCustomerToken, isCustomerAuthenticated } from '../../customer/utils/customerAuth.js'
import { isBuyerMotionPath } from '../../motion/RouteMotion'
import { accountIdFromToken, readAccount } from '../../accountSync/store.js'

function asToast(notification) {
  const fromAdmin = Boolean(notification.from_admin) || notification.kind === 'admin'
  const storeName = String(notification.store_name || '').trim()
  return {
    id: notification.id,
    title: notification.title,
    content: notification.content,
    fromAdmin,
    senderName: fromAdmin ? BRAND_NAME : storeName,
    senderLogo: fromAdmin ? '' : (notification.store_logo || ''),
    senderMascot: fromAdmin,
  }
}

export default function CustomerNoticeToasts() {
  const navigate = useNavigate()
  const location = useLocation()
  const [toasts, setToasts] = useState([])

  useEffect(() => {
    let cancelled = false
    async function load() {
      const token = isCustomerAuthenticated() ? getCustomerToken() || '' : ''
      if (!token) {
        setToasts([])
        return
      }
      const record = await readAccount('customer', accountIdFromToken(token))
      if (cancelled) return
      const notices = record?.sections?.avisos?.data
      const unread = (Array.isArray(notices) ? notices : []).filter((item) => item?.id && !item.read_at).map(asToast)
      setToasts(unread)
    }
    load()
    window.addEventListener(CUSTOMER_AUTH_CHANGE_EVENT, load)
    return () => {
      cancelled = true
      window.removeEventListener(CUSTOMER_AUTH_CHANGE_EVENT, load)
    }
  }, [])

  return (
    <SellerNotificationToast
      toasts={toasts}
      aboveNav={isBuyerMotionPath(location.pathname)}
      onDone={(id) => setToasts((current) => current.filter((item) => item.id !== id))}
      onOpen={() => {
        setToasts([])
        navigate('/cliente/avisos')
      }}
    />
  )
}

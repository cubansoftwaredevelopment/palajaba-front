import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import SellerNotificationToast from '../../components/seller/SellerNotificationToast'
import { BRAND_NAME } from '../../constants/branding'
import { CUSTOMER_AUTH_CHANGE_EVENT, getCustomerToken, isCustomerAuthenticated } from '../../lib/customerAuth'
import { connectCustomerEvents } from '../../live/utils'
import { isBuyerMotionPath } from '../../motion/RouteMotion'
import { CUSTOMER_NOTICES_EVENT, ensureCustomerNotices, upsertCustomerNotice } from './BuyerHeaderTools'

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
    let generation = 0
    let stopEvents = () => {}
    let activeToken = ''
    const toastedIds = new Set()

    function push(list) {
      const incoming = (Array.isArray(list) ? list : [])
        .filter((item) => item?.id && !toastedIds.has(item.id))
        .map(asToast)
      if (!incoming.length) return
      incoming.forEach((item) => toastedIds.add(item.id))
      setToasts((current) => {
        const seen = new Set(current.map((item) => item.id))
        const next = incoming.filter((item) => !seen.has(item.id))
        return next.length ? [...next, ...current] : current
      })
    }

    function sync() {
      const token = isCustomerAuthenticated() ? getCustomerToken() || '' : ''
      if (token === activeToken) return
      activeToken = token
      const current = ++generation
      stopEvents()
      stopEvents = () => {}
      toastedIds.clear()
      setToasts([])
      if (!token) return
      ensureCustomerNotices(token)
        .then((list) => {
          if (cancelled || current !== generation) return
          push((Array.isArray(list) ? list : []).filter((item) => !item.read_at))
        })
        .catch(() => {})
      stopEvents = connectCustomerEvents(token, (notification) => {
        if (cancelled || current !== generation || !notification || notification.read_at) return
        upsertCustomerNotice(notification)
        push([notification])
        window.dispatchEvent(new Event(CUSTOMER_NOTICES_EVENT))
      })
    }

    sync()
    window.addEventListener(CUSTOMER_AUTH_CHANGE_EVENT, sync)
    return () => {
      cancelled = true
      stopEvents()
      window.removeEventListener(CUSTOMER_AUTH_CHANGE_EVENT, sync)
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

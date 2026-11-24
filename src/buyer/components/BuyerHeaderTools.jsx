import { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import AppDownloadPrompt from '../../appReleases/components/AppDownloadPrompt.jsx'
import { fetchCustomerPaymentNotifications } from '../../customer/api.js'
import { CUSTOMER_AUTH_CHANGE_EVENT, getCustomerToken, isCustomerAuthenticated } from '../../lib/customerAuth'
import BuyerJabaButton from './BuyerJabaButton'

export const CUSTOMER_NOTICES_EVENT = 'pala-jaba:customer-notices'

let noticeCache = null
let noticePromise = null
const noticeListeners = new Set()

function unreadCount(list) {
  return (Array.isArray(list) ? list : []).filter((item) => !item.read_at).length
}

function publishCustomerNotices(list) {
  noticeCache = Array.isArray(list) ? list : []
  noticeListeners.forEach((listener) => listener(noticeCache))
}

export function readCustomerNotices() {
  return noticeCache
}

export function subscribeCustomerNotices(listener) {
  noticeListeners.add(listener)
  return () => noticeListeners.delete(listener)
}

export function ensureCustomerNotices(token) {
  if (noticeCache) return Promise.resolve(noticeCache)
  if (!noticePromise) {
    noticePromise = fetchCustomerPaymentNotifications(token)
      .then((list) => {
        publishCustomerNotices(list)
        return noticeCache
      })
      .catch((error) => {
        noticePromise = null
        throw error
      })
  }
  return noticePromise
}

export function upsertCustomerNotice(notification) {
  if (!notification?.id) return
  const current = noticeCache || []
  const exists = current.some((item) => item.id === notification.id)
  publishCustomerNotices(
    exists
      ? current.map((item) => (item.id === notification.id ? { ...item, ...notification } : item))
      : [notification, ...current],
  )
}

function BuyerCustomerNotices() {
  const [signedIn, setSignedIn] = useState(() => isCustomerAuthenticated())
  const [unread, setUnread] = useState(0)

  useEffect(() => {
    const refresh = () => setSignedIn(isCustomerAuthenticated())
    window.addEventListener(CUSTOMER_AUTH_CHANGE_EVENT, refresh)
    return () => window.removeEventListener(CUSTOMER_AUTH_CHANGE_EVENT, refresh)
  }, [])

  useEffect(() => {
    if (!signedIn) {
      setUnread(0)
      return undefined
    }
    const token = getCustomerToken()
    let cancelled = false

    function apply(list) {
      if (!cancelled) setUnread(unreadCount(list))
    }

    const cached = readCustomerNotices()
    if (cached) apply(cached)
    else ensureCustomerNotices(token).then(apply).catch(() => apply([]))

    const unsubscribe = subscribeCustomerNotices(apply)
    function onChange() {
      const latest = readCustomerNotices()
      if (latest) apply(latest)
    }
    window.addEventListener(CUSTOMER_NOTICES_EVENT, onChange)
    return () => {
      cancelled = true
      unsubscribe()
      window.removeEventListener(CUSTOMER_NOTICES_EVENT, onChange)
    }
  }, [signedIn])

  if (!signedIn) return null

  return (
    <NavLink
      to="/cliente/avisos"
      aria-label={unread ? `Avisos, ${unread} sin leer` : 'Avisos'}
      title="Avisos"
      className={({ isActive }) => `relative inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-brand-carmelita/70 touch-manipulation active:bg-brand-green/8 active:text-brand-green focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green/35 ${isActive ? 'bg-brand-green/8 text-brand-green' : ''}`}
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
      {unread > 0 ? (
        <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-carmelita px-1 text-[0.6rem] font-bold leading-none text-brand-white">
          {unread > 9 ? '9+' : unread}
        </span>
      ) : null}
    </NavLink>
  )
}

export default function BuyerHeaderTools() {
  return (
    <>
      <AppDownloadPrompt variant="header" />
      <BuyerCustomerNotices />
      <BuyerJabaButton />
    </>
  )
}

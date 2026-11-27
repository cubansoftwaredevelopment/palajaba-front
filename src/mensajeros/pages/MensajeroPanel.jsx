import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { monthPageShift } from '../../motion/presets'
import { useMessengerSwipe } from '../../motion/useHorizontalSwipeNav.js'
import PillTabs from '../../shared/componentes/PillTabs.jsx'
import { formatOrderDateTime } from '../../shared/utils/dates.js'
import NoticeDateFilter from '../../shared/componentes/NoticeDateFilter.jsx'
import AppVersionBadge from '../../appReleases/componentes/AppVersionBadge.jsx'
import Logo from '../../shared/componentes/Logo.jsx'
import SellerLogoutModal from '../../seller/componentes/SellerLogoutModal.jsx'
import SellerNotificationToast from '../../seller/componentes/SellerNotificationToast.jsx'
import { sellerBtnPrimary, sellerBtnSecondary, sellerFocusRing, sellerHeader, sellerHeaderInner, sellerPageWrap } from '../../seller/componentes/sellerStyles.js'
import { fetchMensajeroMe, fetchMensajeroSummary, markMensajeroNoticeRead, startMensajeroBatch } from '../api'
import CompletedRouteModal from '../componentes/CompletedRouteModal.jsx'
import EvidenceGallery from '../componentes/EvidenceGallery.jsx'
import OrderCourierCost from '../componentes/OrderCourierCost.jsx'
import MensajeroProfile from '../componentes/MensajeroProfile.jsx'
import MensajeroRouteView from '../componentes/MensajeroRouteView.jsx'
import MensajeroOnboardingSheet from '../componentes/MensajeroOnboardingSheet.jsx'
import { clearMensajeroOnboarding, clearMensajeroSession, getMensajeroProfile, needsMensajeroOnboarding, updateMensajeroProfile } from '../utils/session.js'
import { useRouteTelemetry } from '../utils/useRouteTelemetry.js'
import { startMensajeroPush } from '../../live/utils'
import SectionRefreshMascot from '../../shared/componentes/SectionRefreshMascot.jsx'
import { usePullToRefresh } from '../../shared/componentes/usePullToRefresh.js'
import { runSectionRefresh } from '../../session/sectionStore'
import { useSectionRefreshing, useSectionSnapshot } from '../../session/useSectionSnapshot'

const PANEL_TABS = [
  { id: 'pending', label: 'Por hacer' },
  { id: 'done', label: 'Realizadas' },
]

function HeaderIconButton({ onClick, ariaLabel, children, badge = 0, active = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors touch-manipulation active:bg-brand-green/8 active:text-brand-green ${sellerFocusRing} ${
        active ? 'bg-brand-green/10 text-brand-green' : 'text-brand-carmelita/70'
      }`}
      aria-label={ariaLabel}
      aria-current={active ? 'page' : undefined}
    >
      {children}
      {badge > 0 ? (
        <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-carmelita px-1 text-[0.6rem] font-bold leading-none text-brand-white">
          {badge > 9 ? '9+' : badge}
        </span>
      ) : null}
    </button>
  )
}

function ProfileIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-3.3 3.6-6 8-6s8 2.7 8 6" />
    </svg>
  )
}

function noticeToast(batch) {
  const orders = batch.orders || []
  const detail = orders.map((order) => `#${order.code} ${order.buyer_name}`).join(' · ')
  return {
    id: batch.id,
    title: batch.status === 'in_progress' ? 'Ruta en curso' : 'Mensajería asignada',
    content: detail || 'Tienes una mensajería asignada.',
    batch,
  }
}

function moneyLine(amounts) {
  const entries = Object.entries(amounts || {})
  if (!entries.length) return '0'
  return entries.map(([currency, amount]) => `${amount} ${currency}`).join(' · ')
}

export default function MensajeroPanel() {
  const navigate = useNavigate()
  const [logoutOpen, setLogoutOpen] = useState(false)
  const [profile, setProfile] = useState(getMensajeroProfile() || {})
  const [welcomeOpen, setWelcomeOpen] = useState(() => needsMensajeroOnboarding(getMensajeroProfile()?.id))
  const reduced = useReducedMotion()
  const [tab, setTab] = useState('pending')
  const [section, setSection] = useState('work')
  const [direction, setDirection] = useState(1)
  const [motionOn, setMotionOn] = useState(false)
  const { snapshot, commit, skipInitialRef } = useSectionSnapshot('mensajero', 'summary')
  const [from, setFrom] = useState(snapshot?.query?.from ?? '')
  const [to, setTo] = useState(snapshot?.query?.to ?? '')
  const [data, setData] = useState(snapshot?.data ?? null)
  const [error, setError] = useState('')
  const [batch, setBatch] = useState(null)
  const [doneBatch, setDoneBatch] = useState(null)
  const [toasts, setToasts] = useState([])
  const toastedRef = useRef(false)
  const [liveFix, setLiveFix] = useState(null)
  const [pendingPoints, setPendingPoints] = useState([])

  const load = useCallback(async () => {
    try {
      const summary = await fetchMensajeroSummary({
        start: from ? `${from}T00:00:00` : undefined,
        end: to ? `${to}T23:59:59` : undefined,
      })
      setData(summary)
      commit(summary, { from, to })
      setError('')
    } catch (err) {
      setError(err.message)
    }
  }, [from, to, commit])

  useEffect(() => {
    if (skipInitialRef.current) return undefined
    let cancelled = false
    fetchMensajeroSummary({
      start: from ? `${from}T00:00:00` : undefined,
      end: to ? `${to}T23:59:59` : undefined,
    }).then((summary) => {
      if (cancelled) return
      setData(summary)
      commit(summary, { from, to })
      setError('')
    }).catch((err) => {
      if (!cancelled) setError(err.message)
    })
    return () => { cancelled = true }
  }, [from, to, commit])

  const refreshSummary = useCallback(
    () => runSectionRefresh('mensajero', 'summary', () => load()),
    [load],
  )
  const refreshProfile = useCallback(
    () => runSectionRefresh('mensajero', 'profile', async () => {
      try {
        const next = await fetchMensajeroMe()
        setProfile(next)
        updateMensajeroProfile(next)
        setError('')
      } catch (err) {
        setError(err.message)
      }
    }),
    [],
  )
  const refresh = useCallback(
    () => (section === 'profile' && !batch ? refreshProfile() : refreshSummary()),
    [section, batch, refreshProfile, refreshSummary],
  )
  const { handlers: pullHandlers } = usePullToRefresh(refresh)
  const summaryRefreshing = useSectionRefreshing('mensajero', 'summary')
  const profileRefreshing = useSectionRefreshing('mensajero', 'profile')
  const refreshing = section === 'profile' && !batch ? profileRefreshing : summaryRefreshing

  useEffect(() => {
    startMensajeroPush().catch(() => {})
  }, [])

  const allBatches = data?.batches || []
  const runningBatch = allBatches.find((item) => item.status === 'in_progress') || (batch?.status === 'in_progress' ? batch : null)
  const seedRef = useRouteTelemetry(runningBatch?.id || '', Boolean(runningBatch), {
    onFix: setLiveFix,
    onPending: setPendingPoints,
    onClosed: () => { load() },
  })
  seedRef.current = runningBatch?.points?.[runningBatch.points.length - 1] || null
  useEffect(() => {
    setLiveFix(null)
  }, [runningBatch?.id])
  const notices = allBatches.filter((item) => item.status !== 'completed')
  const unreadNotices = notices.filter((item) => !item.notice_read_at)

  useEffect(() => {
    if (!data || toastedRef.current) return
    toastedRef.current = true
    const unread = (data.batches || []).filter((item) => item.status !== 'completed' && !item.notice_read_at)
    if (unread.length) setToasts(unread.map(noticeToast))
  }, [data])
  const batches = allBatches.filter((item) => (tab === 'pending' ? item.status !== 'completed' : item.status === 'completed'))

  function selectTab(next) {
    if (next === tab) return
    setDirection(next === 'done' ? 1 : -1)
    setMotionOn(true)
    setTab(next)
  }

  function selectSection(next) {
    if (next === section && !batch) return
    setDirection(next === 'work' ? -1 : 1)
    setMotionOn(true)
    setBatch(null)
    setSection(next)
  }

  const sectionRef = useRef(section)
  const batchRef = useRef(batch)
  sectionRef.current = section
  batchRef.current = batch
  useMessengerSwipe((swipeDirection) => {
    const openRoute = batchRef.current && batchRef.current.status !== 'completed'
    if (openRoute) {
      if (swipeDirection < 0) closeBatch()
      else selectSection('profile')
      return true
    }
    if (sectionRef.current === 'notices') {
      selectSection(swipeDirection < 0 ? 'work' : 'profile')
      return true
    }
    const index = sectionRef.current === 'profile' ? 1 : 0
    const next = index + swipeDirection
    if (next < 0 || next > 1) return false
    selectSection(next === 0 ? 'work' : 'profile')
    return true
  })

  function replaceBatch(next) {
    if (!data) return
    const updated = {
      ...data,
      batches: (data.batches || []).map((item) => item.id === next.id ? next : item),
    }
    setData(updated)
    commit(updated, { from, to })
    setBatch((current) => current?.id === next.id ? next : current)
  }

  async function markRead(item) {
    if (item.notice_read_at) return item
    const next = await markMensajeroNoticeRead(item.id)
    replaceBatch(next)
    setToasts((current) => current.filter((toast) => toast.id !== item.id))
    return next
  }

  function openBatch(item) {
    if (item?.status === 'completed') {
      setError('')
      setDoneBatch(item)
      return
    }
    setDirection(1)
    setMotionOn(true)
    setBatch(item)
  }

  function closeBatch() {
    setDirection(-1)
    setMotionOn(true)
    setBatch(null)
  }

  async function begin(vehicleId) {
    if (!batch) return
    try {
      const next = await startMensajeroBatch(batch.id, vehicleId)
      setBatch(next)
      load()
    } catch (err) {
      setError(err.message)
    }
  }

  const shift = monthPageShift(direction, reduced || !motionOn)
  const stepClass = motionOn && !reduced ? 'screen-step' : ''

  return (
    <div className="flex h-dvh min-h-0 flex-col overflow-hidden bg-brand-white">
      <header className={sellerHeader}>
        <div className={`${sellerHeaderInner} relative`}>
          <div className="flex shrink-0 flex-col items-center gap-1">
            <Logo className="h-9 w-9 sm:h-10 sm:w-10" priority />
            <AppVersionBadge />
          </div>
          <div className="ml-auto flex shrink-0 items-center">
            <HeaderIconButton ariaLabel="Avisos" badge={unreadNotices.length} active={section === 'notices' && !batch} onClick={() => selectSection('notices')}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
            </HeaderIconButton>
            <HeaderIconButton ariaLabel="Cerrar sesión" onClick={() => setLogoutOpen(true)}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" x2="9" y1="12" y2="12" />
              </svg>
            </HeaderIconButton>
          </div>
        </div>
      </header>
      <main className={`${sellerPageWrap} mx-auto min-h-0 w-full flex-1 overflow-y-auto overscroll-y-contain px-4 py-4 pb-[calc(5.5rem+var(--safe-bottom))]`} {...pullHandlers}>
        <SectionRefreshMascot active={refreshing} />
        {error ? <p className="mb-3 text-sm font-semibold text-red-700">{error}</p> : null}
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div key={batch ? `route-${batch.id}` : section} className={stepClass} {...shift}>
            {batch && batch.status !== 'completed' ? (
              <MensajeroRouteView
                batch={batch}
                vehicles={profile.vehicles || []}
                onBack={closeBatch}
                onStart={begin}
                onChanged={async () => { await load(); closeBatch() }}
                liveFix={batch.id === runningBatch?.id ? liveFix : null}
                pendingPoints={batch.id === runningBatch?.id ? pendingPoints : []}
              />
            ) : section === 'notices' ? (
              notices.length ? (
                <ul className="space-y-3">
                  {notices.map((item) => {
                    const unread = !item.notice_read_at
                    return (
                      <li key={item.id} className={`rounded-2xl border p-4 ${unread ? 'border-brand-carmelita/25 border-l-[3px] bg-brand-yellow/10' : 'border-brand-green/12 bg-brand-white'}`}>
                        <div className="flex flex-wrap items-center gap-2">
                          {unread ? <span className="rounded-full bg-brand-carmelita px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-[0.04em] text-brand-white">Nueva</span> : null}
                          <h2 className="text-sm font-bold text-brand-green">{item.status === 'in_progress' ? 'Ruta en curso' : 'Mensajería asignada'}</h2>
                        </div>
                        <ul className="mt-3 space-y-2">
                          {(item.orders || []).map((order) => (
                            <li key={order.id} className="rounded-xl bg-brand-white/80 px-3 py-2 text-sm text-brand-carmelita">
                              <p className="font-semibold">#{order.code} · {order.buyer_name}</p>
                              {(order.items || []).length ? <p className="mt-0.5">{order.items.map((product) => `${product.quantity}× ${product.name}`).join(', ')}</p> : null}
                              {order.address ? <p className="mt-0.5">{order.address}</p> : null}
                              {order.phone ? <p className="mt-0.5">{order.phone}</p> : null}
                              <OrderCourierCost order={order} km={item.km} done={order.assignment_status === 'closed'} />
                              <EvidenceGallery evidence={order.evidence} orderId={order.evidence ? order.id : ''} />
                            </li>
                          ))}
                        </ul>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <button type="button" className={`${sellerBtnPrimary} !min-h-9 !w-auto !px-4 !py-2 !text-xs`} onClick={() => { markRead(item).catch((err) => setError(err.message)); selectSection('work'); openBatch(item) }}>Ver en rutas</button>
                          {unread ? <button type="button" className={`${sellerBtnSecondary} !min-h-9 !w-auto !px-4 !py-2 !text-xs`} onClick={() => markRead(item).catch((err) => setError(err.message))}>Marcar como leída</button> : null}
                        </div>
                      </li>
                    )
                  })}
                </ul>
              ) : (
                <p className="rounded-2xl bg-brand-white p-5 text-sm text-brand-carmelita/70">Aún no tienes avisos.</p>
              )
            ) : section === 'profile' ? (
              <MensajeroProfile profile={profile} onChange={(next) => { setProfile(next); updateMensajeroProfile(next) }} />
            ) : (
              <>
                <h1 className="mb-5 text-center font-script text-7xl leading-[1.05] text-brand-carmelita sm:text-8xl">Rutas</h1>
                <PillTabs ariaLabel="Mensajerías" value={tab} onChange={selectTab} options={PANEL_TABS} />
                <NoticeDateFilter from={from} to={to} onChange={(nextFrom, nextTo) => { setFrom(nextFrom || ''); setTo(nextTo || '') }} />
                <AnimatePresence mode="popLayout" initial={false}>
                  <motion.div key={tab} className={stepClass} {...shift}>
                    {tab === 'pending' ? (
                      <p className="mt-3 text-sm font-semibold text-brand-carmelita">{data?.pending_count || 0} por terminar · {moneyLine(data?.pending_amounts)} por cobrar</p>
                    ) : (
                      <p className="mt-3 text-sm font-semibold text-brand-carmelita">{data?.done_count || 0} pedidos · {moneyLine(data?.done_amounts)} · {data?.km || 0} km</p>
                    )}
                    <ul className="mt-4 space-y-2">
                      {batches.map((item) => {
                        const names = tab === 'done'
                          ? (item.orders || []).map((order) => order.buyer_name).filter(Boolean).join(', ')
                          : ''
                        return (
                        <li key={item.id}>
                          <button type="button" className="w-full rounded-2xl border border-brand-green/12 bg-brand-white px-3 py-3 text-left" onClick={() => openBatch(item)}>
                            <span className="font-bold text-brand-carmelita">{item.orders?.length || 0} pedidos</span>
                            {tab === 'done' ? (
                              <>
                                {names ? <span className="mt-1 block text-sm text-brand-carmelita/80">{names}</span> : null}
                                <span className="mt-1 block text-sm text-brand-carmelita/70">{formatOrderDateTime(item.closed_at || item.created_at)}</span>
                              </>
                            ) : (
                              <span className="mt-1 block text-sm text-brand-carmelita/80">{item.status === 'in_progress' ? 'En ruta' : 'Asignada'}</span>
                            )}
                          </button>
                        </li>
                        )
                      })}
                    </ul>
                  </motion.div>
                </AnimatePresence>
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </main>
      <nav
        className="fixed bottom-0 left-0 right-0 z-30 border-t border-brand-green/10 bg-brand-white/95 shadow-[0_-4px_24px_rgba(89,128,44,0.08)] backdrop-blur-md"
        style={{ paddingBottom: 'max(0.375rem, var(--safe-bottom))' }}
        aria-label="Secciones del mensajero"
      >
        <div className="mx-auto flex w-full max-w-md items-stretch">
          <button type="button" className={`flex flex-1 flex-col items-center justify-center gap-0.5 py-1.5 text-[0.625rem] font-semibold leading-none sm:text-xs ${section === 'work' && !batch ? 'text-brand-green' : 'text-brand-carmelita/65'}`} onClick={() => selectSection('work')}>
            <span className={`flex h-8 w-8 items-center justify-center rounded-lg sm:h-9 sm:w-9 ${section === 'work' && !batch ? 'bg-brand-green text-brand-white' : ''}`} aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" />
                <path d="M15 18H9" />
                <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.62l-3.48-4.35A1 1 0 0 0 17.52 8H14" />
                <circle cx="17" cy="18" r="2" />
                <circle cx="7" cy="18" r="2" />
              </svg>
            </span>
            Rutas
          </button>
          <button type="button" className={`flex flex-1 flex-col items-center justify-center gap-0.5 py-1.5 text-[0.625rem] font-semibold leading-none sm:text-xs ${section === 'profile' && !batch ? 'text-brand-green' : 'text-brand-carmelita/65'}`} onClick={() => selectSection('profile')}>
            <span className={`flex h-8 w-8 items-center justify-center sm:h-9 sm:w-9 ${profile.profile_photo_url ? `overflow-hidden rounded-full ${section === 'profile' && !batch ? 'ring-2 ring-brand-green' : 'ring-1 ring-brand-green/25'}` : `rounded-lg ${section === 'profile' && !batch ? 'bg-brand-green text-brand-white' : ''}`}`}>
              {profile.profile_photo_url ? <img src={profile.profile_photo_url} alt="" className="h-full w-full object-cover" /> : <ProfileIcon />}
            </span>
            Perfil
          </button>
        </div>
      </nav>
      <SellerNotificationToast
        toasts={toasts}
        aboveNav
        onDone={(id) => setToasts((current) => current.filter((item) => item.id !== id))}
        onOpen={(toast) => {
          const item = toast?.batch
          setToasts([])
          if (!item) return
          selectSection('work')
          openBatch(item)
        }}
      />
      {doneBatch || batch?.status === 'completed' ? (
        <CompletedRouteModal
          batch={doneBatch || batch}
          vehicles={profile.vehicles || []}
          onClose={() => {
            setDoneBatch(null)
            if (batch?.status === 'completed') closeBatch()
          }}
        />
      ) : null}
      {welcomeOpen ? (
        <MensajeroOnboardingSheet
          profile={profile}
          onChange={(next) => { setProfile(next); updateMensajeroProfile(next) }}
          onDone={() => {
            clearMensajeroOnboarding()
            setWelcomeOpen(false)
          }}
        />
      ) : null}
      {logoutOpen ? (
        <SellerLogoutModal
          onClose={() => setLogoutOpen(false)}
          onConfirm={() => {
            clearMensajeroSession()
            navigate('/', { replace: true })
          }}
        />
      ) : null}
    </div>
  )
}

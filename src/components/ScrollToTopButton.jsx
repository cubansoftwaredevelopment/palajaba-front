import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { isScrollToTopPath } from '../lib/buyerMarketplaceHub'
import { animateScrollTop } from '../lib/smoothScroll'
import { subscribeOptionsFab } from '../lib/optionsFabVisibility'

const PAGE_SCROLL_SELECTOR = '.page-scroll, .buyer-scroll, .seller-scroll, .seller-catalog-scroll, .auth-scroll'
const SHOW_AFTER_PX = 96
const HIDE_AFTER_MS = 1000

function resolveScroller(target) {
  if (target === document || target === document.documentElement || target === document.body) {
    return document.scrollingElement || document.documentElement
  }
  if (target instanceof Element && target.matches(PAGE_SCROLL_SELECTOR)) return target
  return null
}

export default function ScrollToTopButton() {
  const { pathname } = useLocation()
  const allowed = isScrollToTopPath(pathname)
  const [visible, setVisible] = useState(false)
  const [fab, setFab] = useState({ present: false, visible: true })
  const scrollerRef = useRef(null)
  const lastTopRef = useRef(0)
  const hideTimerRef = useRef(0)
  const cancelScrollRef = useRef(null)

  useEffect(() => subscribeOptionsFab(setFab), [])

  useEffect(() => {
    setVisible(false)
    window.clearTimeout(hideTimerRef.current)
  }, [pathname, allowed])

  useEffect(() => {
    if (!allowed) return undefined

    function scheduleHide() {
      window.clearTimeout(hideTimerRef.current)
      hideTimerRef.current = window.setTimeout(() => setVisible(false), HIDE_AFTER_MS)
    }

    function onScroll(event) {
      const scroller = resolveScroller(event.target)
      if (!scroller) return

      const top = scroller.scrollTop
      lastTopRef.current = top
      scrollerRef.current = scroller

      if (top < SHOW_AFTER_PX) {
        setVisible(false)
        window.clearTimeout(hideTimerRef.current)
        return
      }

      setVisible(true)
      if (fab.present) {
        window.clearTimeout(hideTimerRef.current)
        return
      }
      scheduleHide()
    }

    document.addEventListener('scroll', onScroll, { capture: true, passive: true })
    return () => {
      document.removeEventListener('scroll', onScroll, { capture: true })
      window.clearTimeout(hideTimerRef.current)
      cancelScrollRef.current?.()
    }
  }, [allowed, fab.present, fab.visible])

  useEffect(() => {
    if (!fab.present || !fab.visible) return
    setVisible(false)
    window.clearTimeout(hideTimerRef.current)
  }, [fab.present, fab.visible])

  function scrollToTop() {
    const scroller = scrollerRef.current || document.querySelector(PAGE_SCROLL_SELECTOR)
    if (!scroller) return
    window.clearTimeout(hideTimerRef.current)
    if (!fab.present) setVisible(false)
    cancelScrollRef.current?.()
    cancelScrollRef.current = animateScrollTop(scroller)
  }

  if (!allowed) return null

  return (
    <button
      type="button"
      onClick={scrollToTop}
      aria-label="Ir arriba"
      tabIndex={visible ? 0 : -1}
      className={`fixed right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full border border-transparent bg-transparent text-brand-green transition-[opacity,transform] duration-200 touch-manipulation active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green/35 sm:right-[3.25rem] motion-reduce:transition-none ${
        visible
          ? 'translate-y-0 opacity-100'
          : 'pointer-events-none translate-y-3 opacity-0'
      }`}
      style={{ bottom: 'max(2rem, calc(1.65rem + var(--safe-bottom)))' }}
    >
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" aria-hidden="true">
        <path d="M18 15l-6-6-6 6" />
      </svg>
    </button>
  )
}

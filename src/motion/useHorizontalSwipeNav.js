import { useEffect, useRef } from 'react'
import { useDrag } from '@use-gesture/react'
import { useLocation, useNavigate, useNavigationType } from 'react-router-dom'
import { ADMIN_NAV } from '../admin/utils/adminNav.js'
import { isCustomerAuthenticated } from '../customer/utils/customerAuth.js'
import { SELLER_NAV } from '../seller/utils/sellerNav.js'

const SWIPE_MEDIA = '(max-width: 1023px)'
const SWIPE_DISTANCE = 80
const SWIPE_FLICK = 0.65
const SWIPE_LOCK = 12

function swipeEnabled() {
  return window.matchMedia(SWIPE_MEDIA).matches
}

function blockingModalOpen() {
  const nodes = document.querySelectorAll('[aria-modal="true"], [role="dialog"], [role="alertdialog"]')
  for (const node of nodes) {
    if (!(node instanceof HTMLElement) || node.hidden) continue
    const style = getComputedStyle(node)
    if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0) continue
    const rect = node.getBoundingClientRect()
    if (rect.width < 1 && rect.height < 1) continue
    return true
  }
  return false
}

function horizontalScroller(node) {
  let current = node instanceof Element ? node : null
  while (current && current !== document.documentElement) {
    const style = getComputedStyle(current)
    const overflowX = style.overflowX
    if (
      (overflowX === 'auto' || overflowX === 'scroll' || overflowX === 'overlay') &&
      current.scrollWidth > current.clientWidth + 1
    ) {
      return current
    }
    current = current.parentElement
  }
  return null
}

function ignoredTarget(node) {
  if (!(node instanceof Element)) return true
  return Boolean(
    node.closest('input, textarea, select, [contenteditable="true"], [role="slider"], .leaflet-container, [data-swipe-ignore]'),
  )
}

const BUYER_GUEST = [
  { path: '/inicio', end: true },
  { path: '/comprar', end: true },
  { path: '/login', end: true },
]

const BUYER_CUSTOMER = [
  { path: '/comprar', end: true },
  { path: '/cliente/pedidos', end: true },
  { path: '/cliente/favoritos', end: true },
  { path: '/cliente/direcciones', end: true },
  { path: '/cliente', end: false },
]

function buyerSections() {
  return isCustomerAuthenticated() ? BUYER_CUSTOMER : BUYER_GUEST
}

function sectionsFor(pathname) {
  if (pathname.startsWith('/tienda')) {
    return SELLER_NAV.map((item) => ({ path: item.path, end: Boolean(item.end) }))
  }
  if (pathname.startsWith('/admin/') || pathname === '/admin') {
    return ADMIN_NAV.map((item) => ({ path: item.path, end: true }))
  }
  if (pathname.startsWith('/cliente/registro') || pathname.startsWith('/cliente/recuperar')) return null
  if (
    pathname === '/comprar'
    || pathname.startsWith('/comprar/')
    || pathname === '/login'
    || pathname === '/cliente'
    || pathname.startsWith('/cliente/')
  ) {
    return buyerSections()
  }
  return null
}

function sectionOwns(pathname, item) {
  if (pathname === item.path) return true
  if (item.path === '/cliente' && pathname === '/cliente/perfil') return true
  if (item.end) return false
  return pathname.startsWith(`${item.path}/`)
}

function locateSection(pathname, items) {
  let index = -1
  let length = -1
  items.forEach((item, itemIndex) => {
    if (!sectionOwns(pathname, item) || item.path.length <= length) return
    index = itemIndex
    length = item.path.length
  })
  return index
}

function atSectionRoot(pathname, item) {
  return pathname === item.path || (item.path === '/cliente' && pathname === '/cliente/perfil')
}

/** Sección vecina cuando el historial no tiene una entrada en esa dirección. */
function sectionStep(pathname, direction) {
  const items = sectionsFor(pathname)
  if (!items) return null
  const index = locateSection(pathname, items)
  if (index < 0) {
    if (direction < 0 && pathname.startsWith('/comprar/')) return '/comprar'
    return null
  }
  const item = items[index]
  if (!atSectionRoot(pathname, item)) {
    if (direction < 0) return item.path
    const next = index + 1
    return next < items.length ? items[next].path : null
  }
  const next = index + direction
  if (next < 0 || next >= items.length) return null
  return items[next].path
}

const messengerSwipeRef = { current: null }

/** El panel del mensajero no cambia de ruta: el gesto mueve sus propias secciones. */
export function useMessengerSwipe(onSwipe) {
  const onSwipeRef = useRef(onSwipe)
  onSwipeRef.current = onSwipe
  useEffect(() => {
    messengerSwipeRef.current = (direction) => onSwipeRef.current(direction)
    return () => {
      messengerSwipeRef.current = null
    }
  }, [])
}

/** Desplazamiento horizontal: entre secciones, o por el historial si la pantalla no es una sección. */
export function useHorizontalSwipeNav() {
  const navigate = useNavigate()
  const location = useLocation()
  const navigationType = useNavigationType()
  const navigateRef = useRef(navigate)
  const pathRef = useRef(location.pathname)
  navigateRef.current = navigate
  pathRef.current = location.pathname
  const maxIdxRef = useRef(typeof window !== 'undefined' ? (window.history.state?.idx ?? 0) : 0)

  useEffect(() => {
    const idx = window.history.state?.idx ?? 0
    if (navigationType === 'PUSH') maxIdxRef.current = idx
    else maxIdxRef.current = Math.max(maxIdxRef.current, idx)
  }, [location, navigationType])

  const skipRef = useRef(false)

  useDrag(({ first, last, tap, event, movement: [mx, my], velocity: [vx], axis, cancel }) => {
    if (first) {
      const target = event.target
      skipRef.current = !swipeEnabled()
        || !(target instanceof Element)
        || ignoredTarget(target)
        || Boolean(target.closest('[data-pill-tabs]'))
        || Boolean(horizontalScroller(target))
        || blockingModalOpen()
      if (skipRef.current) cancel()
      return
    }
    if (skipRef.current || !last || tap || axis === 'y' || blockingModalOpen()) return
    if (Math.abs(mx) <= Math.abs(my)) return
    if (Math.abs(mx) < SWIPE_DISTANCE && vx < SWIPE_FLICK) return
    const direction = mx > 0 ? -1 : 1
    if (messengerSwipeRef.current) {
      if (!messengerSwipeRef.current(direction)) return
      const stopMessengerClick = (clickEvent) => {
        clickEvent.preventDefault()
        clickEvent.stopPropagation()
        document.removeEventListener('click', stopMessengerClick, true)
      }
      document.addEventListener('click', stopMessengerClick, true)
      window.setTimeout(() => document.removeEventListener('click', stopMessengerClick, true), 400)
      return
    }
    const pathname = pathRef.current
    const items = sectionsFor(pathname)
    const index = items ? locateSection(pathname, items) : -1
    const onSection = index >= 0 && atSectionRoot(pathname, items[index])
    let moved = false
    if (onSection) {
      const step = sectionStep(pathname, direction)
      if (!step) return
      navigateRef.current(step)
      moved = true
    } else {
      const idx = window.history.state?.idx ?? 0
      if (direction < 0 && idx > 0) {
        navigateRef.current(-1)
        moved = true
      } else if (direction > 0 && idx < maxIdxRef.current) {
        navigateRef.current(1)
        moved = true
      } else {
        const step = sectionStep(pathname, direction)
        if (!step) return
        navigateRef.current(step)
        moved = true
      }
    }
    if (!moved) return
    const stopClick = (clickEvent) => {
      clickEvent.preventDefault()
      clickEvent.stopPropagation()
      document.removeEventListener('click', stopClick, true)
    }
    document.addEventListener('click', stopClick, true)
    window.setTimeout(() => document.removeEventListener('click', stopClick, true), 400)
  }, {
    target: window,
    axis: 'lock',
    // En la ventana, filterTaps cancela el click en captura y los enlaces dejan de abrirse.
    filterTaps: false,
    threshold: SWIPE_LOCK,
    axisThreshold: { touch: SWIPE_LOCK },
    preventScroll: true,
    pointer: { touch: true, mouse: false, keys: false },
    eventOptions: { passive: false },
  })
}

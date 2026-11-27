import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { FRONTEND_READY_EVENT } from '../utils/frontendReady.js'

function dismissSplash(node) {
  if (!node?.isConnected) return
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (reduce) {
    node.remove()
    return
  }
  node.classList.add('is-leaving')
  window.setTimeout(() => node.remove(), 360)
}

export default function BootSplash() {
  const location = useLocation()
  const choosingLocation =
    location.pathname === '/comprar/provincia' ||
    location.pathname === '/comprar/municipio'

  useEffect(() => {
    const node = document.getElementById('boot-splash')
    if (!node) return undefined
    if (choosingLocation) {
      node.remove()
      return undefined
    }
    const onReady = () => dismissSplash(node)
    window.addEventListener(FRONTEND_READY_EVENT, onReady)
    return () => window.removeEventListener(FRONTEND_READY_EVENT, onReady)
  }, [choosingLocation])

  return null
}

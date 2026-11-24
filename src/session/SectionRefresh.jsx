import { useCallback, useEffect, useRef } from 'react'
import { SectionRefreshContext } from './sectionRefreshContext'

export function SectionRefreshProvider({ children, fallback = null }) {
  const refreshRef = useRef(null)
  const fallbackRef = useRef(fallback)
  useEffect(() => {
    fallbackRef.current = fallback
  }, [fallback])
  const register = useCallback((fn) => {
    refreshRef.current = fn
    return () => {
      if (refreshRef.current === fn) refreshRef.current = null
    }
  }, [])
  const refresh = useCallback(() => {
    if (refreshRef.current) return refreshRef.current()
    return fallbackRef.current?.()
  }, [])
  return (
    <SectionRefreshContext.Provider value={{ register, refresh }}>
      {children}
    </SectionRefreshContext.Provider>
  )
}

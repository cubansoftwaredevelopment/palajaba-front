import { useContext, useEffect, useRef } from 'react'
import { SectionRefreshContext } from './sectionRefreshContext'

export function useRegisterSectionRefresh(fn) {
  const context = useContext(SectionRefreshContext)
  const fnRef = useRef(fn)
  useEffect(() => {
    fnRef.current = fn
  }, [fn])
  useEffect(() => {
    if (!context) return undefined
    return context.register(() => fnRef.current?.())
  }, [context])
}

export function useSectionRefresh() {
  return useContext(SectionRefreshContext)?.refresh ?? (() => {})
}

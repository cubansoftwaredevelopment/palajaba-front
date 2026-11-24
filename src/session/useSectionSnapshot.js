import { useCallback, useEffect, useRef, useState } from 'react'
import { commitSection, isSectionRefreshing, readSection, subscribeSection, subscribeSectionRefresh } from './sectionStore'

export function useSectionSnapshot(role, key) {
  const [snapshot, setSnapshot] = useState(() => readSection(role, key))
  const skipInitialRef = useRef(snapshot != null)

  useEffect(() => subscribeSection(role, key, setSnapshot), [role, key])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      skipInitialRef.current = false
    }, 0)
    return () => window.clearTimeout(timer)
  }, [role, key])

  const commit = useCallback((data, query = null) => {
    commitSection(role, key, data, query)
  }, [role, key])

  return { snapshot, commit, skipInitialRef }
}

export function useSectionRefreshing(role, key) {
  const [refreshing, setRefreshing] = useState(() => Boolean(role && key && isSectionRefreshing(role, key)))

  useEffect(() => {
    if (!role || !key) return undefined
    setRefreshing(isSectionRefreshing(role, key))
    return subscribeSectionRefresh(role, key, setRefreshing)
  }, [role, key])

  return Boolean(role && key && refreshing)
}

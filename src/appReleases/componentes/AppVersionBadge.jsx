import { useEffect, useState } from 'react'
import { getNativeAppVersion } from '../utils/releases.js'

const badgeClass =
  'whitespace-nowrap rounded-full bg-brand-green/10 px-2 py-1 text-[0.55rem] font-extrabold tracking-wide text-brand-green sm:px-2.5 sm:text-[0.65rem]'

export default function AppVersionBadge() {
  const [version, setVersion] = useState('')

  useEffect(() => {
    let active = true
    getNativeAppVersion().then((value) => {
      if (active && value) setVersion(value)
    })
    return () => {
      active = false
    }
  }, [])

  if (!version) return null

  return (
    <span className={badgeClass} role="status">
      {version}
    </span>
  )
}

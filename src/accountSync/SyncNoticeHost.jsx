import { useEffect, useState } from 'react'
import SellerNotificationToast from '../seller/componentes/SellerNotificationToast.jsx'
import { SYNC_NOTICE_EVENT } from './notify.js'

export default function SyncNoticeHost() {
  const [notice, setNotice] = useState(null)

  useEffect(() => {
    const apply = (event) => setNotice(event.detail || null)
    window.addEventListener(SYNC_NOTICE_EVENT, apply)
    return () => window.removeEventListener(SYNC_NOTICE_EVENT, apply)
  }, [])

  return (
    <SellerNotificationToast
      toast={notice}
      onDone={() => { if (notice?.tone !== 'error') setNotice(null) }}
    />
  )
}

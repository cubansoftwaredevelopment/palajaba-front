import { adminSection } from '../componentes/adminStyles.js'
import AdminNotifications from './AdminNotifications.jsx'

export default function AdminInbox() {
  return (
    <div className={adminSection}>
      <div className="mx-auto w-full max-w-4xl">
        <AdminNotifications embedded />
      </div>
    </div>
  )
}

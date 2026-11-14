import { adminSection } from '../components/admin/adminStyles'
import AdminNotifications from './AdminNotifications'

export default function AdminInbox() {
  return (
    <div className={adminSection}>
      <div className="mx-auto w-full max-w-4xl">
        <AdminNotifications embedded />
      </div>
    </div>
  )
}

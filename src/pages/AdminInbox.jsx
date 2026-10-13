import { useSearchParams } from 'react-router-dom'
import { adminFocusRing, adminSection } from '../components/admin/adminStyles'
import AdminFeedback from './AdminFeedback'
import AdminNotifications from './AdminNotifications'

const TABS = [
  { id: 'avisos', label: 'Avisos' },
  { id: 'mensajes', label: 'Mensajes' },
]

function tabClass(active) {
  return `rounded-xl border px-3 py-2 text-sm font-semibold transition-colors ${adminFocusRing} ${
    active
      ? 'border-brand-green/40 bg-brand-green/12 text-brand-green'
      : 'border-zinc-800 bg-zinc-900/50 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
  }`
}

export default function AdminInbox() {
  const [params, setParams] = useSearchParams()
  const tab = params.get('tab') === 'mensajes' ? 'mensajes' : 'avisos'

  function selectTab(next) {
    setParams(next === 'mensajes' ? { tab: 'mensajes' } : {}, { replace: true })
  }

  return (
    <div className={adminSection}>
      <div className="mb-4 grid grid-cols-2 gap-2" role="tablist" aria-label="Mensajes y avisos">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={tab === item.id}
            className={tabClass(tab === item.id)}
            onClick={() => selectTab(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>
      {tab === 'avisos' ? <AdminNotifications embedded /> : <AdminFeedback embedded />}
    </div>
  )
}

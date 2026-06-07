import AdminButton from './AdminButton'
import AdminModal from './AdminModal'
import { adminSubtle } from './adminStyles'

export default function LogoutConfirmModal({ onConfirm, onClose }) {
  return (
    <AdminModal onClose={onClose} centered>
      <div className="flex flex-col items-center text-center">
        <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full border border-zinc-700 bg-zinc-800">
          <svg
            width="26"
            height="26"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="text-zinc-300"
            aria-hidden="true"
          >
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" x2="9" y1="12" y2="12" />
          </svg>
        </div>

        <h2 className="text-lg font-semibold text-white">¿Cerrar sesión?</h2>
        <p className={`mt-2 max-w-xs text-sm leading-relaxed ${adminSubtle}`}>
          Saldrás del panel de administración. Deberás volver a iniciar sesión para
          gestionar solicitudes.
        </p>

        <div className="mt-6 flex w-full flex-col gap-2 sm:flex-row">
          <AdminButton type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </AdminButton>
          <AdminButton type="button" variant="danger" onClick={onConfirm}>
            Sí, salir
          </AdminButton>
        </div>
      </div>
    </AdminModal>
  )
}

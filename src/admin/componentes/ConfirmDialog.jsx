import AdminButton from './AdminButton.jsx'
import AdminModal from './AdminModal.jsx'
import { useDismissibleModal } from '../../buyer/componentes/useOrderModalPresence.js'

export default function ConfirmDialog({
  title,
  subtitle,
  confirmLabel,
  confirmVariant = 'primary',
  loading,
  onConfirm,
  onClose: requestClose,
  children,
}) {
  const { dismiss: onClose, motionClass } = useDismissibleModal(requestClose)
  return (
    <AdminModal title={title} subtitle={subtitle} onClose={onClose} presenceClass={motionClass}>
      {children}
      <div className="mt-5 flex flex-col gap-2 sm:flex-row">
        <AdminButton type="button" variant="secondary" onClick={onClose} disabled={loading}>
          Cancelar
        </AdminButton>
        <AdminButton
          type="button"
          variant={confirmVariant === 'secondary' ? 'danger' : confirmVariant}
          onClick={onConfirm}
          disabled={loading}
        >
          {loading ? 'Procesando…' : confirmLabel}
        </AdminButton>
      </div>
    </AdminModal>
  )
}

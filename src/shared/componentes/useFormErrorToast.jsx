import { useCallback, useState } from 'react'
import AdminToastStack from '../../admin/componentes/AdminToastStack.jsx'
import SellerNotificationToast from '../../seller/componentes/SellerNotificationToast.jsx'

export function useFormErrorToast({
  layerClassName = '',
  variant = 'seller',
} = {}) {
  const [toast, setToast] = useState(null)

  const showError = useCallback((message, nextTitle) => {
    if (!message) {
      setToast(null)
      return
    }
    const text = String(message)
    setToast({
      id: `${Date.now()}`,
      tone: 'error',
      type: 'error',
      title: text,
      content: nextTitle && nextTitle !== text ? nextTitle : '',
      message: text,
    })
  }, [])

  const dismiss = useCallback((id) => {
    setToast((current) => (current?.id === id ? null : current))
  }, [])

  const toastNode = variant === 'admin' ? (
    <AdminToastStack toasts={toast ? [toast] : []} onDismiss={dismiss} className={layerClassName} />
  ) : (
    <SellerNotificationToast
      toast={toast}
      placement="top"
      className={`!z-[260] ${layerClassName}`}
      onDone={dismiss}
    />
  )

  return { showError, toastNode }
}

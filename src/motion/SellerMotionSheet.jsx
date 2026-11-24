import { useDismissibleModal } from '../buyer/componentes/useOrderModalPresence.js'
import { sellerModalOverlay, sellerModalSheet } from '../seller/componentes/sellerStyles.js'
import BuyerMotionFrame from './BuyerMotionFrame'
import { useSheetExitMs } from './presets'

export function useSellerSheet(requestClose) {
  const exitMs = useSheetExitMs()
  return useDismissibleModal(requestClose, exitMs, { motion: true })
}

export default function SellerMotionSheet({
  onClose,
  closing = false,
  sheetProps,
  labelledBy,
  variant = 'sheet',
  overlayClassName = sellerModalOverlay,
  panelClassName = sellerModalSheet,
  panelAs = 'div',
  dismissOnBackdrop = true,
  children,
}) {
  return (
    <BuyerMotionFrame
      variant={variant}
      closing={closing}
      sheetProps={sheetProps}
      panelAs={panelAs}
      overlayClassName={overlayClassName}
      panelClassName={panelClassName}
      overlayProps={{
        role: 'presentation',
        onMouseDown: (event) => {
          if (event.target !== event.currentTarget) return
          event.preventDefault()
          if (dismissOnBackdrop) onClose?.()
        },
      }}
      panelProps={{
        role: 'dialog',
        'aria-modal': true,
        ...(labelledBy ? { 'aria-labelledby': labelledBy } : {}),
      }}
    >
      {children}
    </BuyerMotionFrame>
  )
}

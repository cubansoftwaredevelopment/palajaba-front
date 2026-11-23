import SellerModalPortal from '../../components/seller/SellerModalPortal'
import SellerMotionSheet, { useSellerSheet } from '../../motion/SellerMotionSheet'

const overlayClassName = 'fixed inset-0 z-[200] flex items-end justify-center bg-brand-green/25 p-0 backdrop-blur-[3px]'
const panelClassName = 'relative flex w-full max-w-lg max-h-[min(92dvh,760px)] min-h-0 flex-col overflow-hidden rounded-t-3xl border border-brand-green/12 bg-brand-white px-5 pt-3 pb-[max(1.25rem,var(--safe-bottom))] shadow-[0_-16px_48px_rgba(89,128,44,0.18)]'

export default function MensajeroEntrySheet({ titleId, onClose: requestClose, children }) {
  const { dismiss: onClose, closing, sheetProps } = useSellerSheet(requestClose)

  return (
    <SellerModalPortal>
      <SellerMotionSheet
        onClose={onClose}
        closing={closing}
        sheetProps={sheetProps}
        labelledBy={titleId}
        dismissOnBackdrop={false}
        overlayClassName={overlayClassName}
        panelClassName={panelClassName}
      >
        <div className="mx-auto mb-2 h-1 w-10 rounded-full bg-brand-green/15" aria-hidden="true" />
        {children}
      </SellerMotionSheet>
    </SellerModalPortal>
  )
}

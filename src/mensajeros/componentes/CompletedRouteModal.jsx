import { useEffect } from 'react'
import AppLocationMap from '../../map/componentes/AppLocationMap.jsx'
import SellerModalPortal from '../../seller/componentes/SellerModalPortal.jsx'
import { sellerModalBody, sellerModalSheet, sellerModalTitle } from '../../seller/componentes/sellerStyles.js'
import SellerMotionSheet, { useSellerSheet } from '../../motion/SellerMotionSheet'
import EvidenceGallery from './EvidenceGallery.jsx'
import OrderCourierCost from './OrderCourierCost.jsx'
import { vehicleLabel } from '../utils/constants.js'

export default function CompletedRouteModal({ batch, vehicles, onClose: requestClose }) {
  const { dismiss: onClose, closing, sheetProps } = useSellerSheet(requestClose)
  const vehicle = (vehicles || []).find((item) => item.id === batch.vehicle_id)
  const pins = (batch.orders || [])
    .filter((order) => order.latitude != null && order.longitude != null)
    .map((order) => ({ lat: Number(order.latitude), lng: Number(order.longitude), label: order.address || '' }))

  useEffect(() => {
    function onKeyDown(event) {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previous
    }
  }, [onClose])

  return (
    <SellerModalPortal>
      <SellerMotionSheet
        onClose={onClose}
        closing={closing}
        sheetProps={sheetProps}
        labelledBy="completed-route-title"
        panelClassName={sellerModalSheet}
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-brand-green/8 px-5 py-4">
          <h2 id="completed-route-title" className={sellerModalTitle}>Ruta realizada</h2>
          <button type="button" onClick={onClose} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-brand-green active:bg-brand-green/8" aria-label="Cerrar">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12" /></svg>
          </button>
        </div>
        <div className={sellerModalBody}>
          <AppLocationMap collapsedHeight="33dvh" points={batch.points || []} pins={pins} />
          <ul className="mt-3 space-y-2">
            {(batch.orders || []).map((order) => (
              <li key={order.id} className="rounded-2xl border border-brand-green/12 bg-brand-white px-3 py-2">
                <p className="font-semibold text-brand-carmelita">#{order.code} · {order.buyer_name}</p>
                <p className="text-sm text-brand-carmelita">{order.address || 'Este pedido no tiene pin: solo dirección de texto.'}</p>
                <OrderCourierCost order={order} km={batch.km} done />
                <EvidenceGallery evidence={order.evidence} orderId={order.evidence ? order.id : ''} />
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs font-semibold text-brand-green">Vehículo de esta ruta</p>
          <p className="mt-1 text-sm text-brand-carmelita">{vehicle ? `${vehicleLabel(vehicle.vehicle_type)} ${vehicle.plate || ''}`.trim() : 'Sin vehículo'}</p>
        </div>
      </SellerMotionSheet>
    </SellerModalPortal>
  )
}

import { useOutletContext } from 'react-router-dom'

import SellerPageHeader from '../../components/seller/SellerPageHeader'

import SellerSection from '../../components/seller/SellerSection'

import SellerStatGrid from '../../components/seller/SellerStatGrid'

import SellerSubscriptionAlert from '../../components/seller/SellerSubscriptionAlert'

import { sellerComingSoon, sellerPageWrap, sellerSectionGap } from '../../components/seller/sellerStyles'

import { formatDateTime } from '../../lib/dates'

import { resolveMediaUrl } from '../../lib/media'



export default function SellerGeneral() {

  const { profile: seller } = useOutletContext()



  if (!seller) return null



  const photoSrc = resolveMediaUrl(seller.profile_photo_url)



  return (

    <section className={`animate-fade-in ${sellerPageWrap} ${sellerSectionGap}`}>

      <SellerPageHeader

        eyebrow="General"

        title="Estadísticas de tu tienda"

        subtitle="Resumen de visitas, ventas y actividad de tu perfil."

      />



      <SellerSubscriptionAlert profile={seller} />



      <SellerSection label="Tu negocio">

        <div className="flex items-center gap-3">

          {photoSrc ? (

            <img

              src={photoSrc}

              alt=""

              className="h-14 w-14 shrink-0 rounded-full border-2 border-brand-green/12 object-cover shadow-[0_2px_8px_rgba(89,128,44,0.12)]"

            />

          ) : (

            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-brand-yellow/15 text-[0.6rem] text-brand-carmelita">

              Sin foto

            </div>

          )}

          <div className="min-w-0">

            <p className="truncate font-display text-base font-bold text-brand-green">{seller.store_name}</p>

            <p className="text-xs text-brand-carmelita/85">{seller.phone}</p>

            {seller.subscription_ends_at && (

              <p className="mt-1.5 text-[0.65rem] text-brand-green/90">

                Suscripción hasta {formatDateTime(seller.subscription_ends_at)}

              </p>

            )}

          </div>

        </div>

      </SellerSection>



      <SellerSection label="Resumen del mes" hint="Las métricas se activarán cuando empieces a vender.">

        <SellerStatGrid />

        <p className={`mt-3 ${sellerComingSoon}`}>

          Pronto verás visitas, pedidos y productos actualizados en tiempo real.

        </p>

      </SellerSection>

    </section>

  )

}



import { CATALOG_ONBOARDING_STEPS } from '../../constants/catalog'

import { sellerBtnPrimary, sellerComingSoon } from './sellerStyles'



function CatalogIllustration() {

  return (

    <div className="relative mx-auto mb-5 flex h-28 w-full max-w-xs items-end justify-center">

      <div className="absolute inset-x-6 bottom-0 h-16 rounded-2xl border border-brand-green/12 bg-brand-green/[0.04]" />

      <div className="relative flex -space-x-3">

        <div className="flex h-20 w-16 flex-col items-center justify-center rounded-2xl border border-brand-green/15 bg-brand-white shadow-[0_8px_24px_rgba(89,128,44,0.1)]">

          <span className="font-display text-[0.65rem] font-bold text-brand-carmelita/70">Elec.</span>

          <span className="mt-1 text-[0.55rem] font-semibold text-brand-carmelita/70">Electrodom.</span>

        </div>

        <div className="flex h-24 w-16 flex-col items-center justify-center rounded-2xl border border-brand-green/18 bg-brand-yellow/12 shadow-[0_10px_28px_rgba(89,128,44,0.12)]">

          <span className="font-display text-[0.65rem] font-bold text-brand-green">Ropa</span>

          <span className="mt-1 text-[0.55rem] font-semibold text-brand-green">Accesorios</span>

        </div>

        <div className="flex h-20 w-16 flex-col items-center justify-center rounded-2xl border border-brand-green/15 bg-brand-white shadow-[0_8px_24px_rgba(89,128,44,0.1)]">

          <span className="font-display text-[0.65rem] font-bold text-brand-carmelita/70">Alim.</span>

          <span className="mt-1 text-[0.55rem] font-semibold text-brand-carmelita/70">Alimentos</span>

        </div>

      </div>

    </div>

  )

}



export default function SellerCatalogEmpty({ onCreateProduct }) {

  return (

    <div className="overflow-hidden rounded-3xl border border-brand-green/12 bg-gradient-to-b from-brand-yellow/10 via-brand-white to-brand-white p-5 shadow-[0_4px_24px_rgba(89,128,44,0.07)] sm:p-6">

      <CatalogIllustration />



      <div className="text-center">

        <h3 className="font-display text-xl font-bold text-brand-green sm:text-2xl">

          Publica tu primer producto

        </h3>

        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-brand-carmelita/90">

          Elige una categoría global (como en Revolico), sube la foto y define el precio.

        </p>

      </div>



      <ol className="mt-6 space-y-3">

        {CATALOG_ONBOARDING_STEPS.map((step, index) => (

          <li

            key={step.title}

            className="flex gap-3 rounded-2xl border border-brand-green/10 bg-brand-white/80 px-3.5 py-3"

          >

            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-green text-sm font-bold text-brand-white">

              {index + 1}

            </span>

            <div className="min-w-0 text-left">

              <p className="text-sm font-semibold text-brand-green">{step.title}</p>

              <p className="mt-0.5 text-xs leading-relaxed text-brand-carmelita/85">{step.description}</p>

            </div>

          </li>

        ))}

      </ol>



      <div className="mt-5 flex flex-col gap-2">

        <button type="button" onClick={onCreateProduct} className={sellerBtnPrimary}>

          Agregar mi primer producto

        </button>

        <p className={`text-center ${sellerComingSoon}`}>

          Los productos de solo vista aparecen en tu tienda, no en el home público.

        </p>

      </div>

    </div>

  )

}



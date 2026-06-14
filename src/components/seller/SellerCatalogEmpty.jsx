import { CATALOG_ONBOARDING_STEPS } from '../../constants/catalog'
import { sellerBtnPrimary, sellerBtnSecondary, sellerComingSoon } from './sellerStyles'

function CatalogIllustration() {
  return (
    <div
      className="relative mx-auto flex h-[7.5rem] w-full max-w-xs items-end justify-center overflow-hidden rounded-2xl bg-gradient-to-b from-brand-yellow/35 via-brand-white/90 to-brand-white px-4 pt-5"
      aria-hidden="true"
    >
      <div className="absolute inset-x-7 bottom-2.5 h-[3.25rem] rounded-xl border border-brand-carmelita/18 bg-brand-white shadow-[0_6px_20px_rgba(123,76,56,0.14)]" />
      <div className="relative flex -space-x-3 pb-1">
        <div className="flex h-20 w-16 flex-col items-center justify-center rounded-2xl border border-brand-carmelita/15 bg-brand-white shadow-[0_8px_22px_rgba(123,76,56,0.1)]">
          <span className="font-display text-[0.65rem] font-bold text-brand-carmelita">Desp.</span>
          <span className="mt-1 text-[0.55rem] font-semibold text-brand-carmelita/80">Despensa</span>
        </div>
        <div className="flex h-24 w-16 flex-col items-center justify-center rounded-2xl border border-brand-yellow/50 bg-brand-yellow/35 shadow-[0_10px_26px_rgba(123,76,56,0.12)]">
          <span className="font-display text-[0.65rem] font-bold text-brand-carmelita">Ofert.</span>
          <span className="mt-1 text-[0.55rem] font-semibold text-brand-carmelita/90">Ofertas</span>
        </div>
        <div className="flex h-20 w-16 flex-col items-center justify-center rounded-2xl border border-brand-carmelita/15 bg-brand-white shadow-[0_8px_22px_rgba(123,76,56,0.1)]">
          <span className="font-display text-[0.65rem] font-bold text-brand-carmelita">Nuevo</span>
          <span className="mt-1 text-[0.55rem] font-semibold text-brand-carmelita/80">Novedades</span>
        </div>
      </div>
    </div>
  )
}

export default function SellerCatalogEmpty({ onCreateCategory, onCreateProduct }) {
  return (
    <div className="overflow-hidden rounded-3xl border border-brand-white/25 bg-brand-white shadow-[0_8px_32px_rgba(0,0,0,0.14)] sm:shadow-[0_12px_40px_rgba(0,0,0,0.16)]">
      <div className="bg-gradient-to-b from-brand-yellow/22 via-brand-white to-brand-white px-5 pb-1 pt-5 sm:px-6 sm:pt-6">
        <CatalogIllustration />

        <div className="mt-5 text-center">
          <h3 className="font-display text-xl font-bold text-brand-carmelita sm:text-2xl">
            Organiza tu catálogo
          </h3>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-brand-carmelita/85">
            Crea categorías locales para tu tienda y publica productos con su categoría global del negocio.
          </p>
        </div>
      </div>

      <div className="px-5 pb-5 sm:px-6 sm:pb-6">
        <ol className="mt-4 space-y-3">
          {CATALOG_ONBOARDING_STEPS.map((step, index) => (
            <li
              key={step.title}
              className="flex gap-3 rounded-2xl border border-brand-carmelita/10 bg-brand-white px-3.5 py-3 shadow-[0_1px_8px_rgba(123,76,56,0.06)]"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-carmelita text-sm font-bold text-brand-white">
                {index + 1}
              </span>
              <div className="min-w-0 text-left">
                <p className="text-sm font-semibold text-brand-carmelita">{step.title}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-brand-carmelita/75">{step.description}</p>
              </div>
            </li>
          ))}
        </ol>

        <div className="mt-5 flex flex-col gap-2">
          <button type="button" onClick={onCreateCategory} className={sellerBtnPrimary}>
            Crear primera categoría
          </button>
          <button type="button" onClick={onCreateProduct} className={sellerBtnSecondary}>
            Agregar producto
          </button>
          <p className={`text-center ${sellerComingSoon}`}>
            La categoría local organiza tu tienda; la global clasifica el producto en el marketplace.
          </p>
        </div>
      </div>
    </div>
  )
}

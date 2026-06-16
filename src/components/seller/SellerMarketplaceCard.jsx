import { useNavigate } from 'react-router-dom'
import { MARKETPLACE_LABEL } from '../../constants/branding'
import { beginSellerMarketplaceVisit } from '../../lib/sellerMarketplaceNav'
import { sellerBtnSecondary, sellerHint } from './sellerStyles'

export default function SellerMarketplaceCard({ profile }) {
  const navigate = useNavigate()

  function handleOpenMarketplace() {
    const path = beginSellerMarketplaceVisit(profile, '/tienda/perfil')
    navigate(path)
  }

  const hasBusinessArea = Boolean(
    profile?.business_area?.province_id && profile?.business_area?.municipality_id,
  )

  return (
    <section className="rounded-2xl border border-brand-carmelita/18 bg-gradient-to-br from-brand-carmelita/[0.05] via-brand-white to-brand-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-brand-carmelita/80">
            Comprar
          </p>
          <h2 className="mt-1 font-display text-base font-bold text-brand-green sm:text-lg">
            Explorar el {MARKETPLACE_LABEL.toLowerCase()}
          </h2>
          <p className={`mt-1.5 max-w-prose ${sellerHint}`}>
            Entra a comprar en otras tiendas sin cerrar tu sesión de vendedor.
            {hasBusinessArea
              ? ' Usaremos la provincia y municipio de tu negocio si aún no elegiste zona de compra.'
              : ' Primero elige provincia y municipio como comprador.'}
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenMarketplace}
          className={`${sellerBtnSecondary} w-full shrink-0 sm:w-auto sm:min-w-[11.5rem]`}
        >
          Ir al {MARKETPLACE_LABEL.toLowerCase()}
        </button>
      </div>
    </section>
  )
}

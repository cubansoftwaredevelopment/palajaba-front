import { sellerCatalogFab } from './sellerStyles'



export default function SellerCatalogFab({ onAddProduct }) {

  return (

    <button

      type="button"

      onClick={onAddProduct}

      className={`fixed bottom-[calc(4.75rem+env(safe-area-inset-bottom)+0.75rem)] right-4 z-40 lg:bottom-8 lg:right-8 ${sellerCatalogFab}`}

      aria-label="Nuevo producto"

    >

      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" aria-hidden>

        <path d="M12 5v14M5 12h14" />

      </svg>

    </button>

  )

}



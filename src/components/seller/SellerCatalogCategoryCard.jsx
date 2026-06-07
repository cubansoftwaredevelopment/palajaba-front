import { getCategoryInitial } from '../../constants/catalog'

import SellerCatalogProductItem from './SellerCatalogProductItem'

import { sellerCatalogAddProductZone, sellerCatalogCategoryCard } from './sellerStyles'



export default function SellerCatalogCategoryCard({

  category,

  onAddProduct,

  onViewProduct,

  onEditProduct,

  onDeleteProduct,

}) {

  const products = category.products || []

  const initial = getCategoryInitial(category.name)



  return (

    <article className={sellerCatalogCategoryCard}>

      <div className="flex items-center gap-3 border-b border-brand-green/8 px-4 py-3">

        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-green/10 font-display text-base font-bold text-brand-green">

          {initial}

        </div>

        <div className="min-w-0 flex-1">

          <h3 className="truncate font-display text-base font-bold text-brand-green">{category.name}</h3>

          <p className="mt-0.5 text-xs text-brand-carmelita/80">

            {category.product_count === 0

              ? 'Sin productos'

              : `${category.product_count} producto${category.product_count === 1 ? '' : 's'}`}

          </p>

        </div>

      </div>



      <div className="px-4 py-3">

        {products.length > 0 && (

          <div className="divide-y divide-brand-green/8">

            {products.map((product) => (

              <SellerCatalogProductItem

                key={product.id}

                product={product}

                onView={(item) => onViewProduct({ product: item, categoryName: category.name })}

                onEdit={onEditProduct}

                onDelete={onDeleteProduct}

              />

            ))}

          </div>

        )}



        <button

          type="button"

          onClick={() => onAddProduct(category.id)}

          className={`${products.length > 0 ? 'mt-3' : ''} ${sellerCatalogAddProductZone}`}

        >

          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>

            <path d="M12 5v14M5 12h14" />

          </svg>

          Agregar producto

        </button>

      </div>

    </article>

  )

}



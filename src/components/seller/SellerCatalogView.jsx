import SellerCatalogCategoryCard from './SellerCatalogCategoryCard'

import SellerCatalogFab from './SellerCatalogFab'



export default function SellerCatalogView({

  summary,

  onAddProduct,

  onViewProduct,

  onEditProduct,

  onDeleteProduct,

}) {

  return (

    <>

      <div className="flex flex-col gap-3 sm:gap-4">

        {summary.categories.map((category) => (

          <SellerCatalogCategoryCard

            key={category.id}

            category={category}

            onAddProduct={onAddProduct}

            onViewProduct={onViewProduct}

            onEditProduct={onEditProduct}

            onDeleteProduct={onDeleteProduct}

          />

        ))}

      </div>



      <SellerCatalogFab onAddProduct={() => onAddProduct()} />

    </>

  )

}



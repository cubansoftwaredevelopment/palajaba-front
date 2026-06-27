import SellerCatalogCategoryCard from './SellerCatalogCategoryCard'

export default function SellerCatalogView({
  summary,
  onAddProduct,
  onViewProduct,
  onEditProduct,
  onDeleteProduct,
  onDeleteCategory,
  onOrganizeProducts,
}) {
  return (
    <div className="flex flex-col gap-3 sm:gap-4">
      {summary.categories.map((category) => (
        <SellerCatalogCategoryCard
          key={category.id}
          category={category}
          onAddProduct={onAddProduct}
          onViewProduct={onViewProduct}
          onEditProduct={onEditProduct}
          onDeleteProduct={onDeleteProduct}
          onDeleteCategory={onDeleteCategory}
          onOrganizeProducts={onOrganizeProducts}
        />
      ))}
    </div>
  )
}

import SellerCatalogCategoryCard from './SellerCatalogCategoryCard'

export default function SellerCatalogView({
  summary,
  selectedCategoryId,
  selectedProductIds,
  onToggleProduct,
  onShareSelected,
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
          selectedProductIds={category.id === selectedCategoryId ? selectedProductIds : []}
          onToggleProduct={onToggleProduct}
          onShareSelected={onShareSelected}
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

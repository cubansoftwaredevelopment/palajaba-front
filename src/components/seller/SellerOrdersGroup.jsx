import SellerEmptyState from './SellerEmptyState'

export default function SellerOrdersGroup({
  count,
  emptyIcon,
  emptyTitle,
  emptyDescription,
  children,
}) {
  return (
    <section>
      {count === 0 ? (
        <SellerEmptyState
          icon={emptyIcon}
          title={emptyTitle}
          description={emptyDescription}
          badge={null}
        />
      ) : (
        <div className="flex flex-col divide-y divide-neutral-300">{children}</div>
      )}
    </section>
  )
}

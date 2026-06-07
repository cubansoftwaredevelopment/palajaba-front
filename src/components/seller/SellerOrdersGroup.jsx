import SellerEmptyState from './SellerEmptyState'
import { sellerSection } from './sellerStyles'

const GROUP_STYLES = {
  pending: {
    section: 'border-brand-yellow/22 bg-gradient-to-br from-brand-yellow/[0.07] via-brand-white to-brand-white',
  },
  completed: {
    section: 'border-brand-green/12 bg-brand-white',
  },
}

export default function SellerOrdersGroup({
  tone,
  count,
  emptyIcon,
  emptyTitle,
  emptyDescription,
  children,
}) {
  const styles = GROUP_STYLES[tone]

  return (
    <section className={`${sellerSection} ${styles.section}`}>
      {count === 0 ? (
        <SellerEmptyState
          icon={emptyIcon}
          title={emptyTitle}
          description={emptyDescription}
          badge={null}
        />
      ) : (
        <div className="flex flex-col gap-2">{children}</div>
      )}
    </section>
  )
}

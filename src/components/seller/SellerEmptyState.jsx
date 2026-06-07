import { sellerComingSoon } from './sellerStyles'

export default function SellerEmptyState({ icon, title, description, badge = 'Próximamente' }) {
  return (
    <div className="flex flex-col items-center py-2 text-center">
      {icon && (
        <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-yellow/20 text-brand-green">
          {icon}
        </div>
      )}
      <p className="text-sm font-semibold text-brand-green">{title}</p>
      <p className="mt-1.5 max-w-xs text-xs leading-relaxed text-brand-carmelita/85">{description}</p>
      {badge && <p className={`mt-4 w-full ${sellerComingSoon}`}>{badge}</p>}
    </div>
  )
}

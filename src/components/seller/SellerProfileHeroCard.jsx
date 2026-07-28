import { BILLING_LABELS } from '../../constants/admin'
import { getPlanTier } from '../../constants/plan'
import { getProfileHubSubtitle } from '../../lib/sellerProfileHub'
import { sellerFocusRing } from './sellerStyles'
import SellerProfileAvatarUpload from './SellerProfileAvatarUpload'

function EditPencilIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      aria-hidden
    >
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
    </svg>
  )
}

export default function SellerProfileHeroCard({
  profile,
  photoUrl,
  photoUploading,
  onPhotoClick,
  onEditClick,
}) {
  const tier = getPlanTier(profile?.plan_tier)
  const subtitle = getProfileHubSubtitle(profile)
  const handleEdit = onEditClick ?? onPhotoClick

  return (
    <div className="relative z-10 rounded-2xl border border-brand-green/10 bg-brand-white p-4 shadow-[0_8px_28px_rgba(89,128,44,0.12)] sm:p-5">
      <div className="flex items-center gap-3.5">
        <SellerProfileAvatarUpload
          photoUrl={photoUrl}
          uploading={photoUploading}
          onSelectClick={onPhotoClick}
          size="account"
          storeName={profile.store_name}
        />

        <div className="min-w-0 flex-1">
          <h3 className="truncate font-display text-lg font-bold text-brand-green sm:text-xl">
            {profile.store_name}
          </h3>
          <p className="mt-0.5 truncate text-xs text-brand-carmelita/80 sm:text-sm">{subtitle}</p>
          <p className="mt-1.5 text-[0.7rem] font-semibold text-brand-green/85">
            Plan {tier.name} ·{' '}
            {BILLING_LABELS[profile?.billing_period === 'yearly' ? 'yearly' : 'monthly']}
          </p>
        </div>

        <button
          type="button"
          onClick={handleEdit}
          disabled={photoUploading}
          aria-label="Editar foto de perfil"
          className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-brand-green/15 bg-brand-green/[0.04] text-brand-green touch-manipulation active:bg-brand-yellow/15 disabled:opacity-60 ${sellerFocusRing}`}
        >
          <EditPencilIcon />
        </button>
      </div>

      {photoUploading && (
        <p className="mt-2 text-center text-[0.65rem] text-brand-carmelita/75" role="status">
          Subiendo foto…
        </p>
      )}
    </div>
  )
}

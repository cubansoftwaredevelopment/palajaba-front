import { sellerProfileHero, sellerProfileHeroPattern } from './sellerStyles'
import SellerProfileAvatarUpload from './SellerProfileAvatarUpload'

export default function SellerProfileHeroCard({ profile, photoUrl, photoUploading, onPhotoClick }) {
  return (
    <div className={sellerProfileHero}>
      <div className={sellerProfileHeroPattern} aria-hidden />

      <div className="relative flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:gap-6">
        <SellerProfileAvatarUpload
          photoUrl={photoUrl}
          uploading={photoUploading}
          onSelectClick={onPhotoClick}
          size="hero"
          storeName={profile.store_name}
        />

        <div className="min-w-0 flex-1 text-center sm:text-left">
          <h3 className="truncate font-display text-xl font-bold text-brand-green sm:text-2xl">
            {profile.store_name}
          </h3>
          {profile.phone && (
            <p className="mt-0.5 text-xs text-brand-carmelita/85">{profile.phone}</p>
          )}
        </div>
      </div>
    </div>
  )
}

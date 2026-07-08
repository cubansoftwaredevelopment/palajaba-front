import {
  sellerEyebrow,
  sellerEyebrowOnDark,
  sellerSubtitle,
  sellerSubtitleOnDark,
  sellerTitle,
  sellerTitleOnDark,
} from './sellerStyles'

export default function SellerPageHeader({ eyebrow, title, subtitle, tone = 'light', action = null }) {
  const isDark = tone === 'dark'
  const eyebrowClass = isDark ? sellerEyebrowOnDark : sellerEyebrow
  const titleClass = isDark ? sellerTitleOnDark : sellerTitle
  const subtitleClass = isDark ? sellerSubtitleOnDark : sellerSubtitle

  return (
    <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
      <div className="min-w-0 flex-1">
        {eyebrow && <p className={eyebrowClass}>{eyebrow}</p>}
        <h2 className={`${eyebrow ? 'mt-1' : ''} ${titleClass}`}>{title}</h2>
        {subtitle && <p className={subtitleClass}>{subtitle}</p>}
      </div>
      {action ? (
        <div className="w-full shrink-0 sm:w-auto sm:self-start sm:pt-0.5">
          {action}
        </div>
      ) : null}
    </header>
  )
}

import {
  sellerEyebrow,
  sellerEyebrowOnDark,
  sellerSubtitle,
  sellerSubtitleOnDark,
  sellerTitle,
  sellerTitleOnDark,
} from './sellerStyles'

export default function SellerPageHeader({ eyebrow, title, subtitle, tone = 'light' }) {
  const isDark = tone === 'dark'
  const eyebrowClass = isDark ? sellerEyebrowOnDark : sellerEyebrow
  const titleClass = isDark ? sellerTitleOnDark : sellerTitle
  const subtitleClass = isDark ? sellerSubtitleOnDark : sellerSubtitle

  return (
    <header>
      {eyebrow && <p className={eyebrowClass}>{eyebrow}</p>}
      <h2 className={`${eyebrow ? 'mt-1' : ''} ${titleClass}`}>{title}</h2>
      {subtitle && <p className={subtitleClass}>{subtitle}</p>}
    </header>
  )
}

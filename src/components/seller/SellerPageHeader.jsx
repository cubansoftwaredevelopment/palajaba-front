import {
  sellerSectionScript,
  sellerSectionScriptOnDark,
  sellerSubtitle,
  sellerSubtitleOnDark,
  sellerTitle,
  sellerTitleOnDark,
} from './sellerStyles'

export default function SellerPageHeader({ eyebrow, title, subtitle, tone = 'light', action = null, eyebrowClassName = '', align = 'center' }) {
  const isDark = tone === 'dark'
  const centered = align === 'center'
  const eyebrowClass = eyebrowClassName || (isDark ? sellerSectionScriptOnDark : sellerSectionScript)
  const titleClass = isDark ? sellerTitleOnDark : sellerTitle
  const subtitleClass = isDark ? sellerSubtitleOnDark : sellerSubtitle

  return (
    <header className={centered
      ? 'flex flex-col items-center gap-3 text-center'
      : 'flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4'}>
      <div className={centered ? 'w-full' : 'min-w-0 flex-1'}>
        {eyebrow && <p className={eyebrowClass}>{eyebrow}</p>}
        {title ? <h2 className={`${eyebrow ? 'mt-1' : ''} ${centered ? 'text-center ' : ''}${titleClass}`}>{title}</h2> : null}
        {subtitle && <p className={subtitleClass}>{subtitle}</p>}
      </div>
      {action ? (
        <div className={centered ? 'flex w-full justify-center' : 'w-full shrink-0 sm:w-auto sm:self-start sm:pt-0.5'}>
          {action}
        </div>
      ) : null}
    </header>
  )
}

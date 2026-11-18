export default function AuthHeader({ eyebrow, title, description, layout = 'center' }) {
  const alignment =
    layout === 'desktop-left' ? 'text-center lg:text-left' : 'text-center'

  return (
    <header className={`mb-6 sm:mb-8 ${alignment}`}>
      {eyebrow && (
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.15em] text-brand-carmelita">
          {eyebrow}
        </p>
      )}
      <h1 className="font-script text-5xl leading-[1.15] text-brand-carmelita sm:text-6xl">
        {title}
      </h1>
      {description && (
        <p className="mt-2 text-sm leading-relaxed text-brand-carmelita/90 lg:mt-2.5">
          {description}
        </p>
      )}
    </header>
  )
}

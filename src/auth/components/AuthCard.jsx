export default function AuthCard({ children, className = '' }) {
  return (
    <article
      className={`rounded-2xl border border-brand-green/15 bg-brand-white p-5 shadow-[0_4px_20px_rgba(89,128,44,0.08)] sm:p-6 lg:rounded-2xl lg:p-5 ${className}`}
    >
      {children}
    </article>
  )
}

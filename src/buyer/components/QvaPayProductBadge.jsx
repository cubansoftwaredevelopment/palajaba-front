export default function QvaPayProductBadge({ className = '' }) {
  return (
    <span
      className={`pointer-events-none inline-flex items-center gap-1 rounded-full bg-white/95 px-1.5 py-0.5 shadow-[0_1px_6px_rgba(28,33,24,0.18)] ${className}`}
      title="Se puede pagar con QvaPay"
      aria-label="Se puede pagar con QvaPay"
    >
      <img src="/images/qvapay-mark.png" alt="" className="h-3.5 w-auto" />
      <span className="text-[0.58rem] font-bold leading-none tracking-tight text-[#6759EF]">QvaPay</span>
    </span>
  )
}

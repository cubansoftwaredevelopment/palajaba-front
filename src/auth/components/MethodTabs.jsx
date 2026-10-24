export default function MethodTabs({ options, value, onChange, ariaLabel }) {
  return (
    <div
      className="mb-4 flex rounded-full border border-brand-green/15 bg-brand-white p-1"
      role="tablist"
      aria-label={ariaLabel}
    >
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          role="tab"
          aria-selected={value === option.id}
          onClick={() => onChange(option.id)}
          className={`flex-1 rounded-full px-3 py-2 text-sm font-semibold transition-all ${
            value === option.id
              ? 'bg-brand-green text-brand-white shadow-sm'
              : 'text-brand-green sm:hover:bg-brand-yellow/15'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

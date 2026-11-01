import { PHONE_PREFIX, formatPhoneDigits, getPhoneDigits } from '../../lib/phone'
import { labelClass, phoneGroupClass, phoneInputClass } from './formStyles'

export default function PhoneField({
  id = 'phone',
  label = 'Número de teléfono',
  value,
  onChange,
  required = true,
  readOnly = false,
  hint = '',
}) {
  function handleChange(e) {
    onChange(getPhoneDigits(e.target.value))
  }

  return (
    <div>
      <label htmlFor={id} className={labelClass}>
        {label}
        {required && (
          <span className="text-brand-carmelita" aria-hidden="true">
            {' '}
            *
          </span>
        )}
      </label>
      <div className={phoneGroupClass}>
        <span className="flex shrink-0 items-center border-r border-brand-green/15 bg-brand-green/5 px-3 text-sm font-semibold text-brand-green">
          {PHONE_PREFIX}
        </span>
        <input
          id={id}
          type="tel"
          inputMode="numeric"
          value={formatPhoneDigits(value)}
          onChange={handleChange}
          readOnly={readOnly}
          className={`${phoneInputClass} ${readOnly ? 'cursor-default bg-brand-green/[0.04] text-brand-carmelita/75' : ''}`}
          placeholder="5 123 4567"
          autoComplete="tel-national"
          required={required && !readOnly}
        />
      </div>
      {hint ? <p className="mt-1.5 text-xs leading-relaxed text-brand-carmelita/70">{hint}</p> : null}
    </div>
  )
}

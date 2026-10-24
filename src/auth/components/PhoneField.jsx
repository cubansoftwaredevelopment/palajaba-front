import { PHONE_PREFIX, formatPhoneDigits, getPhoneDigits } from '../../lib/phone'
import { labelClass, phoneGroupClass, phoneInputClass } from './formStyles'

export default function PhoneField({
  id = 'phone',
  label = 'Número de teléfono',
  value,
  onChange,
  required = true,
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
          className={phoneInputClass}
          placeholder="5 123 4567"
          autoComplete="tel-national"
          required={required}
        />
      </div>
    </div>
  )
}

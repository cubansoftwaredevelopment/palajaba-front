import { ETECSA_ERROR_MASCOT } from '../../constants/branding'
import {
  resolveStateMascotSize,
  STATE_MASCOT_VARIANT_CLASS,
} from './stateIllustrationSizes'
import StateMascotImage from './StateMascotImage'

export default function ErrorState({
  title,
  message,
  variant = 'inline',
  size = 'md',
  className = '',
  children,
}) {
  const styles = STATE_MASCOT_VARIANT_CLASS[variant] || STATE_MASCOT_VARIANT_CLASS.inline
  const sizeKey = resolveStateMascotSize(size)

  return (
    <div className={`${styles.wrap} ${className}`.trim()} role="alert">
      <StateMascotImage src={ETECSA_ERROR_MASCOT.src} size={sizeKey} className={styles.image} />
      {title ? <h1 className={`mt-4 ${styles.title}`}>{title}</h1> : null}
      {message ? <p className={styles.message}>{message}</p> : null}
      {children ? <div className={styles.actions}>{children}</div> : null}
    </div>
  )
}

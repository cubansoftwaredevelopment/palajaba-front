import { useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { addPop, addTap } from '../../motion/presets'

const POP_MS = 850

export default function JabaAddButton({ className = '', onClick, children, burst = false, ...rest }) {
  const reduced = useReducedMotion()
  const [localBurst, setLocalBurst] = useState(false)
  const popping = burst || localBurst

  function handleClick(event) {
    const added = onClick?.(event)
    if (added === false || reduced) return
    setLocalBurst(true)
    window.setTimeout(() => setLocalBurst(false), POP_MS)
  }

  return (
    <motion.button
      type="button"
      {...rest}
      className={className}
      onClick={handleClick}
      whileTap={reduced ? undefined : addTap}
      animate={reduced ? undefined : popping ? addPop : { scale: 1, rotate: 0 }}
      transition={popping ? { duration: 0.85, ease: [0.22, 1, 0.36, 1] } : { duration: 0.2 }}
    >
      {children}
    </motion.button>
  )
}

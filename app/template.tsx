'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { MOTION } from '@/lib/motion'

/**
 * Route enter transition. App Router re-mounts templates on every navigation,
 * so each route fades and rises into place — a quiet, cinematic hand-off
 * between pages rather than a hard cut.
 *
 * Enter-only by design: true exit fades need AnimatePresence plumbing the App
 * Router doesn't expose for free, and an enter-only cross-fade reads as premium
 * without the complexity. On the home route the cinematic loader covers this
 * transition; on sub-routes the whole page (nav included) enters together.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  const reduce = useReducedMotion()

  return (
    <motion.div
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: MOTION.dur.medium, ease: [...MOTION.ease] }}
    >
      {children}
    </motion.div>
  )
}

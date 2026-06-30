'use client'

import { usePathname } from 'next/navigation'
import { motion, useReducedMotion } from 'framer-motion'
import { MOTION } from '@/lib/motion'

const PANELS = 5

export default function Template({ children }: { children: React.ReactNode }) {
  const reduce = useReducedMotion()
  const isHome = usePathname() === '/'          // loader already covers the home entrance
  const showCurtain = !reduce && !isHome

  return (
    <>
      {showCurtain && (
        <div className="fixed inset-0 z-[9997] flex pointer-events-none" aria-hidden="true">
          {Array.from({ length: PANELS }).map((_, i) => (
            <motion.div key={i} className="h-full bg-ink will-change-transform" style={{ width: `${100 / PANELS}%` }}
              initial={{ y: '0%' }} animate={{ y: '-100%' }}
              transition={{ duration: 1.0, ease: [...MOTION.ease], delay: 0.06 * i }} />
          ))}
        </div>
      )}
      <motion.div
        initial={reduce ? { opacity: 0 } : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: MOTION.dur.medium, ease: [...MOTION.ease], delay: showCurtain ? 0.4 : 0 }}>
        {children}
      </motion.div>
    </>
  )
}

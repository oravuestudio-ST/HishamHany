'use client'

import { createContext, useContext } from 'react'

/**
 * Where the home intro is:
 *   loading  → the viewfinder is closed, the count is running
 *   opening  → the bars are parting; the hero copy may start rising
 *   entered  → the page is released: header back, scroll chrome mounted
 * Interior routes are always "entered".
 */
export type IntroPhase = 'loading' | 'opening' | 'entered'

const PhaseContext = createContext<IntroPhase>('loading')

export function MotionProvider({
  phase,
  entered,
  children,
}: {
  phase?: IntroPhase
  /** Shorthand for interior routes: `entered` ≡ phase "entered". */
  entered?: boolean
  children: React.ReactNode
}) {
  const value: IntroPhase = phase ?? (entered ? 'entered' : 'loading')
  return <PhaseContext.Provider value={value}>{children}</PhaseContext.Provider>
}

/** The current intro phase. */
export function useIntroPhase(): IntroPhase {
  return useContext(PhaseContext)
}

/** True once the intro has released the page (always true off home). */
export function useEntered(): boolean {
  return useContext(PhaseContext) === 'entered'
}

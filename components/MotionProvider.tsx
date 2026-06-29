'use client'

import { createContext, useContext } from 'react'

/**
 * Shared "the loader has lifted" signal. The home page sets `entered` to true
 * when the cinematic loader finishes, and the hero + navigation start their
 * page-load sequence off this — so the intro plays on screen, in order, rather
 * than behind the loader overlay.
 */
const EnteredContext = createContext(false)

export function MotionProvider({
  entered,
  children,
}: {
  entered: boolean
  children: React.ReactNode
}) {
  return <EnteredContext.Provider value={entered}>{children}</EnteredContext.Provider>
}

/** True once the loader has finished and the site is revealed. */
export function useEntered(): boolean {
  return useContext(EnteredContext)
}

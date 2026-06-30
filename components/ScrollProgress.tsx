'use client'

import { useEffect, useRef } from 'react'

/**
 * Top scroll-progress bar + a "NN / 100" readout. rAF-driven off the document
 * scroll position (works with Lenis, which scrolls the window). Writes directly
 * to the DOM nodes — no per-frame React state — so it never thrashes layout.
 */
export default function ScrollProgress() {
  const fillRef = useRef<HTMLDivElement>(null)
  const numRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    let raf = 0
    let last = -1

    const update = () => {
      const doc = document.documentElement
      const max = doc.scrollHeight - window.innerHeight
      const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0
      const pct = Math.round(p * 100)
      if (pct !== last) {
        last = pct
        if (fillRef.current) fillRef.current.style.transform = `scaleX(${p})`
        if (numRef.current) numRef.current.textContent = String(pct).padStart(2, '0')
      }
      raf = requestAnimationFrame(update)
    }
    raf = requestAnimationFrame(update)
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <>
      <div className="scroll-progress-track" aria-hidden="true">
        <div ref={fillRef} className="scroll-progress-fill" />
      </div>
      <div
        className="fixed bottom-10 left-10 z-[9991] hidden md:flex items-baseline gap-2 pointer-events-none mix-blend-difference"
        aria-hidden="true"
      >
        <span ref={numRef} className="font-serif italic text-paper text-lg tabular-nums leading-none">00</span>
        <span className="font-sans text-[0.5rem] tracking-[0.3em] uppercase text-paper/70">/ 100</span>
      </div>
    </>
  )
}

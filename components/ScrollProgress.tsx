'use client'

import { useEffect, useRef } from 'react'

export interface Chapter {
  /** DOM id of the section this chapter names (without '#'). */
  id: string
  /** Label shown beside the NN/100 readout while the section holds the viewport. */
  label: string
}

/**
 * Top scroll-progress bar + a "NN / 100" readout. rAF-driven off the document
 * scroll position (works with Lenis, which scrolls the window). Writes directly
 * to the DOM nodes — no per-frame React state — so it never thrashes layout.
 *
 * With `chapters`, the readout also names where the reader is: an
 * IntersectionObserver watches each listed section against the middle band of
 * the viewport and swaps a small mono label as chapters change — the page
 * tells you where you are without a persistent HUD.
 */
export default function ScrollProgress({ chapters = [] }: { chapters?: Chapter[] }) {
  const fillRef = useRef<HTMLDivElement>(null)
  const numRef = useRef<HTMLSpanElement>(null)
  const chapterRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (chapters.length === 0) return
    const byTarget = new Map<Element, string>()
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && chapterRef.current) {
            chapterRef.current.textContent = byTarget.get(entry.target) ?? ''
          }
        }
      },
      // A thin band around the viewport's center — the chapter is whatever
      // section currently holds the reader's eye line, not whatever touches
      // the edges.
      { rootMargin: '-45% 0px -45% 0px' }
    )
    for (const { id, label } of chapters) {
      const el = document.getElementById(id)
      if (el) {
        byTarget.set(el, label)
        io.observe(el)
      }
    }
    return () => io.disconnect()
  }, [chapters])

  useEffect(() => {
    let raf = 0
    let last = -1

    const update = () => {
      raf = 0
      const doc = document.documentElement
      const max = doc.scrollHeight - window.innerHeight
      const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0
      const pct = Math.round(p * 100)
      if (pct !== last) {
        last = pct
        if (fillRef.current) fillRef.current.style.transform = `scaleX(${p})`
        if (numRef.current) numRef.current.textContent = String(pct).padStart(2, '0')
      }
    }

    // Coalesce bursts of scroll/resize events into one rAF write — and do
    // nothing at all while the page is at rest (the old version ran a rAF
    // loop forever, reading scrollHeight every frame).
    const schedule = () => { if (!raf) raf = requestAnimationFrame(update) }
    schedule()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule, { passive: true })
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
    }
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
        {chapters.length > 0 && (
          <span
            ref={chapterRef}
            className="ml-3 font-sans text-[0.5rem] tracking-[0.3em] uppercase text-paper/50 transition-opacity duration-500"
          />
        )}
      </div>
    </>
  )
}

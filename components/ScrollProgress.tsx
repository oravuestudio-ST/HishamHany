'use client'

import { useEffect, useRef } from 'react'
import { CHAPTER_EVENT, type ChapterEventDetail } from '@/hooks/useChapterScroll'

export interface Chapter {
  /** DOM id of the section this chapter names (without '#'). */
  id: string
  /** Label shown in the readout while the section holds the viewport. */
  label: string
}

/**
 * Top scroll-progress bar plus a quiet readout, bottom left. rAF-driven off
 * the document scroll position (works with Lenis, which scrolls the window)
 * and written straight to the DOM — no per-frame React state.
 *
 * The readout names where the reader is. Inside the home exhibition it counts
 * scenes ("03 / 06", from useChapterScroll's live geometry); elsewhere it shows
 * the section label. Sections are tracked as a Set of what currently crosses
 * the viewport's middle band, and the last one in document order wins — an
 * "entered" event alone gets stuck when sections overlap on scroll-up.
 */
export default function ScrollProgress({ chapters = [] }: { chapters?: Chapter[] }) {
  const fillRef = useRef<HTMLDivElement>(null)
  const numRef = useRef<HTMLSpanElement>(null)
  const totalRef = useRef<HTMLSpanElement>(null)
  const labelRef = useRef<HTMLSpanElement>(null)
  const sceneRef = useRef<ChapterEventDetail>({ index: -1, total: 0 })
  const sectionRef = useRef('')
  const pctRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const render = () => {
      const { index, total } = sceneRef.current
      const inScene = index >= 0
      if (numRef.current) {
        numRef.current.textContent = inScene ? String(index + 1).padStart(2, '0') : ''
        numRef.current.hidden = !inScene
      }
      if (totalRef.current) {
        totalRef.current.textContent = inScene ? `/ ${String(total).padStart(2, '0')}` : ''
        totalRef.current.hidden = !inScene
      }
      if (labelRef.current) labelRef.current.textContent = inScene ? '' : sectionRef.current
    }

    const onScene = (e: Event) => {
      sceneRef.current = (e as CustomEvent<ChapterEventDetail>).detail
      render()
    }
    window.addEventListener(CHAPTER_EVENT, onScene)

    const order = new Map<Element, number>()
    const labels = new Map<Element, string>()
    const visible = new Set<Element>()
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) visible.add(entry.target)
          else visible.delete(entry.target)
        }
        let best: Element | null = null
        visible.forEach((el) => { if (!best || order.get(el)! > order.get(best)!) best = el })
        sectionRef.current = best ? labels.get(best) ?? '' : ''
        render()
      },
      // A thin band around the viewport's centre: the section holding the
      // reader's eye line, not whatever touches the edges.
      { rootMargin: '-45% 0px -45% 0px' },
    )
    chapters.forEach(({ id, label }, i) => {
      const el = document.getElementById(id)
      if (!el) return
      order.set(el, i)
      labels.set(el, label)
      io.observe(el)
    })
    render()

    return () => {
      window.removeEventListener(CHAPTER_EVENT, onScene)
      io.disconnect()
    }
  }, [chapters])

  useEffect(() => {
    let raf = 0
    let last = -1
    const update = () => {
      raf = 0
      const doc = document.documentElement
      const max = doc.scrollHeight - window.innerHeight
      const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0
      const permille = Math.round(p * 1000)
      if (permille !== last) {
        last = permille
        if (fillRef.current) fillRef.current.style.transform = `scaleX(${p})`
        // Interior pages (no sections passed) keep the plain NN / 100 readout.
        if (pctRef.current) pctRef.current.textContent = String(Math.round(p * 100)).padStart(2, '0')
      }
    }
    // Coalesce bursts of scroll/resize events into one rAF write, and do
    // nothing at all while the page is at rest.
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
      {chapters.length > 0 ? (
        <div
          className="fixed bottom-10 left-10 z-progress hidden md:flex items-baseline gap-2 pointer-events-none mix-blend-difference"
          aria-hidden="true"
        >
          <span ref={numRef} hidden className="font-serif italic text-paper text-lg tabular-nums leading-none" />
          <span ref={totalRef} hidden className="font-sans text-label-xs text-paper/70 tabular-nums" />
          <span ref={labelRef} className="font-sans text-label-xs uppercase text-paper/70" />
        </div>
      ) : (
        <div
          className="fixed bottom-10 left-10 z-progress hidden md:flex items-baseline gap-2 pointer-events-none mix-blend-difference"
          aria-hidden="true"
        >
          <span ref={pctRef} className="font-serif italic text-paper text-lg tabular-nums leading-none">00</span>
          <span className="font-sans text-label-xs uppercase text-paper/70">/ 100</span>
        </div>
      )}
    </>
  )
}

'use client'

import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { useSettings } from '@/components/SettingsProvider'
import { CURSOR_FOLLOW, DUR, gsapEase } from '@/lib/motion'

type CursorState = 'idle' | 'hover' | 'image'

/**
 * An optional follower ring that sits alongside the native pointer — it never
 * replaces it. Over links it opens to a 32px ring; over imagery that leads
 * somewhere it carries a short label ("View"). Paper with mix-blend-difference,
 * so it reads on the ink stage and on paper alike, in either theme.
 *
 * Runs only on a fine pointer that can hover, with motion allowed and the
 * settings knob on. The follow loop runs while the ring is catching up and
 * stops once it has settled — nothing ticks while the pointer rests.
 */
export default function Cursor() {
  const { cursor: cursorOn } = useSettings()
  const ringRef = useRef<HTMLDivElement>(null)
  const [label, setLabel] = useState('')

  useEffect(() => {
    const ring = ringRef.current
    if (!ring) return

    const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches
    const motionOk = !window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (!cursorOn || !canHover || !motionOk) {
      ring.style.display = 'none'
      return
    }
    ring.style.display = ''

    let mouseX = 0, mouseY = 0
    let ringX = 0, ringY = 0
    let raf = 0
    let primed = false
    const setPos = gsap.quickSetter(ring, 'css') as (v: { x: number; y: number }) => void

    const follow = () => {
      ringX += (mouseX - ringX) * CURSOR_FOLLOW.lerp
      ringY += (mouseY - ringY) * CURSOR_FOLLOW.lerp
      setPos({ x: ringX, y: ringY })
      raf = Math.abs(mouseX - ringX) + Math.abs(mouseY - ringY) > 0.2 ? requestAnimationFrame(follow) : 0
    }

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return
      mouseX = e.clientX
      mouseY = e.clientY
      if (!primed) { primed = true; ringX = mouseX; ringY = mouseY }
      if (!raf) raf = requestAnimationFrame(follow)
    }

    // State changes answer the pointer: the touch curve, no overshoot.
    const T = { duration: DUR.micro, ease: gsapEase('touch'), overwrite: 'auto' as const }
    let current: CursorState = 'idle'
    const apply = (state: CursorState, text = '') => {
      if (state === current && state !== 'image') return
      current = state
      setLabel(state === 'image' ? text : '')
      if (state === 'image') gsap.to(ring, { scale: 1.75, opacity: 1, ...T })
      else if (state === 'hover') gsap.to(ring, { scale: 1, opacity: 1, ...T })
      else gsap.to(ring, { scale: 0.6, opacity: 0, ...T })
    }

    // Event delegation — works for dynamically loaded elements too. Imagery
    // only earns the label when it leads somewhere ([data-cursor]); the hero
    // opts out entirely ([data-cursor-plain]).
    const INTERACTIVE = 'a, button, [data-cursor]'
    const onOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (target.closest('[data-cursor-plain]')) return apply('idle')
      const labelled = target.closest('[data-cursor]') as HTMLElement | null
      if (labelled && target.closest('img, figure, [data-cursor-image], .chapter-stage')) {
        return apply('image', labelled.getAttribute('data-cursor') || 'View')
      }
      if (target.closest(INTERACTIVE)) apply('hover')
    }
    const onOut = (e: MouseEvent) => {
      const to = e.relatedTarget as HTMLElement | null
      if (!to || !to.closest?.(INTERACTIVE)) apply('idle')
    }

    // Centre on the pointer via GSAP's percent offsets (a CSS translate would be
    // folded into the x/y the follow loop writes).
    gsap.set(ring, { xPercent: -50, yPercent: -50, scale: 0.6, opacity: 0 })
    document.addEventListener('pointermove', onMove, { passive: true })
    document.addEventListener('mouseover', onOver)
    document.addEventListener('mouseout', onOut)

    return () => {
      cancelAnimationFrame(raf)
      document.removeEventListener('pointermove', onMove)
      document.removeEventListener('mouseover', onOver)
      document.removeEventListener('mouseout', onOut)
    }
  }, [cursorOn])

  return (
    <div
      ref={ringRef}
      aria-hidden="true"
      className="fixed top-0 left-0 w-8 h-8 border border-paper/70 rounded-full pointer-events-none z-cursor-ring flex items-center justify-center mix-blend-difference"
    >
      {label && (
        <span className="font-sans text-label-xs uppercase text-paper whitespace-nowrap" style={{ transform: 'scale(0.57)' }}>
          {label}
        </span>
      )}
    </div>
  )
}

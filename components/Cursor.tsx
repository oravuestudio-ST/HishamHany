'use client'

import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { useSettings } from '@/components/SettingsProvider'

type CursorState = 'default' | 'hover' | 'image'

/**
 * Three-state custom cursor:
 *   default → an 8px dot
 *   hover   → a 32px hollow ring around anything interactive
 *   image   → a 56px ring carrying a "View" label over imagery
 * States never snap — size, opacity, and label interpolate on a soft spring.
 * Monochrome throughout (mix-blend-difference does the theming). Hidden on
 * coarse pointers, under reduced motion, and when the settings knob is off.
 */
export default function Cursor() {
  const { cursor: cursorOn } = useSettings()
  const dotRef  = useRef<HTMLDivElement>(null)
  const ringRef = useRef<HTMLDivElement>(null)
  const [label, setLabel] = useState('')

  useEffect(() => {
    const dot  = dotRef.current
    const ring = ringRef.current
    if (!dot || !ring) return

    const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches
    const motionOk = !window.matchMedia('(prefers-reduced-motion: reduce)').matches
    document.body.toggleAttribute('data-cursor-off', !cursorOn)
    if (!cursorOn || !canHover || !motionOk) {
      dot.style.display = 'none'
      ring.style.display = 'none'
      return
    }
    dot.style.display = ''
    ring.style.display = ''

    let mouseX = 0, mouseY = 0
    let ringX  = 0, ringY  = 0
    let raf: number

    // quickTo/quickSetter build their tween once and re-target it per call —
    // no per-mousemove tween allocation.
    const dotX = gsap.quickTo(dot, 'x', { duration: 0.08, ease: 'none' })
    const dotY = gsap.quickTo(dot, 'y', { duration: 0.08, ease: 'none' })
    const ringSet = gsap.quickSetter(ring, 'css') as (v: { x: number; y: number }) => void

    const onMove = (e: MouseEvent) => {
      mouseX = e.clientX
      mouseY = e.clientY
      dotX(mouseX)
      dotY(mouseY)
    }

    const animate = () => {
      ringX += (mouseX - ringX) * 0.08
      ringY += (mouseY - ringY) * 0.08
      ringSet({ x: ringX, y: ringY })
      raf = requestAnimationFrame(animate)
    }
    animate()

    // The soft spring every state change rides — a touch of overshoot reads
    // as physical without turning bouncy.
    const SPRING = { duration: 0.4, ease: 'back.out(1.4)' } as const

    let current: CursorState = 'default'
    const apply = (state: CursorState, text = '') => {
      if (state === current && state !== 'image') return
      current = state
      setLabel(state === 'image' ? text : '')
      if (state === 'image') {
        gsap.to(ring, { scale: 1.75, opacity: 1, ...SPRING })
        gsap.to(dot,  { scale: 0, ...SPRING })
      } else if (state === 'hover') {
        gsap.to(ring, { scale: 1, opacity: 1, ...SPRING })
        gsap.to(dot,  { scale: 0.5, ...SPRING })
      } else {
        gsap.to(ring, { scale: 0.6, opacity: 0, ...SPRING })
        gsap.to(dot,  { scale: 1, ...SPRING })
      }
    }

    // Event delegation — works for dynamically loaded elements too.
    const onOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement

      if (target.closest('img, [data-cursor-image], figure')) {
        const labelled = target.closest('[data-cursor]') as HTMLElement | null
        apply('image', labelled?.getAttribute('data-cursor') || 'View')
        return
      }
      if (target.closest('a, button, [data-cursor]')) {
        apply('hover')
      }
    }

    const onOut = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest('a, button, [data-cursor], img, [data-cursor-image], figure')) return
      apply('default')
    }

    // Start collapsed.
    gsap.set(ring, { scale: 0.6, opacity: 0 })

    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseover', onOver)
    document.addEventListener('mouseout',  onOut)

    return () => {
      cancelAnimationFrame(raf)
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseover', onOver)
      document.removeEventListener('mouseout',  onOut)
    }
  }, [cursorOn])

  return (
    <>
      <div
        ref={dotRef}
        className="fixed top-0 left-0 w-2 h-2 bg-fg rounded-full pointer-events-none z-[9997] -translate-x-1/2 -translate-y-1/2 mix-blend-difference"
      />
      <div
        ref={ringRef}
        className="fixed top-0 left-0 w-8 h-8 border border-fg/60 rounded-full pointer-events-none z-[9996] -translate-x-1/2 -translate-y-1/2 flex items-center justify-center mix-blend-difference"
      >
        {label && (
          <span className="font-sans text-[0.45rem] tracking-[0.3em] uppercase text-fg whitespace-nowrap">
            {label}
          </span>
        )}
      </div>
    </>
  )
}

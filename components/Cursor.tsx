'use client'

import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { MOTION, gsapEase } from '@/lib/motion'
import { useSettings } from '@/components/SettingsProvider'

/** Read a CSS channel var ("36 33 201") as a concrete "rgb(36 33 201)" string
 *  with optional alpha — so gsap can tween to it (it can't parse rgb(var())). */
function channelColor(name: string, alpha = 1): string {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  return alpha === 1 ? `rgb(${v})` : `rgb(${v} / ${alpha})`
}

export default function Cursor() {
  const { cursor: cursorOn } = useSettings()
  const dotRef  = useRef<HTMLDivElement>(null)
  const ringRef = useRef<HTMLDivElement>(null)
  const [label, setLabel] = useState('')

  useEffect(() => {
    const dot  = dotRef.current
    const ring = ringRef.current
    if (!dot || !ring) return

    // Only run on a fine pointer that can hover, with motion allowed, and only
    // when the user hasn't switched the custom cursor off. Otherwise stand down
    // and keep the elements hidden (and let the native cursor show — see the
    // body[data-cursor-off] rule in globals/JS below).
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

    const onMove = (e: MouseEvent) => {
      mouseX = e.clientX
      mouseY = e.clientY
      gsap.to(dot, { x: mouseX, y: mouseY, duration: 0.08, ease: 'none' })
    }

    const animate = () => {
      ringX += (mouseX - ringX) * 0.08
      ringY += (mouseY - ringY) * 0.08
      gsap.set(ring, { x: ringX, y: ringY })
      raf = requestAnimationFrame(animate)
    }
    animate()

    const ease = gsapEase()

    // Event delegation — works for dynamically loaded elements too. Scales are
    // restrained; colours are read live from the theme vars so the cursor tracks
    // the active palette / accent.
    const onOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement

      if (target.closest('img, [data-cursor-image], .webgl-image, figure')) {
        gsap.to(ring, { scale: 2.5, opacity: 0.3, duration: MOTION.dur.medium, ease })
        return
      }

      const el = target.closest('button, .magnetic-btn, a, [data-cursor]')
      if (!el) return

      const data = (el as HTMLElement).getAttribute('data-cursor')
      if (data) setLabel(data)

      if (el.tagName === 'BUTTON' || (el as HTMLElement).classList.contains('magnetic-btn')) {
        gsap.to(ring, { scale: 2.2, borderColor: channelColor('--accent-rgb', 0.85), duration: MOTION.dur.fast, ease })
        gsap.to(dot,  { backgroundColor: channelColor('--accent-rgb'), scale: 0.5, duration: MOTION.dur.fast, ease })
      } else {
        gsap.to(ring, { scale: 2.0, opacity: 0.5, duration: MOTION.dur.fast, ease })
        gsap.to(dot,  { scale: 0.4, duration: MOTION.dur.fast, ease })
      }
    }

    const onOut = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest('button, .magnetic-btn, a, [data-cursor], img, [data-cursor-image], .webgl-image, figure')) return

      setLabel('')
      gsap.to(ring, { scale: 1, opacity: 1, borderColor: channelColor('--fg-rgb', 0.5), duration: MOTION.dur.fast, ease })
      gsap.to(dot,  { backgroundColor: channelColor('--fg-rgb'), scale: 1, duration: MOTION.dur.fast, ease })
    }

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
        className="fixed top-0 left-0 w-1.5 h-1.5 bg-fg rounded-full pointer-events-none z-[9997] -translate-x-1/2 -translate-y-1/2 mix-blend-difference"
      />
      <div
        ref={ringRef}
        className="fixed top-0 left-0 w-8 h-8 border border-fg/50 rounded-full pointer-events-none z-[9996] -translate-x-1/2 -translate-y-1/2 flex items-center justify-center"
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

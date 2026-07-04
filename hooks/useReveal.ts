'use client'

import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { MOTION, gsapEase, scrollDefaults, prefersReducedMotion, viewportScale } from '@/lib/motion'
import { PRESETS, type RevealPreset } from '@/animations/presets'

interface RevealOptions {
  /**
   * Stagger the children matching this selector instead of animating the
   * container itself (breathe/threshold content, stack cards).
   */
  stagger?: string
  /** Extra delay before the reveal starts (s). */
  delay?: number
}

/**
 * One hook, five entrances. Attach the returned ref to the section container;
 * the preset decides the choreography (recipes live in animations/presets.ts).
 *
 * Structural conventions per preset:
 *  - breathe   → container, or `stagger` children
 *  - threshold → a `[data-reveal-line]` rule inside the container expands
 *                first; `stagger` children (or the container) fade in beneath
 *  - curtain   → the container is clipped open; an `img` inside settles from
 *                1.06 overscale to rest
 *  - lines     → `.reveal-inner` masked spans rise line by line
 *  - stack     → `stagger` children alternate 30/40px entrance offsets
 *
 * Reduced motion: every preset collapses to a 0.3s opacity fade — content
 * never fails to appear.
 */
export function useReveal<T extends HTMLElement = HTMLDivElement>(
  preset: RevealPreset,
  options: RevealOptions = {}
) {
  const ref = useRef<T>(null)
  const { stagger, delay = 0 } = options

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const ease = gsapEase()
    // Mobile adaptation: same choreography, tighter timing, shorter travel.
    const vp = viewportScale()
    const children = stagger ? Array.from(el.querySelectorAll<HTMLElement>(stagger)) : []
    const targets = children.length > 0 ? children : [el]

    if (prefersReducedMotion()) {
      const ctx = gsap.context(() => {
        // The one universal fallback: a quiet fade, still scroll-gated.
        gsap.fromTo(
          el,
          { opacity: 0 },
          { opacity: 1, duration: 0.3, ease: 'none', scrollTrigger: scrollDefaults(el) }
        )
        // Neutralise any hidden initial states the markup carries.
        gsap.set(targets, { opacity: 1, y: 0, clearProps: 'transform' })
      }, el)
      return () => ctx.revert()
    }

    const ctx = gsap.context(() => {
      switch (preset) {
        case 'breathe': {
          const p = PRESETS.breathe
          gsap.fromTo(
            targets,
            { opacity: 0, y: p.distance * vp.dist },
            {
              opacity: 1,
              y: 0,
              duration: p.dur * vp.dur,
              delay,
              ease,
              stagger: children.length > 0 ? MOTION.stagger : 0,
              scrollTrigger: scrollDefaults(el),
            }
          )
          break
        }

        case 'threshold': {
          const p = PRESETS.threshold
          const line = el.querySelector<HTMLElement>('[data-reveal-line]')
          const tl = gsap.timeline({ delay, scrollTrigger: scrollDefaults(el) })
          if (line) {
            tl.fromTo(
              line,
              { scaleX: 0 },
              { scaleX: 1, duration: p.lineDur * vp.dur, ease, transformOrigin: 'center center' },
              0
            )
          }
          tl.fromTo(
            targets,
            { opacity: 0, y: p.distance * vp.dist },
            {
              opacity: 1,
              y: 0,
              duration: p.dur * vp.dur,
              ease,
              stagger: children.length > 0 ? MOTION.stagger : 0,
            },
            line ? p.contentAt * vp.dur : 0
          )
          break
        }

        case 'curtain': {
          const p = PRESETS.curtain
          const img = el.querySelector('img')
          const tl = gsap.timeline({ delay, scrollTrigger: scrollDefaults(el) })
          tl.fromTo(el, { clipPath: p.clipFrom }, { clipPath: p.clipTo, duration: p.dur * vp.dur, ease }, 0)
          if (img) {
            tl.fromTo(img, { scale: p.overscale }, { scale: 1, duration: p.dur * vp.dur + 0.4, ease }, 0)
          }
          break
        }

        case 'lines': {
          const p = PRESETS.lines
          const lineEls = el.querySelectorAll<HTMLElement>('.reveal-inner')
          if (lineEls.length === 0) break
          gsap.fromTo(
            lineEls,
            { yPercent: p.fromPercent },
            {
              yPercent: 0,
              duration: p.dur * vp.dur,
              delay,
              ease,
              stagger: p.stagger,
              scrollTrigger: scrollDefaults(el),
            }
          )
          break
        }

        case 'stack': {
          const p = PRESETS.stack
          targets.forEach((t, i) => {
            gsap.fromTo(
              t,
              { opacity: 0, y: p.offsets[i % p.offsets.length] * vp.dist },
              {
                opacity: 1,
                y: 0,
                duration: p.dur * vp.dur,
                delay: delay + i * p.stagger,
                ease,
                scrollTrigger: scrollDefaults(el),
              }
            )
          })
          break
        }
      }
    }, el)

    return () => ctx.revert()
  }, [preset, stagger, delay])

  return ref
}

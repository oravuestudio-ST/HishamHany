'use client'

import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { gsapEase, prefersReducedMotion, registerMotion } from '@/lib/motion'

interface CountUpOptions {
  duration?: number
  start?: string
  format?: (n: number) => string
}

/** Count-up numerals: 0 → target on scroll-in, signature ease, fires once.
 *  Reduced motion: render the final value immediately. */
export function useCountUp<T extends HTMLElement = HTMLSpanElement>(target: number, options: CountUpOptions = {}) {
  const ref = useRef<T>(null)
  const { duration = 1.5, start = 'top 85%', format = (n) => String(Math.floor(n)) } = options

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (prefersReducedMotion()) { el.textContent = format(target); return }
    registerMotion()
    const obj = { v: 0 }
    const ctx = gsap.context(() => {
      gsap.to(obj, {
        v: target, duration, ease: gsapEase(),
        onUpdate() { el.textContent = format(obj.v) },
        scrollTrigger: { trigger: el, start, once: true },
      })
    }, el)
    return () => ctx.revert()
  }, [target, duration, start])

  return ref
}

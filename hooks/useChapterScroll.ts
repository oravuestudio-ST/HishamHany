'use client'

import { useEffect } from 'react'
import type { RefObject } from 'react'
import { gsap } from 'gsap'
import { CHAPTER, DUR, MOBILE, MQ, STAGGER, gsapEase, registerMotion } from '@/lib/motion'
import { getLenis } from '@/lib/lenis'

/** Fired on window whenever the scene holding the reader's eye line changes. */
export const CHAPTER_EVENT = 'hh:chapter'
export interface ChapterEventDetail {
  /** 0-based chapter index, or -1 outside the journey. */
  index: number
  total: number
}

const clamp01 = (v: number) => Math.min(1, Math.max(0, v))

/** The once-per-visit copy reveal for one scene. */
function copyTimeline(scope: Element, scale = 1): gsap.core.Timeline {
  const ease = gsapEase()
  return gsap
    .timeline({ paused: true })
    .to(scope.querySelectorAll('.chapter-line'), { yPercent: 0, duration: DUR.cinematic * scale, ease, stagger: STAGGER.lines }, 0)
    .to(scope.querySelectorAll('.chapter-fade'), { opacity: 1, y: 0, duration: DUR.reveal * scale, ease, stagger: STAGGER.lines }, DUR.micro)
}

function hideCopy(scope: Element) {
  gsap.set(scope.querySelectorAll('.chapter-line'), { yPercent: 110 })
  gsap.set(scope.querySelectorAll('.chapter-fade'), { opacity: 0, y: 10 })
}

/**
 * Immersive mode (MQ.immersive): every scene is a CSS-sticky stage and its
 * motion is a paused timeline whose progress is slaved to LIVE geometry.
 *
 * Why live rects: cached ScrollTrigger start/end values near pinned or sticky
 * layouts were traced landing on pre-layout measurements in this codebase (see
 * useStackedSeam). Each tick reads only the untransformed <li> boxes — never a
 * stage, which is held at top:0 and scaled, so measuring it would feed the
 * animation back into itself.
 *
 * A scene's pass is measured in viewport heights: arrive (1) → hold
 * (--hold/100) → be covered by the next scene (1).
 */
function setupImmersive(items: HTMLElement[], hero: HTMLElement | null) {
  type Scene = {
    li: HTMLElement
    span: number
    drive: (p: number) => void
    copy: gsap.core.Timeline | null
    copyShown: boolean
  }
  const vh = () => window.innerHeight

  const scenes: Scene[] = items.map((li) => {
    const holdVh = parseFloat(getComputedStyle(li).getPropertyValue('--hold')) || CHAPTER.hold.hung
    const E = 1
    const H = holdVh / 100
    const X = 1
    const T = E + H + X
    const clip = li.querySelector('.plate-clip')
    const img = li.querySelector('.plate-img')
    const brackets = li.querySelector('.chapter-brackets')
    const recede = li.querySelector('.scene-recede')
    const dim = li.querySelector('.scene-dim')

    const tl = gsap.timeline({ paused: true, defaults: { ease: 'none' } })
    // Arrive: the plate opens from the viewfinder window as the stage rises.
    if (clip) tl.fromTo(clip, { clipPath: CHAPTER.openInset }, { clipPath: 'inset(0% 0% 0% 0%)', duration: E * 0.75 }, E * 0.25)
    if (img) {
      tl.fromTo(img, { scale: CHAPTER.openScale }, { scale: CHAPTER.restScale, duration: E * 0.75 }, E * 0.25)
      // Drift across the whole pass, inside the restScale overscan.
      tl.fromTo(img, { yPercent: CHAPTER.drift }, { yPercent: -CHAPTER.drift, duration: T }, 0)
    }
    if (brackets) tl.fromTo(brackets, { opacity: 0 }, { opacity: 1, duration: E * 0.5 }, E * 0.5)
    // Covered: recede beneath the next scene — scale + an ink overlay, never filter.
    if (recede) tl.to(recede, { scale: CHAPTER.recedeScale, transformOrigin: 'center 40%', duration: X }, E + H)
    if (dim) tl.to(dim, { opacity: CHAPTER.recedeDim, duration: X }, E + H)
    tl.set({}, {}, T) // pad so progress maps 1:1 onto the whole pass

    const top = li.getBoundingClientRect().top
    const arrived = (vh() - top) / vh()
    const copyShown = arrived >= CHAPTER.copyAt
    if (!copyShown) hideCopy(li)
    tl.progress(clamp01((vh() - top) / (T * vh())))

    return {
      li,
      span: T,
      drive: gsap.quickTo(tl, 'progress', { duration: CHAPTER.scrub, ease: 'power2.out' }),
      copy: copyShown ? null : copyTimeline(li),
      copyShown,
    }
  })

  // The hero's exit is driven by the first scene rising over it.
  let heroDrive: ((p: number) => void) | null = null
  if (hero && items[0]) {
    const tl = gsap.timeline({ paused: true, defaults: { ease: 'none' } })
    const recede = hero.querySelector('.scene-recede')
    const dim = hero.querySelector('.scene-dim')
    const copy = hero.querySelector('.hero-copy')
    const drift = hero.querySelector('.scene-drift')
    if (copy) tl.to(copy, { y: -60, opacity: 0, duration: 0.5 }, 0)
    if (drift) tl.to(drift, { yPercent: -CHAPTER.drift, duration: 1 }, 0)
    if (recede) tl.to(recede, { scale: CHAPTER.recedeScale, transformOrigin: 'center 40%', duration: 1 }, 0)
    if (dim) tl.to(dim, { opacity: CHAPTER.recedeDim, duration: 1 }, 0)
    heroDrive = gsap.quickTo(tl, 'progress', { duration: CHAPTER.scrub, ease: 'power2.out' })
  }

  // Only scenes near the viewport are measured each tick.
  const active = new Set<Scene>()
  const byLi = new Map(scenes.map((s) => [s.li, s]))
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        const s = byLi.get(e.target as HTMLElement)
        if (!s) continue
        if (e.isIntersecting) active.add(s)
        else {
          active.delete(s)
          // Left the neighbourhood mid-flight (anchor jump, End key): settle it.
          s.drive(e.boundingClientRect.top > 0 ? 0 : 1)
        }
      }
      schedule()
    },
    { rootMargin: '100% 0px 100% 0px' },
  )
  scenes.forEach((s) => io.observe(s.li))

  let raf = 0
  const update = () => {
    raf = 0
    const h = vh()
    if (heroDrive && items[0]) heroDrive(clamp01((h - items[0].getBoundingClientRect().top) / h))
    active.forEach((s) => {
      const top = s.li.getBoundingClientRect().top
      s.drive(clamp01((h - top) / (s.span * h)))
      if (!s.copyShown && (h - top) / h >= CHAPTER.copyAt) {
        s.copyShown = true
        s.copy?.play()
      }
    })
  }
  const schedule = () => { if (!raf) raf = requestAnimationFrame(update) }
  window.addEventListener('scroll', schedule, { passive: true })
  window.addEventListener('resize', schedule, { passive: true })
  schedule()

  return () => {
    io.disconnect()
    cancelAnimationFrame(raf)
    window.removeEventListener('scroll', schedule)
    window.removeEventListener('resize', schedule)
  }
}

/**
 * Touch, narrow and hybrid devices: no sticky dwell, no overlap — each scene
 * is a full-height card that opens once as it comes into view.
 */
function setupReveal(items: HTMLElement[]) {
  const s = MOBILE.dur
  const ease = gsapEase()
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue
        io.unobserve(e.target)
        const li = e.target
        const tl = copyTimeline(li, s)
        const clip = li.querySelector('.plate-clip')
        const img = li.querySelector('.plate-img')
        if (clip) tl.to(clip, { clipPath: 'inset(0% 0% 0% 0%)', duration: DUR.cinematic * s, ease }, 0)
        if (img) tl.to(img, { scale: CHAPTER.restScale, duration: DUR.cinematic * s, ease }, 0)
        tl.play()
      }
    },
    { threshold: 0.2 },
  )
  const h = window.innerHeight
  for (const li of items) {
    // Already on screen when this runs (reload mid-page): leave it finished.
    if (li.getBoundingClientRect().top < h * 0.85) continue
    hideCopy(li)
    gsap.set(li.querySelectorAll('.plate-clip'), { clipPath: CHAPTER.openInset })
    gsap.set(li.querySelectorAll('.plate-img'), { scale: CHAPTER.openScale })
    io.observe(li)
  }
  return () => io.disconnect()
}

/** Which scene holds the reader's eye line — the counter's source of truth. */
function trackActiveChapter(items: HTMLElement[]) {
  let current = -2
  let raf = 0
  const update = () => {
    raf = 0
    const mid = window.innerHeight / 2
    let index = -1
    items.forEach((li, i) => {
      const r = li.getBoundingClientRect()
      // Later scenes overlap earlier ones, so the last match is the one on top.
      if (r.top <= mid && r.bottom > mid) index = i
    })
    if (index !== current) {
      current = index
      window.dispatchEvent(new CustomEvent<ChapterEventDetail>(CHAPTER_EVENT, { detail: { index, total: items.length } }))
    }
  }
  const schedule = () => { if (!raf) raf = requestAnimationFrame(update) }
  window.addEventListener('scroll', schedule, { passive: true })
  window.addEventListener('resize', schedule, { passive: true })
  schedule()
  return () => {
    cancelAnimationFrame(raf)
    window.removeEventListener('scroll', schedule)
    window.removeEventListener('resize', schedule)
  }
}

/**
 * Keyboard: focusing a scene's link brings that scene fully on stage. Without
 * this, Shift+Tab back to an earlier scene would land on a stage that is
 * still held beneath the current one — focused but invisible.
 */
function followFocus(list: HTMLElement) {
  const onFocus = (e: FocusEvent) => {
    const li = (e.target as HTMLElement).closest?.('.chapter') as HTMLElement | null
    if (!li || !window.matchMedia(MQ.immersive).matches) return
    const top = li.getBoundingClientRect().top
    const hold = (parseFloat(getComputedStyle(li).getPropertyValue('--hold')) || 0) / 100 * window.innerHeight
    if (top <= 0 && top >= -hold) return // already arrived and holding
    const target = window.scrollY + top
    const lenis = getLenis()
    if (lenis) lenis.scrollTo(target, { immediate: true })
    else window.scrollTo(0, target)
  }
  list.addEventListener('focusin', onFocus)
  return () => list.removeEventListener('focusin', onFocus)
}

/**
 * Drives the chapter journey and the hero's exit. Reduced motion gets nothing
 * but the counter: the scenes are already legible as rendered. gsap.matchMedia
 * reverts every inline style the moment a query flips (e.g. reduced motion
 * switched on mid-visit), so the static layout is never left half-animated.
 */
export function useChapterScroll(listRef: RefObject<HTMLElement>, heroRef?: RefObject<HTMLElement>) {
  useEffect(() => {
    const list = listRef.current
    if (!list) return
    registerMotion()
    const items = Array.from(list.querySelectorAll<HTMLElement>(':scope > .chapter'))
    if (items.length === 0) return

    const mm = gsap.matchMedia()
    mm.add({ immersive: MQ.immersive, reduce: '(prefers-reduced-motion: reduce)' }, (ctx) => {
      const { immersive, reduce } = ctx.conditions as { immersive: boolean; reduce: boolean }
      if (reduce) return
      return immersive ? setupImmersive(items, heroRef?.current ?? null) : setupReveal(items)
    })
    const stopCounter = trackActiveChapter(items)
    const stopFocus = followFocus(list)

    return () => {
      mm.revert()
      stopCounter()
      stopFocus()
    }
  }, [listRef, heroRef])
}

'use client'

import { useEffect, useLayoutEffect, useRef } from 'react'
import { gsap } from 'gsap'
import Logo from '@/components/Logo'
import Viewfinder from '@/components/Viewfinder'
import { DUR, LOAD, gsapEase, registerMotion } from '@/lib/motion'
import { formatCount, heroReady, nextCount, trackIntroAssets } from '@/lib/preload'

// Layout effect so the intro claims its starting state before first paint
// after hydration; plain effect on the server, where it never runs anyway.
const useIsoLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect

/** Glyph index → its distance from the centre of HISHAM HANY (10 glyphs). */
const glyphOffset = (i: number) => (i % 10) - 4.5

interface LoaderProps {
  /** The bars have started parting — the hero copy may begin to rise. */
  onOpening: () => void
  /** The page is released (header, scroll chrome). Called exactly once. */
  onEntered: () => void
}

/**
 * The home intro — a viewfinder over the hero photograph.
 *
 * The hero image is painted from the first frame (it stays the LCP element);
 * this overlay only covers it. Four ink bars leave a small 3:2 window open; a
 * veil inside the window lifts once the photo is ready; beneath it, like a
 * print caption, the wordmark tracks in and a real 000→100 count runs on
 * genuine milestones (lib/preload.ts). At 100 the caption leaves while the bars
 * part to full-bleed — the loader becomes the hero, no curtain, no hard cut.
 *
 * Whether it plays at all is decided before paint by the inline bootstrap
 * (html[data-intro], app/layout.tsx), which also owns the failsafes. This
 * component claims the intro ("run"), finishes it ("done"), and fast-forwards
 * on the first wheel, touch, key or click — nobody waits on a flourish.
 */
export default function Loader({ onOpening, onEntered }: LoaderProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const countRef = useRef<HTMLSpanElement>(null)

  useIsoLayoutEffect(() => {
    const root = rootRef.current
    const html = document.documentElement
    const initial = html.dataset.intro

    // No intro this load (reload, deep link, in-app return, reduced motion).
    if (!root || (initial !== 'full' && initial !== 'short')) {
      onEntered()
      return
    }

    // Arrived somewhere the intro can't be seen, or too late to be worth it:
    // put the finished page up immediately.
    if (window.scrollY > 0 || document.hidden || performance.now() / 1000 > LOAD.maxWait) {
      html.dataset.intro = 'done'
      onEntered()
      return
    }

    registerMotion()
    const full = initial === 'full'
    const ease = gsapEase()
    const q = gsap.utils.selector(root)
    const [top, bottom, left, right] = ['top', 'bottom', 'left', 'right'].map((s) => q(`.intro-bar--${s}`)[0])
    const win = q('.intro-window')[0]
    const veil = q('.intro-veil')[0]
    const caption = q('.intro-caption')[0]
    const brackets = q('.viewfinder > span')
    const counter = countRef.current

    try { sessionStorage.setItem('hh-intro', '1') } catch { /* private mode — the intro just stays "full" */ }

    let finished = false
    let handoff: gsap.core.Timeline | null = null
    const timers: number[] = []

    // ── Beat 1: the wordmark tracks in (full intro only). Two stacked copies
    //    of the lockup — one statically blurred — cross-fade, so the focus pull
    //    is an opacity change, never an animated filter.
    const intro = gsap.timeline()
    if (full) {
      intro
        .fromTo(q('.intro-mark'), { opacity: 0, scale: 1.03 }, { opacity: 1, scale: 1, duration: DUR.reveal, ease }, 0)
        .fromTo(q('.logo-glyph'), { x: (i: number) => glyphOffset(i) * LOAD.trackSpread }, { x: 0, duration: DUR.reveal, ease }, 0)
        .fromTo(q('.intro-mark-blur'), { opacity: 0.9 }, { opacity: 0, duration: DUR.reveal, ease }, 0)
        .fromTo(counter, { opacity: 0 }, { opacity: 1, duration: DUR.swift, ease }, DUR.micro)
    }

    // ── Beat 3: the handoff. Built when it starts, so the bracket travel is
    //    measured against the viewport as it is then.
    const finish = () => {
      if (finished) return
      finished = true
      html.dataset.intro = 'done'
      detach()
    }
    const startHandoff = () => {
      if (handoff || finished) return handoff
      gsap.ticker.remove(tick)
      const vw = window.innerWidth
      const vh = window.innerHeight
      const w = win.getBoundingClientRect()
      const hold = full ? LOAD.hold : 0
      const openAt = hold + (full ? LOAD.out * 0.5 : 0)

      handoff = gsap.timeline({ onComplete: finish })
      if (full) handoff.to(caption, { opacity: 0, y: -12, duration: LOAD.out, ease }, hold)
      handoff
        .call(onOpening, undefined, openAt)
        .to(top, { yPercent: -100, duration: LOAD.open, ease }, openAt)
        .to(bottom, { yPercent: 100, duration: LOAD.open, ease }, openAt)
        .to(left, { xPercent: -100, duration: LOAD.open, ease }, openAt)
        .to(right, { xPercent: 100, duration: LOAD.open, ease }, openAt)
        // A photo that arrived late still develops as the window opens.
        .to(veil, { opacity: 0, duration: LOAD.out, ease }, openAt)
        // The brackets ride the window's edges out to the frame of the screen.
        .to(brackets[0], { x: -w.left, y: -w.top, opacity: 0, duration: LOAD.open, ease }, openAt)
        .to(brackets[1], { x: vw - w.right, y: -w.top, opacity: 0, duration: LOAD.open, ease }, openAt)
        .to(brackets[2], { x: -w.left, y: vh - w.bottom, opacity: 0, duration: LOAD.open, ease }, openAt)
        .to(brackets[3], { x: vw - w.right, y: vh - w.bottom, opacity: 0, duration: LOAD.open, ease }, openAt)
        .call(onEntered, undefined, openAt + LOAD.open * LOAD.releaseAt)
      return handoff
    }

    // ── Beat 2: the count. Real progress, paced (lib/preload.ts); deadlines
    //    are measured from navigation start, not from hydration.
    const tracker = trackIntroAssets()
    let shown = 0
    let started = 0
    function tick(_time: number, deltaMs: number) {
      const now = performance.now() / 1000
      if (!started) started = now
      shown = nextCount(
        { real: tracker.read(), shown, dt: deltaMs / 1000, elapsed: now - started },
        { minCount: LOAD.minCount, deadline: now >= LOAD.maxWait },
      )
      if (counter) counter.textContent = formatCount(shown)
      if (shown >= 1) startHandoff()
    }

    if (full) {
      gsap.ticker.add(tick)
      // The photo develops once the wordmark has settled — one beat at a time.
      const markSettled = new Promise<void>((resolve) => { intro.eventCallback('onComplete', () => resolve()) })
      Promise.all([heroReady(), markSettled]).then(() => {
        if (!handoff && !finished) gsap.to(veil, { opacity: 0, duration: DUR.swift, ease })
      })
    } else {
      // Short intro: assets are cached this session — open as soon as the
      // photo is decoded (or the deadline passes), no count.
      heroReady().then(() => { startHandoff() })
      timers.push(window.setTimeout(() => { startHandoff() }, Math.max(0, LOAD.maxWait * 1000 - performance.now())))
    }

    // Any input fast-forwards — synchronously, so the header and copy are
    // already visible when the browser acts on the key or the scroll.
    const skip = () => {
      if (finished) return
      intro.progress(1)
      startHandoff()?.progress(1)
    }
    const INPUTS = ['wheel', 'touchstart', 'keydown', 'pointerdown'] as const
    INPUTS.forEach((type) => window.addEventListener(type, skip, { passive: true }))
    function detach() {
      INPUTS.forEach((type) => window.removeEventListener(type, skip))
      timers.forEach(clearTimeout)
      gsap.ticker.remove(tick)
    }

    // JS watchdog: if rAF stalls (or anything above throws later), finish.
    const ceiling = LOAD.maxWait + LOAD.hold + LOAD.out + LOAD.open + DUR.reveal
    timers.push(window.setTimeout(skip, Math.max(0, ceiling * 1000 - performance.now())))

    // Short intro: no veil or caption to play, so hide them before 'run'
    // reveals the overlay's CSS-gated starting state.
    if (!full) {
      gsap.set(veil, { opacity: 0 })
      gsap.set(caption, { display: 'none' })
    }

    // Claimed: from here the bootstrap's first failsafe stands down.
    html.dataset.intro = 'run'

    return () => {
      detach()
      intro.kill()
      handoff?.kill()
      // Unmounted mid-intro (StrictMode's double effect, or a navigation):
      // hand the starting state back so a re-run replays from the top.
      if (!finished) html.dataset.intro = initial
    }
  }, [onOpening, onEntered])

  return (
    <div ref={rootRef} className="intro-overlay" aria-hidden="true">
      {/* Bars absorb stray clicks during the intro (any press fast-forwards). */}
      <div className="intro-bar intro-bar--top pointer-events-auto" />
      <div className="intro-bar intro-bar--bottom pointer-events-auto" />
      <div className="intro-bar intro-bar--left pointer-events-auto" />
      <div className="intro-bar intro-bar--right pointer-events-auto" />

      <div className="intro-window">
        <div className="intro-veil" />
        <Viewfinder />
      </div>

      <div className="intro-caption">
        <div className="intro-mark relative" style={{ width: 'min(42vw, 196px)' }}>
          <Logo variant="full" showSubmark={false} size="100%" glyphClassName="logo-glyph" className="intro-mark-sharp block text-paper" />
          <Logo
            variant="full"
            showSubmark={false}
            size="100%"
            glyphClassName="logo-glyph"
            className="intro-mark-blur absolute inset-0 text-paper"
          />
        </div>
        <span ref={countRef} className="intro-count font-serif italic text-paper/80 text-xl tabular-nums leading-none">
          000
        </span>
      </div>
    </div>
  )
}

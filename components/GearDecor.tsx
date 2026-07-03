'use client'

import { useEffect, useRef } from 'react'
import { getIntensity, prefersReducedMotion } from '@/lib/motion'

/**
 * Pure-CSS 3D photographic gear, floating behind the content. No SVG, no images —
 * every form is built from transformed <div>s. Four props are anchored to the
 * viewport corners; each floats + spins continuously (CSS keyframes) and drifts
 * with the cursor and scroll (JS-driven parallax on the wrapper's transform).
 *
 * Hidden below ~820px and under prefers-reduced-motion (both via CSS in
 * globals.css — `.gear-stage`).
 */

interface GearDef {
  id: string
  className: string         // corner placement
  depth: number             // cursor-parallax factor
  scroll: number            // scroll-parallax factor (px per px scrolled)
}

const GEARS: GearDef[] = [
  { id: 'camera',  className: 'left-[4vw]  top-[18vh]',     depth: 26, scroll: -0.05 },
  { id: 'lens',    className: 'right-[5vw] top-[22vh]',     depth: 38, scroll: 0.07 },
  { id: 'reel',    className: 'left-[7vw]  bottom-[14vh]',  depth: 32, scroll: -0.09 },
  { id: 'clapper', className: 'right-[6vw] bottom-[16vh]',  depth: 22, scroll: 0.04 },
]

export default function GearDecor() {
  const stageRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const stage = stageRef.current
    if (!stage || prefersReducedMotion()) return
    if (!window.matchMedia('(min-width: 821px)').matches) return

    const gears = Array.from(stage.querySelectorAll<HTMLElement>('.gear'))
    let mx = 0, my = 0           // normalized cursor offset from centre (−0.5…0.5)
    let raf = 0

    const onMove = (e: MouseEvent) => {
      mx = e.clientX / window.innerWidth - 0.5
      my = e.clientY / window.innerHeight - 0.5
    }

    let lastMx = NaN, lastMy = NaN, lastScrollY = NaN, lastMul = NaN
    const tick = () => {
      const scrollY = window.scrollY || 0
      const mul = getIntensity()
      // Idle guard: with the pointer still and no scroll, skip the style writes
      // (the CSS float/spin keyframes keep animating on the compositor).
      if (mx === lastMx && my === lastMy && scrollY === lastScrollY && mul === lastMul) {
        raf = requestAnimationFrame(tick)
        return
      }
      lastMx = mx; lastMy = my; lastScrollY = scrollY; lastMul = mul
      for (const g of gears) {
        const depth = Number(g.dataset.depth) * mul
        const scroll = Number(g.dataset.scroll)
        // Parallax lives on the wrapper's transform; the float (translate) and
        // spin (rotate) keyframes run on inner elements, so nothing collides.
        g.style.transform = `translate3d(${(mx * depth).toFixed(1)}px, ${(my * depth + scrollY * scroll).toFixed(1)}px, 0)`
      }
      raf = requestAnimationFrame(tick)
    }
    window.addEventListener('mousemove', onMove, { passive: true })
    raf = requestAnimationFrame(tick)
    return () => {
      window.removeEventListener('mousemove', onMove)
      cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <div ref={stageRef} className="gear-stage" aria-hidden="true">
      {GEARS.map((g) => (
        <div key={g.id} className={`gear ${g.className}`} data-depth={g.depth} data-scroll={g.scroll}>
          <div className="gear-float" style={{ animation: `gear-float ${6 + g.depth / 10}s ease-in-out infinite` }}>
            {g.id === 'camera' && <CameraCube />}
            {g.id === 'lens' && <LensBarrel />}
            {g.id === 'reel' && <FilmReel />}
            {g.id === 'clapper' && <Clapperboard />}
          </div>
        </div>
      ))}
    </div>
  )
}

/* ── Camera body: a wireframe cube ───────────────────────────── */
function CameraCube() {
  const S = 86
  const faces = [
    `translateZ(${S / 2}px)`,
    `rotateY(180deg) translateZ(${S / 2}px)`,
    `rotateY(90deg) translateZ(${S / 2}px)`,
    `rotateY(-90deg) translateZ(${S / 2}px)`,
    `rotateX(90deg) translateZ(${S / 2}px)`,
    `rotateX(-90deg) translateZ(${S / 2}px)`,
  ]
  return (
    <div
      className="gear-spin relative"
      style={{ width: S, height: S, animation: 'gear-spin-y 22s linear infinite' }}
    >
      {faces.map((t, i) => (
        <div key={i} className="gear-face" style={{ width: S, height: S, transform: t }} />
      ))}
      {/* little lens nub on the front face */}
      <div className="gear-ring" style={{ width: S * 0.5, height: S * 0.5, transform: `translate(-50%, -50%) translateZ(${S / 2 + 10}px)` }} />
    </div>
  )
}

/* ── Lens barrel: concentric rings at staggered depths ───────── */
function LensBarrel() {
  const rings = [96, 80, 64, 48, 30]
  return (
    <div
      className="gear-spin relative"
      style={{ width: 96, height: 96, animation: 'gear-spin-z 18s linear infinite' }}
    >
      {rings.map((d, i) => (
        <div
          key={i}
          className="gear-ring"
          style={{ width: d, height: d, transform: `translate(-50%, -50%) translateZ(${-i * 14}px)` }}
        />
      ))}
    </div>
  )
}

/* ── Film reel: spoked disc ──────────────────────────────────── */
function FilmReel() {
  const spokes = [0, 45, 90, 135]
  return (
    <div
      className="gear-spin relative"
      style={{ width: 96, height: 96, animation: 'gear-spin-z 14s linear infinite' }}
    >
      <div className="gear-ring" style={{ width: 96, height: 96 }} />
      <div className="gear-ring" style={{ width: 26, height: 26 }} />
      {spokes.map((deg) => (
        <div
          key={deg}
          className="gear-spoke"
          style={{ width: 92, height: 2, transform: `translate(-50%, -50%) rotate(${deg}deg)` }}
        />
      ))}
    </div>
  )
}

/* ── Clapperboard: body + hinged top that claps ──────────────── */
function Clapperboard() {
  return (
    <div
      className="gear-spin relative"
      style={{ width: 104, height: 84, animation: 'gear-spin-y 26s linear infinite' }}
    >
      {/* board */}
      <div className="gear-face" style={{ width: 104, height: 64, top: 20, left: 0, position: 'absolute' }} />
      {/* hinged clapper bar */}
      <div
        style={{ position: 'absolute', top: 6, left: 0, width: 104, height: 14, transformOrigin: 'left center', animation: 'clapper-clap 4s ease-in-out infinite' }}
      >
        <div className="gear-face" style={{ width: 104, height: 14, position: 'absolute', inset: 0 }} />
        {/* diagonal stripes */}
        {[8, 32, 56, 80].map((x) => (
          <div key={x} className="gear-spoke" style={{ left: x, top: 7, width: 2, height: 18, transform: 'rotate(28deg)' }} />
        ))}
      </div>
    </div>
  )
}

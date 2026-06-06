'use client'

import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

const STRIP_COUNT = 28
const STRIP_FREQ  = 0.55   // sine cycles per strip-width unit
const MAX_AMP     = 80     // px of horizontal displacement at peak
const WAVE_SPEED  = 1.6    // oscillation speed (rad/s via GSAP time)
const BAR_H       = 68     // must match h-[68px] class on bar element

export default function ShredderTransition() {
  const canvasRef   = useRef<HTMLCanvasElement>(null)
  const barRef      = useRef<HTMLDivElement>(null)
  const progressRef = useRef(0)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const canvas = canvasRef.current
    const bar    = barRef.current
    if (!canvas || !bar) return

    const ctx = canvas.getContext('2d', { alpha: true })
    if (!ctx) return

    // Portrait image — same-origin, no canvas taint
    const img = new Image()
    img.src = '/images/hisham-portrait-v2.jpg'

    const resize = () => {
      canvas.width  = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    const render = (time: number) => {
      const p = progressRef.current
      const W = canvas.width
      const H = canvas.height

      ctx.clearRect(0, 0, W, H)

      if (p <= 0 || p >= 1 || !img.complete || !img.naturalWidth) {
        bar.style.display = 'none'
        return
      }

      // Bar slides from viewport-bottom (p=0) to above viewport (p=1)
      const barY   = (1 - p) * (H + BAR_H) - BAR_H
      const shredY = Math.max(0, barY + BAR_H)
      const shredH = H - shredY

      bar.style.display = 'flex'
      bar.style.top     = `${Math.max(-BAR_H, barY)}px`

      if (shredH < 2) return

      // Dark background fill for shredded zone
      ctx.fillStyle = '#0F0F10'
      ctx.fillRect(0, shredY, W, shredH)

      // Cover-map portrait into the shredded area
      const iW = img.naturalWidth
      const iH = img.naturalHeight
      const aR = W / shredH
      const iR = iW / iH
      let sx: number, sy: number, sw: number, sh: number

      if (iR < aR) {
        // portrait narrower — fill width, crop height from top
        sw = iW; sh = sw / aR; sx = 0; sy = 0
      } else {
        // portrait taller — fill height, crop width from center
        sh = iH; sw = sh * aR; sx = (iW - sw) / 2; sy = 0
      }

      // Amplitude: bell-curve envelope so effect surges then settles
      const amp    = Math.sin(p * Math.PI) * MAX_AMP
      const stripW = W / STRIP_COUNT

      for (let i = 0; i < STRIP_COUNT; i++) {
        const wave = amp * Math.sin(i * STRIP_FREQ + time * WAVE_SPEED)
        const dX   = i * stripW + wave
        const sSX  = sx + sw * (i / STRIP_COUNT)
        const sSW  = sw / STRIP_COUNT

        ctx.save()
        ctx.beginPath()
        ctx.rect(i * stripW, shredY, stripW, shredH)
        ctx.clip()
        ctx.drawImage(img, sSX, sy, sSW, sh, dX, shredY, stripW, shredH)
        ctx.restore()
      }
    }

    gsap.ticker.add(render)

    // About is a dynamic import — poll until it's in the DOM before creating the trigger
    let st: ReturnType<typeof ScrollTrigger.create> | null = null
    let rafHandle: number

    const initTrigger = () => {
      if (!document.getElementById('about')) {
        rafHandle = requestAnimationFrame(initTrigger)
        return
      }
      st = ScrollTrigger.create({
        trigger: '#about',
        start: 'top 100%',
        end: 'top 0%',
        scrub: true,
        onUpdate:    (self) => { progressRef.current = self.progress },
        onLeaveBack: ()     => { progressRef.current = 0 },
      })
    }
    initTrigger()

    return () => {
      cancelAnimationFrame(rafHandle)
      window.removeEventListener('resize', resize)
      gsap.ticker.remove(render)
      st?.kill()
    }
  }, [])

  return (
    <>
      {/* Canvas strip renderer — chromatic aberration via CSS drop-shadow on alpha edges */}
      <canvas
        ref={canvasRef}
        className="shredder-canvas fixed inset-0 pointer-events-none z-50"
        aria-hidden="true"
      />

      {/* Shredder machine bar — display/top set by render loop */}
      <div
        ref={barRef}
        className="shredder-bar fixed left-0 right-0 h-[68px] items-center justify-center pointer-events-none z-[51]"
        aria-hidden="true"
      >
        {/* Top edge highlight */}
        <div className="shredder-bar-highlight absolute inset-x-0 top-0 h-px" />

        {/* Left indicator group */}
        <div className="absolute left-6 flex items-center gap-2">
          <div className="shredder-tick w-px h-7" />
          <div className="shredder-tick-box w-2.5 h-2.5" />
          <div className="shredder-tick-mid w-px h-5" />
          <div className="shredder-tick-box w-2.5 h-2.5" />
          <div className="shredder-tick w-px h-7" />
        </div>

        {/* Center badge */}
        <div className="shredder-badge">
          <div className="shredder-badge-dot" />
          <span className="shredder-badge-label">H · H</span>
          <div className="shredder-badge-dot" />
        </div>

        {/* Right indicator group */}
        <div className="absolute right-6 flex items-center gap-2">
          <div className="shredder-tick w-px h-7" />
          <div className="shredder-tick-box w-2.5 h-2.5" />
          <div className="shredder-tick-mid w-px h-5" />
          <div className="shredder-tick-box w-2.5 h-2.5" />
          <div className="shredder-tick w-px h-7" />
        </div>
      </div>
    </>
  )
}

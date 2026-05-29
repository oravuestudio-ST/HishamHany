'use client'

import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'

export default function Cursor() {
  const dotRef  = useRef<HTMLDivElement>(null)
  const ringRef = useRef<HTMLDivElement>(null)
  const [label, setLabel] = useState('')

  useEffect(() => {
    const dot  = dotRef.current
    const ring = ringRef.current
    if (!dot || !ring) return

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

    // Event delegation — works for all elements including dynamically loaded ones
    const onOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement

      // Image / WebGL hover
      if (target.closest('img, [data-cursor-image], .webgl-image')) {
        gsap.to(ring, { scale: 4, opacity: 0.3, duration: 0.6, ease: 'expo.out' })
        return
      }

      const el = target.closest('button, .magnetic-btn, a, [data-cursor]')
      if (!el) return

      const data = (el as HTMLElement).getAttribute('data-cursor')
      if (data) setLabel(data)

      if (el.tagName === 'BUTTON' || (el as HTMLElement).classList.contains('magnetic-btn')) {
        gsap.to(ring, { scale: 3, borderColor: 'rgba(190,76,0,0.8)', duration: 0.4, ease: 'expo.out' })
        gsap.to(dot,  { backgroundColor: '#BE4C00', scale: 0.5, duration: 0.3 })
      } else {
        gsap.to(ring, { scale: 2.5, opacity: 0.5, duration: 0.4, ease: 'expo.out' })
        gsap.to(dot,  { scale: 0.4, duration: 0.3, ease: 'expo.out' })
      }
    }

    const onOut = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest('button, .magnetic-btn, a, [data-cursor], img, [data-cursor-image], .webgl-image')) return

      setLabel('')
      gsap.to(ring, { scale: 1, opacity: 1, borderColor: 'rgba(223,215,197,0.5)', duration: 0.4, ease: 'expo.out' })
      gsap.to(dot,  { backgroundColor: '#DFD7C5', scale: 1, duration: 0.3 })
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
  }, [])

  return (
    <>
      <div
        ref={dotRef}
        className="fixed top-0 left-0 w-1.5 h-1.5 bg-bone rounded-full pointer-events-none z-[9997] -translate-x-1/2 -translate-y-1/2 mix-blend-difference"
      />
      <div
        ref={ringRef}
        className="fixed top-0 left-0 w-8 h-8 border border-bone/50 rounded-full pointer-events-none z-[9996] -translate-x-1/2 -translate-y-1/2 flex items-center justify-center"
      >
        {label && (
          <span className="font-sans text-[0.45rem] tracking-[0.3em] uppercase text-bone whitespace-nowrap">
            {label}
          </span>
        )}
      </div>
    </>
  )
}

'use client'

import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'

export default function Cursor() {
  const dotRef = useRef<HTMLDivElement>(null)
  const ringRef = useRef<HTMLDivElement>(null)
  const [label, setLabel] = useState('')

  useEffect(() => {
    const dot = dotRef.current
    const ring = ringRef.current
    if (!dot || !ring) return

    let mouseX = 0, mouseY = 0
    let ringX = 0, ringY = 0
    let raf: number

    const onMove = (e: MouseEvent) => {
      mouseX = e.clientX
      mouseY = e.clientY

      gsap.to(dot, {
        x: mouseX,
        y: mouseY,
        duration: 0.08,
        ease: 'none',
      })
    }

    const animate = () => {
      ringX += (mouseX - ringX) * 0.08
      ringY += (mouseY - ringY) * 0.08

      gsap.set(ring, { x: ringX, y: ringY })

      raf = requestAnimationFrame(animate)
    }
    animate()

    const onEnterLink = (e: MouseEvent) => {
      const el = e.currentTarget as HTMLElement
      const data = el.getAttribute('data-cursor')
      if (data) setLabel(data)

      gsap.to(ring, { scale: 2.5, opacity: 0.5, duration: 0.4, ease: 'expo.out' })
      gsap.to(dot, { scale: 0.4, duration: 0.3, ease: 'expo.out' })
    }

    const onLeaveLink = () => {
      setLabel('')
      gsap.to(ring, { scale: 1, opacity: 1, duration: 0.4, ease: 'expo.out' })
      gsap.to(dot, { scale: 1, duration: 0.3, ease: 'expo.out' })
    }

    const onEnterImage = () => {
      gsap.to(ring, { scale: 4, opacity: 0.3, duration: 0.6, ease: 'expo.out' })
    }

    const onEnterBtn = () => {
      gsap.to(ring, {
        scale: 3,
        borderColor: 'rgba(190,76,0,0.8)',
        duration: 0.4,
        ease: 'expo.out',
      })
      gsap.to(dot, { backgroundColor: '#BE4C00', scale: 0.5, duration: 0.3 })
    }

    const onLeaveBtn = () => {
      gsap.to(ring, {
        scale: 1,
        borderColor: 'rgba(223,215,197,0.5)',
        duration: 0.4,
        ease: 'expo.out',
      })
      gsap.to(dot, { backgroundColor: '#DFD7C5', scale: 1, duration: 0.3 })
    }

    document.addEventListener('mousemove', onMove)

    document.querySelectorAll('a, [data-cursor]').forEach((el) => {
      el.addEventListener('mouseenter', onEnterLink as EventListener)
      el.addEventListener('mouseleave', onLeaveLink as EventListener)
    })

    document.querySelectorAll('img, [data-cursor-image]').forEach((el) => {
      el.addEventListener('mouseenter', onEnterImage as EventListener)
      el.addEventListener('mouseleave', onLeaveLink as EventListener)
    })

    document.querySelectorAll('button, .magnetic-btn').forEach((el) => {
      el.addEventListener('mouseenter', onEnterBtn as EventListener)
      el.addEventListener('mouseleave', onLeaveBtn as EventListener)
    })

    return () => {
      cancelAnimationFrame(raf)
      document.removeEventListener('mousemove', onMove)
    }
  }, [])

  return (
    <>
      {/* Dot */}
      <div
        ref={dotRef}
        className="fixed top-0 left-0 w-1.5 h-1.5 bg-bone rounded-full pointer-events-none z-[9997] -translate-x-1/2 -translate-y-1/2 mix-blend-difference"
      />
      {/* Ring */}
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

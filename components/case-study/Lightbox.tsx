'use client'

import { useCallback, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import Image from 'next/image'
import { lockScroll } from '@/lib/lenis'
import { prefersReducedMotion } from '@/lib/motion'
import { DUR, EASE_CSS } from '@/animations/tokens'

/** A frame to show. Case-study frames carry their size; colour-study URLs don't. */
export interface LightboxImage {
  src: string
  w?: number
  h?: number
}

interface LightboxProps {
  images: LightboxImage[]
  /** Index of the open image, or null when closed. */
  open: number | null
  title: string
  /** Optional set name (e.g. a colour study), shown in the label and counter. */
  label?: string
  onClose: () => void
  onNavigate: (index: number) => void
}

/**
 * The one fullscreen viewer for every gallery (case-study spreads and colour
 * studies): modal dialog semantics, Escape/arrow keys, a Tab loop that stays
 * inside, focus returned to the frame that opened it, and the page (Lenis
 * included) locked underneath.
 */
export default function Lightbox({ images, open, title, label, onClose, onNavigate }: LightboxProps) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  // horizontal: null until the drag picks an axis, then locked for the gesture.
  const touch = useRef<{ x: number; y: number; dx: number; horizontal: boolean | null } | null>(null)
  const isOpen = open !== null && Boolean(images[open])

  const go = useCallback(
    (dir: number) => {
      if (open === null) return
      onNavigate((open + dir + images.length) % images.length)
    },
    [open, images.length, onNavigate]
  )

  // Open/close lifecycle: remember who opened us, take focus, lock the page;
  // give focus back and unlock on the way out.
  useEffect(() => {
    if (!isOpen) return
    const opener = document.activeElement as HTMLElement | null
    closeRef.current?.focus()
    lockScroll(true)
    return () => {
      lockScroll(false)
      opener?.focus?.()
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      else if (e.key === 'ArrowRight') go(1)
      else if (e.key === 'ArrowLeft') go(-1)
      else if (e.key === 'Tab') {
        const controls = dialogRef.current?.querySelectorAll<HTMLElement>('button')
        if (!controls?.length) return
        const first = controls[0]
        const last = controls[controls.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [isOpen, onClose, go])

  /** Move the photo stage; `animate` eases there, otherwise it tracks the finger 1:1. */
  function slide(x: number, animate: boolean) {
    const el = stageRef.current
    if (!el) return
    el.style.transition = animate && !prefersReducedMotion() ? `transform ${DUR.micro}s ${EASE_CSS.touch}` : 'none'
    el.style.transform = x ? `translateX(${x}px)` : ''
  }

  if (!isOpen) return null
  const frame = images[open!]
  const position = `${open! + 1} / ${images.length}`
  const alt = `${title}${label ? ` — ${label}` : ''} — ${open! + 1} of ${images.length}`

  // Portaled to <body>: a transformed or stacked ancestor (the home scenes) would trap the fixed overlay under the header.
  return createPortal(
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label={`${title}${label ? ` — ${label}` : ''} gallery viewer`}
      className="fixed inset-0 z-modal bg-ink/95 flex items-center justify-center"
      onClick={onClose}
      onTouchStart={(e) => {
        const t = e.touches[0]
        touch.current = e.touches.length === 1 ? { x: t.clientX, y: t.clientY, dx: 0, horizontal: null } : null
        slide(0, false)
      }}
      onTouchMove={(e) => {
        const g = touch.current
        if (!g || e.touches.length !== 1) return
        const t = e.touches[0]
        const dx = t.clientX - g.x
        const dy = t.clientY - g.y
        if (g.horizontal === null && Math.max(Math.abs(dx), Math.abs(dy)) > 8) g.horizontal = Math.abs(dx) > Math.abs(dy)
        if (!g.horizontal) return
        g.dx = dx
        slide(dx, false)
      }}
      onTouchEnd={() => {
        const g = touch.current
        touch.current = null
        if (!g?.horizontal) return
        // Past 50px the frame leaves with the finger and the next one enters from the far side.
        if (Math.abs(g.dx) <= 50) return slide(0, true)
        const dir = g.dx < 0 ? 1 : -1
        const w = window.innerWidth
        if (prefersReducedMotion()) {
          go(dir)
          return slide(0, false)
        }
        slide(-dir * w, true)
        window.setTimeout(() => {
          go(dir)
          slide(dir * w, false)
          stageRef.current?.getBoundingClientRect() // commit the off-screen start before animating in
          slide(0, true)
        }, DUR.micro * 1000)
      }}
    >
      <div ref={stageRef} className="flex items-center justify-center will-change-transform">
        {frame.w && frame.h ? (
          <Image
            src={frame.src}
            alt={alt}
            width={frame.w}
            height={frame.h}
            sizes="92vw"
            quality={90}
            priority
            className="max-h-[88vh] max-w-[92vw] w-auto h-auto object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <div className="relative h-[88vh] w-[92vw]" onClick={(e) => e.stopPropagation()}>
            <Image src={frame.src} alt={alt} fill sizes="92vw" quality={90} priority className="object-contain" />
          </div>
        )}
      </div>

      {/* Warm the neighbours: same src/sizes/quality picks the same srcset file, so a swipe lands on a cached frame. */}
      <div hidden aria-hidden="true">
        {Array.from(new Set([open! + 1, open! - 1 + images.length].map((i) => i % images.length)))
          .filter((i) => i !== open)
          .map((i) => (
            <div key={images[i].src} className="relative h-px w-px">
              <Image src={images[i].src} alt="" fill sizes="92vw" quality={90} loading="eager" />
            </div>
          ))}
      </div>

      <button
        ref={closeRef}
        type="button"
        onClick={(e) => { e.stopPropagation(); onClose() }}
        aria-label="Close viewer"
        className="tap-target absolute top-6 right-6 text-paper/70 hover:text-paper font-sans text-[0.7rem] tracking-[0.3em] uppercase"
      >
        Close
      </button>

      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); go(-1) }}
        aria-label="Previous image"
        className="absolute left-4 md:left-8 text-paper/60 hover:text-paper text-3xl px-3 py-2"
      >
        ‹
      </button>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); go(1) }}
        aria-label="Next image"
        className="absolute right-4 md:right-8 text-paper/60 hover:text-paper text-3xl px-3 py-2"
      >
        ›
      </button>

      <span className="absolute bottom-6 left-1/2 -translate-x-1/2 font-sans text-[0.6rem] tracking-[0.25em] uppercase text-paper/50">
        {label ? `${label} · ${position}` : position}
      </span>
    </div>,
    document.body
  )
}

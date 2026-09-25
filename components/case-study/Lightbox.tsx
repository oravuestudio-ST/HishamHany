'use client'

import { useCallback, useEffect, useRef } from 'react'
import Image from 'next/image'
import { lockScroll } from '@/lib/lenis'

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

  if (!isOpen) return null
  const frame = images[open!]
  const position = `${open! + 1} / ${images.length}`
  const alt = `${title}${label ? ` — ${label}` : ''} — ${open! + 1} of ${images.length}`

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label={`${title}${label ? ` — ${label}` : ''} gallery viewer`}
      className="fixed inset-0 z-modal bg-ink/95 flex items-center justify-center"
      onClick={onClose}
    >
      {frame.w && frame.h ? (
        <Image
          src={frame.src}
          alt={alt}
          width={frame.w}
          height={frame.h}
          sizes="92vw"
          priority
          className="max-h-[88vh] max-w-[92vw] w-auto h-auto object-contain"
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <div className="relative h-[88vh] w-[92vw]" onClick={(e) => e.stopPropagation()}>
          <Image src={frame.src} alt={alt} fill sizes="92vw" priority className="object-contain" />
        </div>
      )}

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
    </div>
  )
}

'use client'

import { useCallback, useEffect } from 'react'
import Image from 'next/image'
import type { GalleryImage } from '@/lib/galleries'

interface LightboxProps {
  images: GalleryImage[]
  /** Index of the open image, or null when closed. */
  open: number | null
  title: string
  onClose: () => void
  onNavigate: (index: number) => void
}

/**
 * Fullscreen accessible viewer shared by the case-study spread and any other
 * gallery: modal dialog semantics, Escape/arrow keys, scroll lock, and a
 * position readout. Extracted from the original CaseStudyGallery.
 */
export default function Lightbox({ images, open, title, onClose, onNavigate }: LightboxProps) {
  const go = useCallback(
    (dir: number) => {
      if (open === null) return
      onNavigate((open + dir + images.length) % images.length)
    },
    [open, images.length, onNavigate]
  )

  useEffect(() => {
    if (open === null) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      else if (e.key === 'ArrowRight') go(1)
      else if (e.key === 'ArrowLeft') go(-1)
    }
    document.addEventListener('keydown', onKey)
    // Lock scroll while the lightbox is open.
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [open, onClose, go])

  if (open === null || !images[open]) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${title} gallery viewer`}
      className="fixed inset-0 z-[9998] bg-ink/95 backdrop-blur-sm flex items-center justify-center"
      onClick={onClose}
    >
      <Image
        src={images[open].src}
        alt={`${title} — ${open + 1} of ${images.length}`}
        width={images[open].w}
        height={images[open].h}
        sizes="92vw"
        priority
        className="max-h-[88vh] max-w-[92vw] w-auto h-auto object-contain"
        onClick={(e) => e.stopPropagation()}
      />

      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onClose() }}
        aria-label="Close viewer"
        className="absolute top-6 right-6 text-paper/70 hover:text-paper font-sans text-[0.7rem] tracking-[0.3em] uppercase"
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
        {open + 1} / {images.length}
      </span>
    </div>
  )
}

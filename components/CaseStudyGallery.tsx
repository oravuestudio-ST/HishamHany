'use client'

import { useCallback, useEffect, useState } from 'react'

interface Props {
  images: string[]
  title: string
}

export default function CaseStudyGallery({ images, title }: Props) {
  const [open, setOpen] = useState<number | null>(null)

  const close = useCallback(() => setOpen(null), [])
  const go = useCallback(
    (dir: number) => setOpen((i) => (i === null ? i : (i + dir + images.length) % images.length)),
    [images.length]
  )

  useEffect(() => {
    if (open === null) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
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
  }, [open, close, go])

  return (
    <>
      <ul className="grid grid-cols-2 lg:grid-cols-3 gap-3 list-none p-0 m-0">
        {images.map((src, i) => (
          <li key={src} className="overflow-hidden bg-silver/5">
            <button
              type="button"
              onClick={() => setOpen(i)}
              aria-label={`Open image ${i + 1} of ${images.length} — ${title}`}
              className="group block w-full"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt={`${title} — ${i + 1}`}
                loading="lazy"
                decoding="async"
                className="block w-full h-auto transition-transform duration-700 group-hover:scale-105"
              />
            </button>
          </li>
        ))}
      </ul>

      {open !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${title} gallery viewer`}
          className="fixed inset-0 z-[9998] bg-ebony/95 backdrop-blur-sm flex items-center justify-center"
          onClick={close}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={images[open]}
            alt={`${title} — ${open + 1} of ${images.length}`}
            className="max-h-[88vh] max-w-[92vw] object-contain"
            onClick={(e) => e.stopPropagation()}
          />

          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); close() }}
            aria-label="Close viewer"
            className="absolute top-6 right-6 text-bone/70 hover:text-bone font-sans text-[0.7rem] tracking-[0.3em] uppercase"
          >
            Close
          </button>

          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); go(-1) }}
            aria-label="Previous image"
            className="absolute left-4 md:left-8 text-bone/60 hover:text-bone text-3xl px-3 py-2"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); go(1) }}
            aria-label="Next image"
            className="absolute right-4 md:right-8 text-bone/60 hover:text-bone text-3xl px-3 py-2"
          >
            ›
          </button>

          <span className="absolute bottom-6 left-1/2 -translate-x-1/2 font-sans text-[0.6rem] tracking-[0.25em] uppercase text-silver/50">
            {open + 1} / {images.length}
          </span>
        </div>
      )}
    </>
  )
}

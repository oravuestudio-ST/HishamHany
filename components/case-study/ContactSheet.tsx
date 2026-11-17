'use client'

import { forwardRef } from 'react'
import Image from 'next/image'
import type { GalleryImage } from '@/lib/galleries'

const pad = (n: number) => String(n).padStart(2, '0')

/**
 * The case study as a contact sheet: every frame whole (never cropped) in a
 * 3:2 cell on an ink board, numbered like a strip of negatives. Each photo
 * box carries its own ratio and `data-frame`, so CaseSpread can glide the
 * frames that were on screen from the spread into their cells.
 */
const ContactSheet = forwardRef<HTMLDivElement, { images: GalleryImage[]; title: string; onOpen: (index: number) => void }>(
  function ContactSheet({ images, title, onOpen }, ref) {
    return (
      <div ref={ref} className="bg-ink text-paper px-6 md:px-12 pt-24 pb-16">
        <h2 className="eyebrow mb-10 text-paper/60">
          {title}: {images.length} frames
        </h2>
        <ol className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-x-3 gap-y-6 md:gap-x-6 md:gap-y-10">
          {images.map((img, i) => (
            <li key={img.src}>
              <button
                type="button"
                onClick={() => onOpen(i)}
                aria-label={`Open frame ${i + 1} of ${images.length} — ${title}`}
                className="sheet-cell relative flex aspect-[3/2] w-full items-center justify-center cursor-zoom-in"
                data-cursor="Expand"
              >
                <span
                  data-frame={i}
                  className={`relative block bg-cover bg-center ${img.w / img.h >= 1.5 ? 'w-full' : 'h-full'}`}
                  style={{ aspectRatio: `${img.w} / ${img.h}` }}
                >
                  <Image src={img.src} alt="" fill sizes="(min-width: 768px) 17vw, (min-width: 640px) 25vw, 33vw" loading="eager" className="object-cover" />
                </span>
                <span className="frame-marks sheet-marks" aria-hidden="true" />
              </button>
              <span className="sheet-num mt-2 block font-sans text-[0.6rem] tracking-[0.25em] text-paper/50" aria-hidden="true">
                {pad(i + 1)}
              </span>
            </li>
          ))}
        </ol>
      </div>
    )
  }
)

export default ContactSheet

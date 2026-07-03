'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { gsap } from 'gsap'
import type { GalleryImage } from '@/lib/galleries'
import { MOTION, gsapEase, prefersReducedMotion } from '@/lib/motion'
import { useProgressiveImage } from '@/hooks/useProgressiveImage'
import Lightbox from '@/components/case-study/Lightbox'

/**
 * The image-sequencing engine: walks the gallery in a repeating editorial
 * rhythm — full-bleed spread, two-up pairing, offset single — so a case study
 * reads like magazine pages rather than a grid. Layouts alternate sides to
 * keep the eye moving; every image keeps its native ratio via intrinsic
 * dimensions (no crops, no CLS).
 */

type Block =
  | { kind: 'full'; images: [GalleryImage] }
  | { kind: 'pair'; images: [GalleryImage, GalleryImage] }
  | { kind: 'offset'; images: [GalleryImage]; side: 'left' | 'right' }

/** Chunk the sequence into the repeating rhythm: full → pair → offset. */
function toBlocks(images: GalleryImage[]): Block[] {
  const blocks: Block[] = []
  let i = 0
  let step = 0
  let offsetSide: 'left' | 'right' = 'right'

  while (i < images.length) {
    const phase = step % 3
    if (phase === 0) {
      blocks.push({ kind: 'full', images: [images[i]] })
      i += 1
    } else if (phase === 1 && i + 1 < images.length) {
      blocks.push({ kind: 'pair', images: [images[i], images[i + 1]] })
      i += 2
    } else {
      blocks.push({ kind: 'offset', images: [images[i]], side: offsetSide })
      offsetSide = offsetSide === 'right' ? 'left' : 'right'
      i += 1
    }
    step += 1
  }
  return blocks
}

export default function CaseSpread({ images, title }: { images: GalleryImage[]; title: string }) {
  const rootRef = useRef<HTMLElement>(null)
  const [open, setOpen] = useState<number | null>(null)

  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    // Full-bleed frames animate via useProgressiveImage on their wrapper —
    // skip them here so the two treatments never stack.
    const items = Array.from(root.querySelectorAll('.spread-item')).filter(
      (item) => !item.closest('.progressive-frame')
    )

    if (prefersReducedMotion()) {
      gsap.set(items, { opacity: 1, y: 0, clearProps: 'transform' })
      return
    }

    const ctx = gsap.context(() => {
      items.forEach((item) => {
        gsap.fromTo(
          item,
          { opacity: 0, y: MOTION.revealDistance },
          {
            opacity: 1,
            y: 0,
            duration: MOTION.dur.reveal,
            ease: gsapEase(),
            scrollTrigger: { trigger: item, start: MOTION.scrollStart, once: true },
          }
        )
      })
    }, root)
    return () => ctx.revert()
  }, [images])

  if (images.length === 0) return null
  const blocks = toBlocks(images)
  let counter = 0

  const frame = (img: GalleryImage, sizes: string) => {
    counter += 1
    const index = images.indexOf(img)
    return (
      <figure className="spread-item relative overflow-hidden bg-fg/5">
        <button
          type="button"
          onClick={() => setOpen(index)}
          aria-label={`Open image ${index + 1} of ${images.length} — ${title}`}
          className="block w-full cursor-zoom-in"
          data-cursor="Expand"
        >
          <Image
            src={img.src}
            alt={`${title} — frame ${counter}`}
            width={img.w}
            height={img.h}
            sizes={sizes}
            className="block w-full h-auto"
          />
        </button>
      </figure>
    )
  }

  return (
    <section ref={rootRef} aria-label={`${title} — image sequence`}>
      <div className="space-y-6 md:space-y-16">
        {blocks.map((block, i) => {
          if (block.kind === 'full') {
            return (
              <ProgressiveFullBleed key={i}>
                {frame(block.images[0], '100vw')}
              </ProgressiveFullBleed>
            )
          }
          if (block.kind === 'pair') {
            return (
              <div key={i} className="px-6 md:px-12 grid md:grid-cols-2 gap-6 md:gap-16 items-start">
                {frame(block.images[0], '(max-width: 768px) 100vw, 50vw')}
                <div className="md:mt-24">{frame(block.images[1], '(max-width: 768px) 100vw, 50vw')}</div>
              </div>
            )
          }
          return (
            <div key={i} className="px-6 md:px-12 grid md:grid-cols-12">
              <div className={block.side === 'right' ? 'md:col-span-7 md:col-start-6' : 'md:col-span-7'}>
                {frame(block.images[0], '(max-width: 768px) 100vw, 60vw')}
              </div>
            </div>
          )
        })}
      </div>

      <Lightbox images={images} open={open} title={title} onClose={() => setOpen(null)} onNavigate={setOpen} />
    </section>
  )
}

/** Full-bleed frames uncrop and settle as the scroll carries them in. */
function ProgressiveFullBleed({ children }: { children: React.ReactNode }) {
  const ref = useProgressiveImage<HTMLDivElement>()
  return (
    <div ref={ref} className="progressive-frame px-0 will-change-transform">
      {children}
    </div>
  )
}

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

/** Per-side frame count for the pinned trio. The sides must clearly outrun the
 * center for the sticky "hold" to travel — 4 each against a ~70vh center. */
const TRIO_SIDE = 4
const TRIO_SIZE = TRIO_SIDE * 2 + 1 // 4 left + 1 center + 4 right = 9

type Block =
  | { kind: 'full'; images: [GalleryImage] }
  | { kind: 'pair'; images: [GalleryImage, GalleryImage] }
  | { kind: 'offset'; images: [GalleryImage]; side: 'left' | 'right' }
  | { kind: 'sticky-trio'; left: GalleryImage[]; center: GalleryImage; right: GalleryImage[] }

/**
 * Chunk the sequence into the repeating rhythm: full → pair → offset →
 * sticky-trio. The trio only fires when a full symmetric set of 9 remains, so
 * the sequence tail never yields lopsided columns; otherwise that phase falls
 * through to a full-bleed frame.
 */
function toBlocks(images: GalleryImage[]): Block[] {
  const blocks: Block[] = []
  let i = 0
  let step = 0
  let offsetSide: 'left' | 'right' = 'right'

  while (i < images.length) {
    const phase = step % 4
    const remaining = images.length - i
    if (phase === 3 && remaining >= TRIO_SIZE) {
      blocks.push({
        kind: 'sticky-trio',
        left: images.slice(i, i + TRIO_SIDE),
        center: images[i + TRIO_SIDE],
        right: images.slice(i + TRIO_SIDE + 1, i + TRIO_SIZE),
      })
      i += TRIO_SIZE
    } else if (phase === 1 && i + 1 < images.length) {
      blocks.push({ kind: 'pair', images: [images[i], images[i + 1]] })
      i += 2
    } else if (phase === 2) {
      blocks.push({ kind: 'offset', images: [images[i]], side: offsetSide })
      offsetSide = offsetSide === 'right' ? 'left' : 'right'
      i += 1
    } else {
      blocks.push({ kind: 'full', images: [images[i]] })
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
        // The pinned trio center reveals with opacity only: a `y` translate
        // would put a transform on a sticky-column child and fight the pin.
        const fadeOnly = item.classList.contains('spread-fade')
        gsap.fromTo(
          item,
          fadeOnly ? { opacity: 0 } : { opacity: 0, y: MOTION.revealDistance },
          {
            opacity: 1,
            ...(fadeOnly ? {} : { y: 0 }),
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

  // Framed cell for the sticky trio: a fixed-height mount (hairline border on a
  // faint board) whose photo crops-to-fill via object-cover, so the three
  // columns read full and punchy at every width — zero CLS, columns aligned.
  // `fade` marks the pinned center so the reveal animates opacity only (never a
  // transform).
  const matFrame = (
    img: GalleryImage,
    { keyId, heightClass, sizes, fade = false }: { keyId: string; heightClass: string; sizes: string; fade?: boolean }
  ) => {
    counter += 1
    const index = images.indexOf(img)
    return (
      <figure
        key={keyId}
        className={`spread-item${fade ? ' spread-fade' : ''} relative ${heightClass} overflow-hidden border border-fg/10 bg-fg/[0.04]`}
      >
        <button
          type="button"
          onClick={() => setOpen(index)}
          aria-label={`Open image ${index + 1} of ${images.length} — ${title}`}
          className="block h-full w-full cursor-zoom-in"
          data-cursor="Expand"
        >
          <Image
            src={img.src}
            alt={`${title} — frame ${counter}`}
            width={img.w}
            height={img.h}
            sizes={sizes}
            className="block h-full w-full object-cover"
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
          if (block.kind === 'sticky-trio') {
            // Side-frame heights scale with the breakpoint and stay taller than
            // the pinned centre at every size — that height gap is what gives
            // the pin its travel (a centre as tall as the sides never holds).
            const sideH = 'h-44 sm:h-52 md:h-[clamp(280px,30vw,360px)]'
            const sizes = '33vw'
            return (
              <div key={i} className="px-6 md:px-12">
                {/* Three columns at every breakpoint; the centre pins via CSS
                    `position: sticky` while the side stacks scroll past. `svh`
                    keeps the pinned centre inside the phone viewport and
                    `top-16` clears the fixed nav. Every image renders once, so
                    the shared frame counter stays honest. */}
                <div className="grid grid-cols-3 items-start gap-3 md:gap-6">
                  <div className="grid gap-3 md:gap-6">
                    {block.left.map((img, li) => matFrame(img, { keyId: `l${li}`, heightClass: sideH, sizes }))}
                  </div>
                  <div className="sticky top-16 md:top-24 h-[46svh] sm:h-[55svh] md:h-[70vh] self-start">
                    {matFrame(block.center, {
                      keyId: 'c',
                      heightClass: 'h-full',
                      sizes,
                      fade: true,
                    })}
                  </div>
                  <div className="grid gap-3 md:gap-6">
                    {block.right.map((img, ri) => matFrame(img, { keyId: `r${ri}`, heightClass: sideH, sizes }))}
                  </div>
                </div>
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

'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useReveal } from '@/hooks/useReveal'
import type { GalleryImage } from '@/lib/galleries'

/**
 * Homepage immersive gallery — the "sticky-scroll" concept, rebuilt in the
 * site's own language: real photography, design tokens, the global Lenis (no
 * nested ReactLenis), and next/image. The centre column pins via CSS
 * `position: sticky` while the two side columns scroll past it — the entire
 * effect is layout, so it rides the existing smooth scroll for free.
 *
 * Depends on `overflow-x: clip` (not `hidden`) on html/body so an ancestor
 * scroll container doesn't capture the sticky centre.
 */
export default function StickyGallery({ images }: { images: GalleryImage[] }) {
  // Need a full symmetric spread (5 left · 3 centre · 5 right); below that the
  // section simply doesn't render rather than showing a lopsided grid.
  const headerRef = useReveal<HTMLDivElement>('breathe')
  if (!images || images.length < 13) return null

  const center = images.slice(0, 3)
  const left = images.slice(3, 8)
  const right = images.slice(8, 13)

  const Frame = ({ img, heightClass }: { img: GalleryImage; heightClass: string }) => (
    <figure className={`relative ${heightClass} overflow-hidden border border-fg/10 bg-fg/[0.03]`}>
      <Image
        src={img.src}
        alt=""
        fill
        sizes="(max-width: 768px) 100vw, 33vw"
        className="object-cover"
        data-cursor="View"
      />
    </figure>
  )

  const sideH = 'h-[clamp(18rem,26vw,24rem)]'

  return (
    <section aria-label="Selected frames" className="bg-bg text-fg py-section-sm">
      <div ref={headerRef} className="px-gutter md:px-12 mb-8 md:mb-14 flex items-end justify-between gap-6">
        <div>
          <p className="text-label uppercase text-silver">Across the archive</p>
          <h2 className="font-serif text-display-sm tracking-tight mt-3 max-w-[16ch]">
            Frames held in place
          </h2>
        </div>
        <Link
          href="/portfolio"
          data-cursor="Open"
          className="hidden md:inline-block text-label uppercase text-silver hover:text-fg transition-colors whitespace-nowrap pb-2"
        >
          The full record →
        </Link>
      </div>

      <div className="px-gutter md:px-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-start">
          {/* Left — scrolls */}
          <div className="grid gap-3">
            {left.map((img, i) => (
              <Frame key={`l${i}`} img={img} heightClass={sideH} />
            ))}
          </div>

          {/* Centre — pinned on md+ (a screen-tall stack of three), a normal
              stack on mobile where a pin would have nothing to hold against. */}
          <div className="md:sticky md:top-24 md:h-[calc(100vh-8rem)] md:self-start">
            <div className="grid gap-3 md:h-full md:grid-rows-3">
              {center.map((img, i) => (
                <Frame key={`c${i}`} img={img} heightClass={`${sideH} md:h-full`} />
              ))}
            </div>
          </div>

          {/* Right — scrolls */}
          <div className="grid gap-3">
            {right.map((img, i) => (
              <Frame key={`r${i}`} img={img} heightClass={sideH} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

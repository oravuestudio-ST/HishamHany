'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { prefersReducedMotion } from '@/lib/motion'

interface ColorSet {
  label: string
  images: string[]
}

interface Props {
  colorSets: ColorSet[]
  title: string
}

interface TileProps {
  set: ColorSet
  title: string
  onOpen: (index: number) => void
}

/** Seconds each frame holds before dissolving to the next. */
const HOLD_MS = 3600

/**
 * One colour study. Frames dissolve into each other on a slow boomerang loop —
 * a contemplative slideshow, not a strobe (this replaced the old
 * GlitchColorGrid's 125ms flicker). Two stacked layers crossfade via opacity;
 * the loop pauses when the tab is hidden and never starts under reduced motion.
 */
function ColorTile({ set, title, onOpen }: TileProps) {
  // Only state needed for lightbox — animation is pure DOM via refs
  const [currentFrame, setCurrentFrame] = useState(0)

  const imgARef = useRef<HTMLImageElement>(null)
  const imgBRef = useRef<HTMLImageElement>(null)
  const cacheRef = useRef<HTMLImageElement[]>([])
  const layerRef = useRef<0 | 1>(0) // which layer is currently visible
  const frameRef = useRef(0)
  const dirRef = useRef<1 | -1>(1) // boomerang direction
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Preload every image upfront and hold strong references to prevent GC
  useEffect(() => {
    cacheRef.current = set.images.map((src) => {
      const img = new Image()
      img.src = src
      return img
    })
  }, [set.images])

  useEffect(() => {
    if (set.images.length < 2 || prefersReducedMotion()) return

    const advance = () => {
      let next = frameRef.current + dirRef.current
      if (next >= set.images.length) { dirRef.current = -1; next = set.images.length - 2 }
      else if (next < 0) { dirRef.current = 1; next = 1 }
      frameRef.current = next
      const nextSrc = set.images[frameRef.current]

      const front = layerRef.current === 0 ? imgARef.current : imgBRef.current
      const back  = layerRef.current === 0 ? imgBRef.current : imgARef.current
      if (!front || !back) return

      // Load the next frame into the hidden layer, then dissolve to it.
      back.src = nextSrc
      requestAnimationFrame(() => {
        back.style.opacity = '1'
        front.style.opacity = '0'
        layerRef.current = layerRef.current === 0 ? 1 : 0
        setCurrentFrame(frameRef.current)
      })
    }

    const start = () => { intervalRef.current = setInterval(advance, HOLD_MS) }
    const stop = () => { if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null } }
    const onVisibility = () => (document.hidden ? stop() : start())

    start()
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      stop()
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [set.images])

  return (
    <div className="flex flex-col gap-1.5 flex-1 min-w-0">
      <button
        type="button"
        onClick={() => onOpen(currentFrame)}
        aria-label={`Open ${set.label} color set — ${title}`}
        className="relative overflow-hidden bg-silver/5 aspect-[3/4] block w-full group"
      >
        <div className="absolute inset-0 transition-transform duration-700 group-hover:scale-[1.04]">
          {/* Layer A — starts visible */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={imgARef}
            src={set.images[0]}
            alt={`${title} — ${set.label}`}
            decoding="async"
            className="color-tile-layer"
            style={{ opacity: 1 }}
          />
          {/* Layer B — starts hidden */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={imgBRef}
            src={set.images[1] ?? set.images[0]}
            alt=""
            aria-hidden="true"
            decoding="async"
            className="color-tile-layer"
            style={{ opacity: 0 }}
          />
        </div>
      </button>
      <span className="font-sans text-[0.55rem] tracking-[0.3em] uppercase text-silver/40 text-center">
        {set.label}
      </span>
    </div>
  )
}

export default function ColorStudyGrid({ colorSets, title }: Props) {
  const [lightbox, setLightbox] = useState<{ si: number; fi: number } | null>(null)

  const close = useCallback(() => setLightbox(null), [])

  const go = useCallback(
    (dir: number) => {
      setLightbox((lb) => {
        if (!lb) return lb
        const imgs = colorSets[lb.si].images
        return { si: lb.si, fi: (lb.fi + dir + imgs.length) % imgs.length }
      })
    },
    [colorSets]
  )

  useEffect(() => {
    if (!lightbox) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
      else if (e.key === 'ArrowRight') go(1)
      else if (e.key === 'ArrowLeft') go(-1)
    }
    document.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [lightbox, close, go])

  const activeSet = lightbox !== null ? colorSets[lightbox.si] : null

  return (
    <>
      <div className="grid grid-cols-2 gap-3 md:flex md:flex-row md:gap-2 w-full">
        {colorSets.map((set, si) => (
          <ColorTile
            key={set.label}
            set={set}
            title={title}
            onOpen={(fi) => setLightbox({ si, fi })}
          />
        ))}
      </div>

      {lightbox !== null && activeSet && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${title} — ${activeSet.label} gallery viewer`}
          className="fixed inset-0 z-[9998] bg-ebony/95 backdrop-blur-sm flex items-center justify-center"
          onClick={close}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={activeSet.images[lightbox.fi]}
            alt={`${title} — ${activeSet.label} ${lightbox.fi + 1} of ${activeSet.images.length}`}
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
            {activeSet.label} · {lightbox.fi + 1} / {activeSet.images.length}
          </span>
        </div>
      )}
    </>
  )
}

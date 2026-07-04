'use client'

import { useEffect, useRef } from 'react'

export interface IndexItem { title: string; meta: string; img: string; href?: string }

/** Editorial list where hovering a row floats a cursor-trailing thumbnail and
 *  shifts the title to the accent. Desktop-only; degrades to a plain list on
 *  coarse pointers. */
export default function HoverIndexList({ items }: { items: IndexItem[] }) {
  const areaRef = useRef<HTMLDivElement>(null)
  const posRef = useRef<HTMLDivElement>(null)
  const boxRef = useRef<HTMLDivElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)

  useEffect(() => {
    const area = areaRef.current, pos = posRef.current
    if (!area || !pos) return
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return
    let tx = 0, ty = 0, cx = 0, cy = 0, raf = 0
    const loop = () => {
      cx += (tx - cx) * 0.16; cy += (ty - cy) * 0.16
      // Compositor-only move (the old left/top writes forced layout per frame).
      // Skip the write once settled to within a fraction of a pixel.
      if (Math.abs(tx - cx) > 0.05 || Math.abs(ty - cy) > 0.05) {
        pos.style.transform = `translate3d(${cx}px, ${cy}px, 0)`
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    const onMove = (e: MouseEvent) => { const r = area.getBoundingClientRect(); tx = e.clientX - r.left; ty = e.clientY - r.top }
    area.addEventListener('mousemove', onMove)
    return () => { cancelAnimationFrame(raf); area.removeEventListener('mousemove', onMove) }
  }, [])

  const show = (src: string) => {
    const box = boxRef.current, img = imgRef.current
    if (!box || !img) return
    img.src = src; box.style.opacity = '1'; box.style.transform = 'translate(-50%, -50%) scale(1)'
  }
  const hide = () => { const box = boxRef.current; if (box) { box.style.opacity = '0'; box.style.transform = 'translate(-50%, -50%) scale(0.85)' } }

  return (
    <div ref={areaRef} className="relative">
      {items.map((it, i) => {
        const Row: React.ElementType = it.href ? 'a' : 'div'
        return (
          <Row key={i} href={it.href} onMouseEnter={() => show(it.img)} onMouseLeave={hide}
            className="group flex items-baseline justify-between gap-6 border-t border-fg/15 py-6 no-underline last:border-b">
            <span className="font-sans text-[0.6rem] tracking-[0.1em] text-muted">{String(i + 1).padStart(2, '0')}</span>
            <span className="flex-1 font-serif uppercase leading-none tracking-[-0.03em] text-[clamp(1.6rem,5vw,3.4rem)] text-fg transition-[transform,color] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-7 group-hover:text-accent">{it.title}</span>
            <span className="font-sans text-[0.56rem] uppercase tracking-[0.18em] text-muted text-right">{it.meta}</span>
          </Row>
        )
      })}
      {/* Outer layer owns the cursor-follow (per-frame translate3d, no
          transition); inner box owns the scale/opacity in-out transition —
          split so the per-frame writes never fight the CSS transition. */}
      <div ref={posRef} aria-hidden="true"
        className="pointer-events-none absolute left-0 top-0 z-[60] will-change-transform">
        <div ref={boxRef}
          className="w-[clamp(150px,16vw,260px)] overflow-hidden opacity-0 shadow-[0_30px_60px_-20px_rgba(0,0,0,0.45)]"
          style={{ aspectRatio: '4 / 5', transform: 'translate(-50%, -50%) scale(0.85)', transition: 'opacity 0.35s ease, transform 0.5s cubic-bezier(0.16,1,0.3,1)' }}>
          {/* No src until hover — an empty src="" resolves to the page URL,
              firing a redundant request and a broken-image state. show() sets
              img.src on mouseenter. */}
          <img ref={imgRef} alt="" className="h-full w-full object-cover" />
        </div>
      </div>
    </div>
  )
}

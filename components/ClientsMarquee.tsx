'use client'

import { MOTION } from '@/lib/motion'

const logos = [
  { src: '/images/logos/binghatti.svg',      alt: 'Binghatti',         h: 160, themed: true },
  { src: '/images/logos/koptan.svg',         alt: 'El Koptan Cars',    h: 92,  themed: true },
  { src: '/images/logos/cairo-opera-house.png', alt: 'Cairo Opera House', h: 60,  themed: true },
  { src: '/images/logos/elaam.png',          alt: "E'laam",            h: 48,  themed: true },
  { src: '/images/logos/glitch-goods.svg',   alt: 'Glitch Goods',      h: 110, themed: true },
  { src: '/images/logos/glide.svg',          alt: 'Glide',             h: 110, noFilter: true },
  { src: '/images/logos/rose-al-yusuf.svg',  alt: 'Rose Al-Yusuf',     h: 160, noFilter: true },
]

export default function ClientsMarquee() {
  const track = [...logos, ...logos]

  return (
    <section
      style={{
        overflow: 'hidden',
        padding: '4px 0',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      <div
        className="clients-marquee-track"
        style={{
          display: 'flex',
          width: 'max-content',
          animation: `marquee-scroll ${MOTION.ambient.logoMarquee}s linear infinite`,
          willChange: 'transform',
        }}
      >
        {track.map((logo, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '0 40px',
              flexShrink: 0,
            }}
          >
            <img
              src={logo.src}
              alt={logo.alt}
              className={logo.themed ? 'client-logo' : undefined}
              style={{
                height: `${logo.h}px`,
                width: 'auto',
                display: 'block',
                // .client-logo (globals.css) already swaps black/white with
                // [data-theme] — only the non-themed legacy entries still
                // need the hardcoded always-white filter.
                filter: logo.themed ? undefined : logo.noFilter ? 'none' : 'brightness(0) invert(1)',
              }}
            />
          </div>
        ))}
      </div>

      <style>{`
        @keyframes marquee-scroll {
          0%   { transform: translate3d(0, 0, 0); }
          100% { transform: translate3d(-50%, 0, 0); }
        }
        @media (prefers-reduced-motion: reduce) {
          .clients-marquee-track { animation: none !important; }
        }
      `}</style>
    </section>
  )
}

'use client'

const logos = [
  { src: '/images/logos/binghatti-white.svg',   alt: 'Binghatti',         h: 32 },
  { src: '/images/logos/koptan.svg',             alt: 'El Koptan Cars',    h: 32 },
  { src: '/images/logos/cairo-opera-house.png',  alt: 'Cairo Opera House', h: 34 },
  { src: '/images/logos/elaam.png',              alt: "E'laam",            h: 28 },
  { src: '/images/logos/glitch-goods.svg',       alt: 'Glitch Goods',      h: 24 },
]

export default function ClientsMarquee() {
  const track = [...logos, ...logos]

  return (
    <section
      style={{
        overflow: 'hidden',
        padding: '40px 0',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      <div
        style={{
          display: 'flex',
          width: 'max-content',
          animation: 'marquee-scroll 28s linear infinite',
        }}
      >
        {track.map((logo, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '0 52px',
              flexShrink: 0,
            }}
          >
            <img
              src={logo.src}
              alt={logo.alt}
              height={logo.h}
              style={{
                filter: 'brightness(0) invert(1)',
                opacity: 1,
                display: 'block',
              }}
            />
          </div>
        ))}
      </div>

      <style>{`
        @keyframes marquee-scroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </section>
  )
}

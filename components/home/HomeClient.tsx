'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { MotionProvider } from '@/components/MotionProvider'
import Footer from '@/components/Footer'
import { projects } from '@/lib/projects'
import { SITE } from '@/lib/site'
import type { GalleryImage } from '@/lib/galleries'

// The hero server-renders: its priority next/image is the LCP element, and
// the request must start with the HTML — the loader overlays it, never
// delays it. Everything else animation-heavy skips SSR.
import Hero from '@/components/Hero'
// The loader server-renders too: its ink curtain must be in the very first
// paint, otherwise the SEO fallback text flashes for the few hundred ms it
// takes the lazy chunk to arrive. GSAP is already in this bundle via Hero, so
// eager-importing the curtain costs almost nothing.
import Loader from '@/components/Loader'

const SmoothScroll   = dynamic(() => import('@/components/SmoothScroll'),   { ssr: false })
const Cursor         = dynamic(() => import('@/components/Cursor'),          { ssr: false })
const Navigation     = dynamic(() => import('@/components/Navigation'),      { ssr: false })
const FeaturedWork   = dynamic(() => import('@/components/CaseStudyFeed'),   { ssr: false })
const Statement      = dynamic(() => import('@/components/Statement'),       { ssr: false })
const AboutTeaser    = dynamic(() => import('@/components/home/AboutTeaser'),    { ssr: false })
const ServicesTeaser = dynamic(() => import('@/components/home/ServicesTeaser'), { ssr: false })
const ContactCta     = dynamic(() => import('@/components/home/ContactCta'),     { ssr: false })
const TestimonialsDB = dynamic(() => import('@/components/TestimonialsDB'),  { ssr: false })
const ClientsMarquee = dynamic(() => import('@/components/ClientsMarquee'),  { ssr: false })
const ScrollProgress = dynamic(() => import('@/components/ScrollProgress'),  { ssr: false })
const StickyGallery  = dynamic(() => import('@/components/home/StickyGallery'), { ssr: false })

/**
 * The home experience: cinematic loader, then a curated narrative —
 * hero → clients → featured work → statement → about → services →
 * testimonials → commission invitation. Full portfolio, services detail,
 * story, and contact each live on their own routes.
 */
export default function HomeClient({ lookbook = [] }: { lookbook?: GalleryImage[] }) {
  const [loaded, setLoaded] = useState(false)

  return (
    <>
      {/* Custom cursor — always visible */}
      <Cursor />

      {/* Cinematic loader */}
      {!loaded && <Loader onComplete={() => setLoaded(true)} />}

      {/* Server-rendered intro — in the initial HTML, so it paints before any
          JavaScript arrives (no more blank first screen) and gives search
          engines real indexable content: name, role, case studies, contact.
          It sits beneath the loader curtain and unmounts once the animated
          site takes over. */}
      {!loaded && (
        <div className="fixed inset-0 z-[100] overflow-y-auto px-8 py-[14vh] md:px-16">
          <div className="max-w-2xl mx-auto">
            {/* Not a heading: the server-rendered Hero owns the page's single
                <h1>; this intro is pre-hydration/crawler content only. */}
            <p className="font-serif text-4xl md:text-5xl uppercase tracking-tight text-bone">
              Hisham Hany
            </p>
            <p className="font-sans text-[0.7rem] tracking-[0.2em] uppercase text-silver mt-3">
              Commercial, Automotive &amp; Fashion Photographer — Cairo, Egypt
            </p>
            <p className="font-sans text-sm leading-relaxed text-silver mt-6">
              {SITE.description} Available for fashion campaigns, automotive
              shoots, commercial briefs, and editorial commissions.
            </p>
            <p className="font-sans text-[0.7rem] tracking-[0.2em] uppercase text-silver mt-10 mb-4">
              Selected Work
            </p>
            <ul className="space-y-2">
              {projects.map((p) => (
                <li key={p.slug}>
                  <Link href={`/work/${p.slug}`} className="font-serif text-lg text-bone hover:text-silver transition-colors">
                    {p.title}{p.subtitle ? ` — ${p.subtitle}` : ''}
                  </Link>
                  <span className="font-sans text-[0.65rem] text-silver ml-3">
                    {p.category} · {p.client} · {p.year}
                  </span>
                </li>
              ))}
            </ul>
            <p className="font-sans text-sm text-silver mt-10">
              <a href={`mailto:${SITE.email}`} className="underline">{SITE.email}</a>
              {' · '}
              <a href={SITE.social.whatsapp} className="underline">WhatsApp</a>
              {' · '}
              <a href={SITE.social.instagram} className="underline">Instagram</a>
            </p>
          </div>
        </div>
      )}

      {/* Main site — revealed after loader. `entered` gates the hero/nav intro
          so the page-load sequence plays on screen rather than behind the loader. */}
      <div style={{ opacity: loaded ? 1 : 0, transition: 'opacity 0.6s ease' }}>
        <MotionProvider entered={loaded}>
          {/* Top scroll-progress bar + NN/100 readout */}
          <ScrollProgress />
          <SmoothScroll>
            <Navigation />
            <main id="main" tabIndex={-1}>
              {/* Stacked seams: hero < marquee < gallery. The incoming blocks
                  are opaque (theme bg) and z-raised so the receding card
                  disappears beneath a clean edge — but never transformed:
                  StickyGallery's internal position: sticky dies inside a
                  transformed ancestor. */}
              <div id="hero-section" className="relative z-0">
                <Hero />
              </div>
              <div className="relative z-10" style={{ background: 'var(--bg)' }}>
                <ClientsMarquee />
              </div>
              <div className="relative z-20" style={{ background: 'var(--bg)' }}>
                <StickyGallery images={lookbook} />
              </div>
              <div id="portfolio-section">
                <FeaturedWork featuredOnly />
              </div>
              <Statement />
              <AboutTeaser />
              <ServicesTeaser />
              <TestimonialsDB />
              <ContactCta />
            </main>
            <Footer />
          </SmoothScroll>
        </MotionProvider>
      </div>
    </>
  )
}

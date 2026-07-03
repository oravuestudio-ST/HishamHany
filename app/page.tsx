'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { MotionProvider } from '@/components/MotionProvider'
import { projects } from '@/lib/projects'
import { SITE } from '@/lib/site'

// Dynamic imports — all animation-heavy components skip SSR
const SmoothScroll   = dynamic(() => import('@/components/SmoothScroll'),   { ssr: false })
const Cursor         = dynamic(() => import('@/components/Cursor'),          { ssr: false })
const Loader         = dynamic(() => import('@/components/Loader'),          { ssr: false })
const Navigation     = dynamic(() => import('@/components/Navigation'),      { ssr: false })
const Hero           = dynamic(() => import('@/components/Hero'),            { ssr: false })
const Portfolio      = dynamic(() => import('@/components/CaseStudyFeed'),   { ssr: false })
const About          = dynamic(() => import('@/components/About'),           { ssr: false })
const Services       = dynamic(() => import('@/components/Services'),        { ssr: false })
const Statement      = dynamic(() => import('@/components/Statement'),       { ssr: false })
const IndexSection   = dynamic(() => import('@/components/IndexSection'),     { ssr: false })
const TestimonialsDB = dynamic(() => import('@/components/TestimonialsDB'),  { ssr: false })
const Contact        = dynamic(() => import('@/components/Contact'),         { ssr: false })
const ClientsMarquee = dynamic(() => import('@/components/ClientsMarquee'),  { ssr: false })
const ScrollProgress = dynamic(() => import('@/components/ScrollProgress'),  { ssr: false })
const GearDecor      = dynamic(() => import('@/components/GearDecor'),       { ssr: false })

export default function Home() {
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
            <h1 className="font-serif text-4xl md:text-5xl uppercase tracking-tight text-bone">
              Hisham Hany
            </h1>
            <p className="font-sans text-[0.7rem] tracking-[0.2em] uppercase text-silver/70 mt-3">
              Commercial, Automotive &amp; Fashion Photographer — Cairo, Egypt
            </p>
            <p className="font-sans text-sm leading-relaxed text-silver/80 mt-6">
              {SITE.description} Available for fashion campaigns, automotive
              shoots, commercial briefs, and editorial commissions.
            </p>
            <h2 className="font-sans text-[0.7rem] tracking-[0.2em] uppercase text-silver/60 mt-10 mb-4">
              Selected Work
            </h2>
            <ul className="space-y-2">
              {projects.map((p) => (
                <li key={p.slug}>
                  <Link href={`/work/${p.slug}`} className="font-serif text-lg text-bone hover:text-silver transition-colors">
                    {p.title}{p.subtitle ? ` — ${p.subtitle}` : ''}
                  </Link>
                  <span className="font-sans text-[0.65rem] text-silver/60 ml-3">
                    {p.category} · {p.client} · {p.year}
                  </span>
                </li>
              ))}
            </ul>
            <p className="font-sans text-sm text-silver/80 mt-10">
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
          {/* Pure-CSS 3D photographic gear drifting behind the editorial content */}
          <GearDecor />
          <SmoothScroll>
            <Navigation />
            <main>
              <div id="hero-section">
                <Hero />
              </div>
              <ClientsMarquee />
              <div id="portfolio-section">
                <Portfolio />
              </div>
              <Statement />
              <About />
              <Services />
              <IndexSection />
              <TestimonialsDB />
              <Contact />
            </main>
          </SmoothScroll>
        </MotionProvider>
      </div>
    </>
  )
}

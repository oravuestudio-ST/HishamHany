'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { MotionProvider } from '@/components/MotionProvider'

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

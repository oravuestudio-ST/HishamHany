'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'

// Dynamic imports — all animation-heavy components skip SSR
const SmoothScroll   = dynamic(() => import('@/components/SmoothScroll'),   { ssr: false })
const Cursor         = dynamic(() => import('@/components/Cursor'),          { ssr: false })
const Loader         = dynamic(() => import('@/components/Loader'),          { ssr: false })
const Navigation     = dynamic(() => import('@/components/Navigation'),      { ssr: false })
const Hero           = dynamic(() => import('@/components/Hero'),            { ssr: false })
const Portfolio      = dynamic(() => import('@/components/Portfolio'),       { ssr: false })
const About          = dynamic(() => import('@/components/About'),           { ssr: false })
const Services       = dynamic(() => import('@/components/Services'),        { ssr: false })
const TestimonialsDB = dynamic(() => import('@/components/TestimonialsDB'),  { ssr: false })
const Contact        = dynamic(() => import('@/components/Contact'),         { ssr: false })
const ClientsMarquee = dynamic(() => import('@/components/ClientsMarquee'),  { ssr: false })

export default function Home() {
  const [loaded, setLoaded] = useState(false)

  return (
    <>
      {/* Preload the 20MB hero spotlight GLB in the initial HTML so the
          fetch starts during the Loader screen instead of after Hero mounts.
          Hero itself is dynamic+ssr:false, so a <link> inside it wouldn't
          ship until after hydration. page.tsx is 'use client' but still
          SSRs, so this tag lands in the first byte. */}
      <link rel="preload" href="/models/spotlight.glb" as="fetch" crossOrigin="anonymous" />

      {/* Custom cursor — always visible */}
      <Cursor />

      {/* Cinematic loader */}
      {!loaded && <Loader onComplete={() => setLoaded(true)} />}

      {/* Main site — revealed after loader */}
      <div style={{ opacity: loaded ? 1 : 0, transition: 'opacity 0.6s ease' }}>
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
            <About />
            <Services />
            <TestimonialsDB />
            <Contact />
          </main>
        </SmoothScroll>
      </div>
    </>
  )
}

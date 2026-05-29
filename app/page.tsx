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
const Testimonials   = dynamic(() => import('@/components/Testimonials'),    { ssr: false })
const Contact        = dynamic(() => import('@/components/Contact'),         { ssr: false })

export default function Home() {
  const [loaded, setLoaded] = useState(false)

  return (
    <>
      {/* Custom cursor — always visible */}
      <Cursor />

      {/* Cinematic loader */}
      {!loaded && <Loader onComplete={() => setLoaded(true)} />}

      {/* Main site — revealed after loader */}
      <div style={{ opacity: loaded ? 1 : 0, transition: 'opacity 0.6s ease' }}>
        <SmoothScroll>
          <Navigation />
          <main>
            <Hero />
            <Portfolio />
            <About />
            <Services />
            <Testimonials />
            <Contact />
          </main>
        </SmoothScroll>
      </div>
    </>
  )
}

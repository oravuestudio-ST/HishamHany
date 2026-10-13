'use client'

import { useCallback, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { MotionProvider, type IntroPhase } from '@/components/MotionProvider'
import type { Chapter as ProgressChapter } from '@/components/ScrollProgress'
import type { ChapterData } from '@/lib/chapters'
import Footer from '@/components/Footer'
import Navigation from '@/components/Navigation'
import Loader from '@/components/Loader'
import Hero from '@/components/Hero'
import ChapterJourney from '@/components/home/ChapterJourney'
import ClientsMarquee from '@/components/ClientsMarquee'
import Statement from '@/components/Statement'
import AboutTeaser from '@/components/home/AboutTeaser'
import ServicesTeaser from '@/components/home/ServicesTeaser'
import ContactCta from '@/components/home/ContactCta'

// Side-effect chrome and the one client-fetched section skip SSR. Everything
// a reader (or a crawler, or a visitor without JS) needs is server-rendered:
// hero, chapters, index, statement, about, services, commission, footer.
const SmoothScroll   = dynamic(() => import('@/components/SmoothScroll'),   { ssr: false })
const Cursor         = dynamic(() => import('@/components/Cursor'),          { ssr: false })
const ScrollProgress = dynamic(() => import('@/components/ScrollProgress'),  { ssr: false })
const TestimonialsDB = dynamic(() => import('@/components/TestimonialsDB'),  { ssr: false })

// Section labels for the progress readout; while a chapter holds the stage the
// readout shows its number instead (ScrollProgress listens for CHAPTER_EVENT).
const SECTIONS: ProgressChapter[] = [
  { id: 'index', label: 'Index' },
  { id: 'statement-section', label: 'Statement' },
  { id: 'about-section', label: 'About' },
  { id: 'services-section', label: 'Services' },
  { id: 'voices-section', label: 'Voices' },
  { id: 'contact-section', label: 'Commission' },
]

/**
 * The home exhibition: the intro opens onto the hero, six full-screen chapters
 * follow, then the index (server-rendered, passed in as children), the client
 * strip and the Statement — one continuous ink stage — before the page returns
 * to the visitor's theme for About, Services, Voices and the commission.
 */
export default function HomeClient({
  chapters,
  children,
}: {
  chapters: ChapterData[]
  children?: React.ReactNode
}) {
  const [phase, setPhase] = useState<IntroPhase>('loading')
  const heroRef = useRef<HTMLElement>(null)
  // Stable callbacks: the Loader's effect depends on them, and a new function
  // identity would restart the intro on every render.
  const onOpening = useCallback(() => setPhase((p) => (p === 'loading' ? 'opening' : p)), [])
  const onEntered = useCallback(() => setPhase('entered'), [])
  const entered = phase === 'entered'

  return (
    <MotionProvider phase={phase}>
      <Loader onOpening={onOpening} onEntered={onEntered} />
      {/* Mounted only after the intro, so no second counter sits under it. */}
      {entered && <ScrollProgress chapters={SECTIONS} />}
      {entered && <Cursor />}
      {/* Lenis attaches to the document, so SmoothScroll is a sibling, not a
          wrapper: an ssr:false wrapper would pull <main> out of the server HTML. */}
      <SmoothScroll />
      <Navigation />
      <main id="main" tabIndex={-1}>
        <Hero stageRef={heroRef} />
        <ChapterJourney chapters={chapters} heroRef={heroRef} />
        {/* Arrives over the last chapter the way each chapter arrives over the
            one before (globals.css .after-chapters). */}
        <div className="after-chapters stage-scope">
          {children}
          <div className="relative z-10">
            <ClientsMarquee />
          </div>
          {/* The marquee recedes as the Statement slides over it (useStackedSeam
              finds this wrapper as the marquee wrapper's next sibling). */}
          <div id="statement-section" className="relative z-20">
            <Statement />
          </div>
        </div>
        <div id="about-section">
          <AboutTeaser />
        </div>
        <div id="services-section">
          <ServicesTeaser />
        </div>
        <div id="voices-section">
          <TestimonialsDB />
        </div>
        <div id="contact-section">
          <ContactCta />
        </div>
      </main>
      <Footer />
    </MotionProvider>
  )
}

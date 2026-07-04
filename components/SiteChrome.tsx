'use client'

import { usePathname } from 'next/navigation'
import dynamic from 'next/dynamic'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
import RouteWipe from '@/components/RouteWipe'
import { MotionProvider } from '@/components/MotionProvider'

// Animation-heavy chrome skips SSR; Navigation renders on the server so the
// header (and its links) are in the initial HTML of every page.
const SmoothScroll   = dynamic(() => import('@/components/SmoothScroll'),   { ssr: false })
const Cursor         = dynamic(() => import('@/components/Cursor'),          { ssr: false })
const ScrollProgress = dynamic(() => import('@/components/ScrollProgress'),  { ssr: false })

/**
 * Shared chrome for every public route except home. Home orchestrates its own
 * chrome inside HomeClient because the cinematic loader gates the entrance
 * sequence (nav and hero reveal only after the loader lifts). Everywhere else
 * the site is "entered" immediately.
 */
export default function SiteChrome({ children }: { children: React.ReactNode }) {
  const isHome = usePathname() === '/'

  // The wipe's exit interceptor lives on every route — leaving home needs the
  // cover sweep just as much as leaving an interior page.
  if (isHome) return <><RouteWipe />{children}</>

  return (
    <MotionProvider entered>
      {/* Side-effect chrome — none of these may wrap `children`, or the page
          content would drop out of the server-rendered HTML (ssr: false). */}
      <RouteWipe />
      <Cursor />
      <ScrollProgress />
      <SmoothScroll />
      <Navigation />
      {children}
      <Footer />
    </MotionProvider>
  )
}

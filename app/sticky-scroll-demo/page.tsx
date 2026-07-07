import type { Metadata } from 'next'
import { DemoOne } from '@/components/ui/sticky-scroll-demo'

export const metadata: Metadata = {
  title: 'Sticky Scroll — Demo',
  robots: { index: false, follow: false },
}

/**
 * Standalone preview for the verbatim `components/ui/sticky-scroll` component.
 * Lives OUTSIDE the (site) route group on purpose: the component ships its own
 * `<ReactLenis root>`, and the (site) layout already runs a global Lenis via
 * SmoothScroll — mounting here avoids two root Lenis instances fighting.
 */
export default function StickyScrollDemoPage() {
  return <DemoOne />
}

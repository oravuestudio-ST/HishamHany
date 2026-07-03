import SiteChrome from '@/components/SiteChrome'
import SkipLink from '@/components/SkipLink'

/**
 * Public-site layout. Every route in the (site) group shares the navigation,
 * cursor, scroll progress, smooth scrolling, and footer via SiteChrome; the
 * admin area lives outside the group and stays chrome-free.
 */
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* First focusable element on every page — jumps keyboard users past
          the chrome straight into the content. Styled in globals.css. */}
      <SkipLink />
      <SiteChrome>{children}</SiteChrome>
    </>
  )
}

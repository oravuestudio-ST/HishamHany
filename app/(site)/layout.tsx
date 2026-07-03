import SiteChrome from '@/components/SiteChrome'

/**
 * Public-site layout. Every route in the (site) group shares the navigation,
 * cursor, scroll progress, smooth scrolling, and footer via SiteChrome; the
 * admin area lives outside the group and stays chrome-free.
 */
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return <SiteChrome>{children}</SiteChrome>
}

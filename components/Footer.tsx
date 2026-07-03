import Link from 'next/link'
import Logo from '@/components/Logo'
import { SITE, SOCIAL_LINKS } from '@/lib/site'

const NAV = [
  { label: 'Portfolio', href: '/portfolio' },
  { label: 'Services',  href: '/services' },
  { label: 'About',     href: '/about' },
  { label: 'Journal',   href: '/journal' },
  { label: 'Contact',   href: '/contact' },
]

/** Editorial site footer — server-rendered, shared by every public route. */
export default function Footer() {
  return (
    <footer className="border-t border-fg/10 px-gutter py-stack-lg">
      <div className="grid gap-stack md:grid-cols-12 items-start">
        {/* Identity */}
        <div className="md:col-span-5">
          <Logo size={36} className="text-fg/80" />
          <p className="font-sans text-label-sm uppercase text-muted/70 mt-5 max-w-measure-narrow leading-relaxed">
            {SITE.title}
          </p>
          <p className="font-sans text-label-sm uppercase text-muted/50 mt-3">
            {SITE.location} — worldwide by commission
          </p>
        </div>

        {/* Site map */}
        <nav className="md:col-span-3" aria-label="Footer">
          <p className="font-sans text-label-xs uppercase text-muted/40 mb-4">Index</p>
          <ul className="space-y-2">
            {NAV.map(({ label, href }) => (
              <li key={href}>
                <Link
                  href={href}
                  className="link-underline font-sans text-label-sm uppercase text-muted/70 hover:text-fg transition-colors duration-300"
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Channels */}
        <div className="md:col-span-4">
          <p className="font-sans text-label-xs uppercase text-muted/40 mb-4">Direct</p>
          <a
            href={`mailto:${SITE.email}`}
            className="link-underline font-sans text-body-sm text-fg/85 hover:text-fg transition-colors duration-300 break-all"
          >
            {SITE.email}
          </a>
          <ul className="flex flex-wrap gap-x-5 gap-y-2 mt-4">
            {SOCIAL_LINKS.map(({ label, href, external }) => (
              <li key={label}>
                <a
                  href={href}
                  {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                  className="link-underline font-sans text-label-sm uppercase text-muted/60 hover:text-fg transition-colors duration-300"
                >
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="flex flex-wrap items-baseline justify-between gap-4 border-t border-fg/8 mt-stack pt-6">
        <p className="font-sans text-label-xs uppercase text-muted/40">
          © {new Date().getFullYear()} {SITE.name}. All rights reserved.
        </p>
        <p className="font-sans text-label-xs uppercase text-muted/40">
          Replies within 24 hours, Cairo time
        </p>
      </div>
    </footer>
  )
}

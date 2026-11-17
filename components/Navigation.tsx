'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { gsap } from 'gsap'
import Logo from '@/components/Logo'
import HeaderControls from '@/components/HeaderControls'
import { SOCIAL_LINKS } from '@/lib/site'
import { MOTION, gsapEase, registerMotion, prefersReducedMotion } from '@/lib/motion'
import { useEntered } from '@/components/MotionProvider'
import { useMagnetic } from '@/hooks/useMagnetic'
import { wipeTo } from '@/animations/transitions'
import { lockScroll } from '@/lib/lenis'

registerMotion()

const navLinks = [
  { label: 'Home',       href: '/',           num: '01' },
  { label: 'Portfolio',  href: '/portfolio',  num: '02' },
  { label: 'Services',   href: '/services',   num: '03' },
  { label: 'About',      href: '/about',      num: '04' },
  // Journal is linked from the footer until it posts regularly again.
  { label: 'Contact',    href: '/contact',    num: '05' },
]

const MENU_ID = 'site-menu'

/** Case studies live under /work but belong to the Portfolio section. */
function isCurrent(href: string, pathname: string) {
  if (href === '/') return pathname === '/'
  return pathname.startsWith(href) || (href === '/portfolio' && pathname.startsWith('/work/'))
}

export default function Navigation() {
  const router = useRouter()
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const linksRef = useRef<HTMLDivElement>(null)
  const headerRef = useRef<HTMLElement>(null)
  const toggleRef = useRef<HTMLButtonElement>(null)
  const inquireRef = useMagnetic<HTMLAnchorElement>(0.5)
  // Escape / toggle closes hand focus back to the toggle; route changes don't
  // (the template moves focus to the new page's <main>).
  const returnFocus = useRef(false)

  const closeMenu = useCallback((restoreFocus: boolean) => {
    returnFocus.current = restoreFocus
    setOpen(false)
  }, [])

  const isHome = pathname === '/'
  // Page-load sequence step 1: the header fades in first, before the hero.
  const entered = useEntered()
  useEffect(() => {
    const header = headerRef.current
    if (!entered || !header) return
    if (prefersReducedMotion()) {
      gsap.set(header, { opacity: 1, y: 0 })
      return
    }
    gsap.fromTo(
      header,
      { opacity: 0, y: -12 },
      { opacity: 1, y: 0, duration: MOTION.load.nav.dur, ease: gsapEase(), delay: MOTION.load.nav.at }
    )
  }, [entered])

  // Scrub-linked compression: --nav-p interpolates 0→1 over a 120px scroll
  // window past 80px, and the CSS derives padding, background alpha, border
  // alpha, and logo scale from it — the header never "pops" between states.
  // rAF-throttled, writes a CSS var (no React re-render per scroll frame).
  //
  // On home the header also takes the stage's dark roles (.stage-vars) while
  // it sits over the always-ink stage — the hero, the chapters, the index and
  // the Statement — so a light-theme visitor never gets ink type on ink.
  useEffect(() => {
    const header = headerRef.current
    if (!header) return
    const stageEnd = isHome ? document.getElementById('about-section') : null
    let raf = 0
    const update = () => {
      raf = 0
      const p = Math.min(1, Math.max(0, (window.scrollY - 80) / 120))
      header.style.setProperty('--nav-p', p.toFixed(3))
      header.toggleAttribute('data-scrolled', p > 0)
      header.classList.toggle('stage-vars', !!stageEnd && stageEnd.getBoundingClientRect().top > header.offsetHeight)
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (raf) cancelAnimationFrame(raf)
      header.classList.remove('stage-vars')
    }
  }, [isHome])

  // Menu open/close animation
  useEffect(() => {
    const menu = menuRef.current
    const links = linksRef.current?.querySelectorAll('.nav-link-item')
    if (!menu) return

    if (open) {
      gsap.set(menu, { display: 'flex' })
      gsap.fromTo(menu, { opacity: 0 }, { opacity: 1, duration: MOTION.dur.fast, ease: gsapEase() })
      if (links) {
        gsap.fromTo(links,
          { yPercent: 100, opacity: 0 },
          { yPercent: 0, opacity: 1, duration: MOTION.dur.reveal, ease: gsapEase(), stagger: MOTION.stagger, delay: 0.1 }
        )
      }
      lockScroll(true)
      // The page behind the dialog leaves the tab order and the a11y tree.
      document.querySelectorAll('main, footer').forEach((el) => el.setAttribute('inert', ''))
      linksRef.current?.querySelector<HTMLElement>('a')?.focus()
    } else {
      gsap.to(menu, {
        opacity: 0,
        duration: MOTION.dur.fast,
        ease: 'power2.in',
        onComplete: () => gsap.set(menu, { display: 'none' }),
      })
      lockScroll(false)
      document.querySelectorAll('main, footer').forEach((el) => el.removeAttribute('inert'))
      if (returnFocus.current) toggleRef.current?.focus()
      returnFocus.current = false
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeMenu(true)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, closeMenu])

  // Menu links are real anchors (prefetch, open in new tab), marked
  // data-route-direct so RouteWipe leaves them alone: the open overlay is
  // already covering the page, so there's no shutter to play — the route
  // starts on click while the menu fades.
  const onMenuLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
    e.preventDefault()
    closeMenu(false)
    if (href === pathname) window.scrollTo({ top: 0, behavior: 'smooth' })
    else router.push(href)
  }

  return (
    <>
      {/* Header */}
      <header
        ref={headerRef}
        className="site-header nav-shrink fixed top-0 left-0 right-0 z-header flex items-center justify-between px-8 md:px-12"
        style={{ '--nav-p': 0 } as React.CSSProperties}
      >
        {/* Logo — scales down with the header compression, anchored left. */}
        <a
          href="/"
          className="text-bone hover:text-silver transition-colors duration-swift inline-block"
          style={{
            transform: 'scale(calc(1 - 0.15 * var(--nav-p)))',
            transformOrigin: 'left center',
          }}
          onClick={(e) => {
            e.preventDefault()
            if (pathname === '/') window.scrollTo({ top: 0, behavior: 'smooth' })
            else wipeTo(() => router.push('/'))
          }}
          aria-label="Hisham Hany — Home"
        >
          <Logo size={42} />
        </a>

        {/* Right side */}
        <div className="flex items-center gap-6 md:gap-8">
          <a
            ref={inquireRef}
            href="/contact"
            // A real anchor: RouteWipe plays the shutter. Close the menu if it
            // is open underneath the header.
            onClick={() => open && closeMenu(false)}
            data-cursor="Inquire"
            className="magnetic-btn tap-target font-sans text-[0.6rem] tracking-[0.06em] uppercase text-silver hover:text-bone transition-colors duration-300"
          >
            Inquire
          </a>

          {/* Theme toggle + appearance/motion knobs */}
          <HeaderControls />

          {/* Hamburger */}
          <button
            ref={toggleRef}
            onClick={() => (open ? closeMenu(true) : setOpen(true))}
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            aria-controls={MENU_ID}
            className="tap-target flex flex-col gap-[5px] group"
          >
            <span className={`block h-px w-6 bg-bone transition-all duration-swift origin-center ${open ? 'rotate-45 translate-y-[6px]' : ''}`} />
            <span className={`block h-px bg-bone transition-all duration-swift ${open ? 'w-0 opacity-0' : 'w-4'}`} />
            <span className={`block h-px w-6 bg-bone transition-all duration-swift origin-center ${open ? '-rotate-45 -translate-y-[6px]' : ''}`} />
          </button>
        </div>
      </header>

      {/* Fullscreen overlay menu */}
      <div
        ref={menuRef}
        id={MENU_ID}
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        className="fixed inset-0 z-menu bg-bg/95 hidden flex-col justify-between px-8 md:px-16 py-24"
      >
        {/* Background ambient */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse 60% 60% at 80% 50%, rgb(var(--accent-rgb) / 0.10) 0%, transparent 70%)',
          }}
        />

        {/* Links */}
        <nav ref={linksRef} className="flex flex-col gap-2 mt-auto">
          {navLinks.map(({ label, href, num }) => {
            const active = isCurrent(href, pathname)
            return (
              <div key={label} className="nav-link-item overflow-hidden">
                <Link
                  href={href}
                  data-route-direct=""
                  onClick={(e) => onMenuLinkClick(e, href)}
                  aria-current={active ? 'page' : undefined}
                  className="group flex items-baseline gap-6 py-3 w-full text-left"
                >
                  <span
                    className={`font-sans text-[0.55rem] tracking-[0.06em] uppercase transition-colors duration-swift min-w-[2rem] ${
                      active ? 'text-ember' : 'text-muted group-hover:text-ember'
                    }`}
                  >
                    {num}
                  </span>
                  <span
                    className={`font-serif text-[clamp(3rem,8vw,7rem)] transition-colors duration-swift uppercase ${
                      active ? 'text-ember italic' : 'text-bone group-hover:text-silver'
                    }`}
                    style={{ fontWeight: 400, lineHeight: 1 }}
                  >
                    {label}
                  </span>
                </Link>
              </div>
            )
          })}
        </nav>

        {/* Footer strip */}
        <div className="flex items-end justify-between mt-16 pt-8 border-t border-line">
          <div className="flex flex-wrap gap-6">
            {SOCIAL_LINKS.map(({ label, href, external }) => (
              <a
                key={label}
                href={href}
                {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                className="link-underline font-sans text-[0.55rem] tracking-[0.05em] uppercase text-muted hover:text-bone transition-colors duration-300"
              >
                {label}
              </a>
            ))}
          </div>
          <div className="flex items-center gap-4">
            <Logo size={30} className="text-muted" />
            <p className="font-sans text-[0.55rem] tracking-[0.04em] uppercase text-muted">
              Available for projects
            </p>
          </div>
        </div>
      </div>
    </>
  )
}

'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { gsap } from 'gsap'
import Logo from '@/components/Logo'
import HeaderControls from '@/components/HeaderControls'
import { SOCIAL_LINKS } from '@/lib/site'
import { MOTION, gsapEase, registerMotion, prefersReducedMotion, viewportScale } from '@/lib/motion'
import { useEntered } from '@/components/MotionProvider'
import { useMagnetic } from '@/hooks/useMagnetic'
import { wipeTo } from '@/animations/transitions'

registerMotion()

const navLinks = [
  { label: 'Home',       href: '/',           num: '01' },
  { label: 'Portfolio',  href: '/portfolio',  num: '02' },
  { label: 'Services',   href: '/services',   num: '03' },
  { label: 'About',      href: '/about',      num: '04' },
  { label: 'Journal',    href: '/journal',    num: '05' },
  { label: 'Contact',    href: '/contact',    num: '06' },
]

export default function Navigation() {
  const router = useRouter()
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const linksRef = useRef<HTMLDivElement>(null)
  const headerRef = useRef<HTMLElement>(null)
  const inquireRef = useMagnetic<HTMLAnchorElement>(0.5)

  const isHome = pathname === '/'
  const isCaseStudy = pathname.startsWith('/work/')
  // Routes that open with a pinned slot→full-bleed reveal (Hero / CaseCover):
  // the header stays out of the unveil and eases in only once the photo is open.
  const heroGated = isHome || isCaseStudy
  // Same viewport-height budget the corresponding pin uses, so "reveal done"
  // and "header appears" can never drift apart.
  const gateVh = isHome ? MOTION.reveal.pinVh : MOTION.reveal.casePinVh

  // Page-load sequence step 1: the header fades in first, before the hero.
  // Skipped on reveal-gated routes — there the header is gated on the reveal
  // instead. pointer-events is cleared so a header hidden by the gate on a
  // previous route becomes interactive again on plain pages.
  const entered = useEntered()
  useEffect(() => {
    const header = headerRef.current
    if (heroGated || !entered || !header) return
    header.style.pointerEvents = ''
    if (prefersReducedMotion()) {
      gsap.set(header, { opacity: 1, y: 0 })
      return
    }
    gsap.fromTo(
      header,
      { opacity: 0, y: -12 },
      { opacity: 1, y: 0, duration: MOTION.load.nav.dur, ease: gsapEase(), delay: MOTION.load.nav.at }
    )
  }, [entered, heroGated])

  // Reveal-gated routes: hold the header out of frame while the photo unveils,
  // then ease it in once the pinned reveal has finished — i.e. after the reader
  // has scrolled `gateVh` viewport-heights (the same budget the pin uses).
  // Scrolling back up into the cover hides it again. Reduced motion / mobile
  // open the photo with no pin, so the header is free to show at once. Re-runs
  // on every route change so each cover starts with the header hidden.
  //
  // A visitor who never scrolls must still be able to reach the header — a
  // fixed header can't stay permanently non-interactive just because nobody
  // scrolled past the reveal (it was found completely unclickable, opacity 0
  // and pointer-events: none, indefinitely without a scroll — see the
  // `settleTimer` below). So there's a hard ceiling, `settleDelay`, tied to
  // the page-load cascade's own finish beat: whichever comes first — the
  // reader scrolling past the pin, or the entrance cascade settling — reveals
  // the header. Once shown via either path it stays shown; it only re-hides
  // on scroll-up before that ceiling has fired.
  useEffect(() => {
    const header = headerRef.current
    if (!header || !heroGated) return

    const ease = gsapEase()
    const setVisible = (on: boolean) => {
      gsap.to(header, { opacity: on ? 1 : 0, duration: MOTION.load.nav.dur, ease, overwrite: 'auto' })
      header.style.pointerEvents = on ? '' : 'none'
    }

    // This branch doesn't wait on `entered` — reduced-motion/mobile visitors
    // get the header immediately, same as before, with no loader-timing gap.
    if (prefersReducedMotion() || window.innerWidth < 768) {
      gsap.set(header, { opacity: 1 })
      header.style.pointerEvents = ''
      return
    }

    // Everything past here only matters once the loader has lifted — the
    // loader's own full-screen curtain (z-[9998], above the header's
    // z-[9990]) already blocks the header while it's up, so there's nothing
    // to set here before `entered`.
    if (!entered) return

    gsap.set(header, { opacity: 0 })
    header.style.pointerEvents = 'none'

    let shown = false
    let settled = false
    let raf = 0
    let endTimer = 0

    const settleDelay = (MOTION.load.buttons.at + MOTION.load.buttons.dur) * viewportScale().dur * 1000
    const settleTimer = window.setTimeout(() => {
      settled = true
      if (!shown) { shown = true; setVisible(true) }
    }, settleDelay)

    const isDone = () => window.scrollY >= window.innerHeight * gateVh
    const apply = () => {
      raf = 0
      if (settled) return
      const done = isDone()
      if (done !== shown) { shown = done; setVisible(done) }
    }
    // Lenis can coast to a stop without emitting a final scroll event, which
    // would strand the header mid-fade. A short debounce after the last event
    // reconciles the authoritative scroll position so it always lands
    // hidden-over-cover / shown-past-it regardless of a missed frame.
    const reconcile = () => {
      if (settled) return
      shown = isDone()
      setVisible(shown)
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(apply)
      clearTimeout(endTimer)
      endTimer = window.setTimeout(reconcile, 140)
    }
    apply()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (raf) cancelAnimationFrame(raf)
      clearTimeout(endTimer)
      clearTimeout(settleTimer)
    }
  }, [heroGated, gateVh, pathname, entered])

  // Scrub-linked compression: --nav-p interpolates 0→1 over a 120px scroll
  // window past 80px, and the CSS derives padding, background alpha, border
  // alpha, and logo scale from it — the header never "pops" between states.
  // rAF-throttled, writes a CSS var (no React re-render per scroll frame).
  useEffect(() => {
    const header = headerRef.current
    if (!header) return
    let raf = 0
    const update = () => {
      raf = 0
      const p = Math.min(1, Math.max(0, (window.scrollY - 80) / 120))
      header.style.setProperty('--nav-p', p.toFixed(3))
      header.toggleAttribute('data-scrolled', p > 0)
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [])

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
      document.body.style.overflow = 'hidden'
    } else {
      gsap.to(menu, {
        opacity: 0,
        duration: MOTION.dur.fast,
        ease: 'power2.in',
        onComplete: () => gsap.set(menu, { display: 'none' }),
      })
      document.body.style.overflow = ''
    }
  }, [open])

  const handleLinkClick = (href: string) => {
    setOpen(false)
    setTimeout(() => {
      if (href.startsWith('#')) {
        const el = document.querySelector(href)
        if (el) el.scrollIntoView({ behavior: 'smooth' })
      } else if (href === pathname) {
        // Already here — return to the top instead of replaying the transition.
        window.scrollTo({ top: 0, behavior: 'smooth' })
      } else {
        // Menu buttons aren't anchors, so RouteWipe's interceptor never sees
        // them — play the shutter explicitly.
        wipeTo(() => router.push(href))
      }
    }, 400)
  }

  return (
    <>
      {/* Header */}
      <header
        ref={headerRef}
        className="nav-shrink fixed top-0 left-0 right-0 z-[9990] opacity-0 flex items-center justify-between px-8 md:px-12"
        style={{ '--nav-p': 0 } as React.CSSProperties}
      >
        {/* Logo — scales down with the header compression, anchored left. */}
        <a
          href="/"
          className="text-bone hover:text-silver transition-colors duration-500 inline-block"
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
            onClick={(e) => { e.preventDefault(); handleLinkClick('/contact') }}
            data-cursor="Inquire"
            className="magnetic-btn hidden md:block font-sans text-[0.6rem] tracking-[0.06em] uppercase text-silver hover:text-bone transition-colors duration-300"
          >
            Inquire
          </a>

          {/* Theme toggle + appearance/motion knobs */}
          <HeaderControls />

          {/* Hamburger */}
          <button
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
            className="flex flex-col gap-[5px] group"
          >
            <span className={`block h-px w-6 bg-bone transition-all duration-500 origin-center ${open ? 'rotate-45 translate-y-[6px]' : ''}`} />
            <span className={`block h-px bg-bone transition-all duration-500 ${open ? 'w-0 opacity-0' : 'w-4'}`} />
            <span className={`block h-px w-6 bg-bone transition-all duration-500 origin-center ${open ? '-rotate-45 -translate-y-[6px]' : ''}`} />
          </button>
        </div>
      </header>

      {/* Fullscreen overlay menu */}
      <div
        ref={menuRef}
        className="fixed inset-0 z-[9989] bg-bg/97 backdrop-blur-md hidden flex-col justify-between px-8 md:px-16 py-24"
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
            const active = href === '/' ? pathname === '/' : pathname.startsWith(href)
            return (
              <div key={label} className="nav-link-item overflow-hidden">
                <button
                  onClick={() => handleLinkClick(href)}
                  aria-current={active ? 'page' : undefined}
                  className="group flex items-baseline gap-6 py-3 w-full text-left"
                >
                  <span
                    className={`font-sans text-[0.55rem] tracking-[0.06em] uppercase transition-colors duration-500 min-w-[2rem] ${
                      active ? 'text-ember' : 'text-silver/40 group-hover:text-ember'
                    }`}
                  >
                    {num}
                  </span>
                  <span
                    className={`font-serif text-[clamp(3rem,8vw,7rem)] transition-colors duration-500 uppercase ${
                      active ? 'text-ember italic' : 'text-bone group-hover:text-silver'
                    }`}
                    style={{ fontWeight: 400, lineHeight: 1 }}
                  >
                    {label}
                  </span>
                </button>
              </div>
            )
          })}
        </nav>

        {/* Footer strip */}
        <div className="flex items-end justify-between mt-16 pt-8 border-t border-bone/8">
          <div className="flex flex-wrap gap-6">
            {SOCIAL_LINKS.map(({ label, href, external }) => (
              <a
                key={label}
                href={href}
                {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                className="link-underline font-sans text-[0.55rem] tracking-[0.05em] uppercase text-silver/50 hover:text-bone transition-colors duration-300"
              >
                {label}
              </a>
            ))}
          </div>
          <div className="flex items-center gap-4">
            <Logo size={30} className="text-bone/25" />
            <p className="font-sans text-[0.55rem] tracking-[0.04em] uppercase text-silver/30">
              Available for projects
            </p>
          </div>
        </div>
      </div>
    </>
  )
}

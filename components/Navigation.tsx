'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Logo from '@/components/Logo'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

const navLinks = [
  { label: 'Work',       href: '#work',         num: '01' },
  { label: 'About',      href: '#about',        num: '02' },
  { label: 'Services',   href: '#services',     num: '03' },
  { label: 'Journal',    href: '/journal',      num: '04' },
  { label: 'Contact',    href: '#contact',      num: '05' },
]

export default function Navigation() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const linksRef = useRef<HTMLDivElement>(null)
  const headerRef = useRef<HTMLElement>(null)

  // Scroll-reactive header
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Menu open/close animation
  useEffect(() => {
    const menu = menuRef.current
    const links = linksRef.current?.querySelectorAll('.nav-link-item')
    if (!menu) return

    if (open) {
      gsap.set(menu, { display: 'flex' })
      gsap.fromTo(menu, { opacity: 0 }, { opacity: 1, duration: 0.4, ease: 'expo.out' })
      if (links) {
        gsap.fromTo(links,
          { yPercent: 100, opacity: 0 },
          { yPercent: 0, opacity: 1, duration: 0.9, ease: 'expo.out', stagger: 0.08, delay: 0.1 }
        )
      }
      document.body.style.overflow = 'hidden'
    } else {
      gsap.to(menu, {
        opacity: 0,
        duration: 0.35,
        ease: 'expo.in',
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
      } else {
        router.push(href)
      }
    }, 400)
  }

  return (
    <>
      {/* Header */}
      <header
        ref={headerRef}
        className={`fixed top-0 left-0 right-0 z-[9990] flex items-center justify-between px-8 md:px-12 py-6 transition-all duration-700 ${
          scrolled ? 'bg-ebony/80 backdrop-blur-sm border-b border-bone/5' : ''
        }`}
      >
        {/* Logo */}
        <a
          href="#"
          className="text-bone hover:text-silver transition-colors duration-500"
          onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
          aria-label="Hisham Hany — Home"
        >
          <Logo size={42} />
        </a>

        {/* Right side */}
        <div className="flex items-center gap-8">
          <a
            href="#contact"
            onClick={(e) => { e.preventDefault(); handleLinkClick('#contact') }}
            className="hidden md:block font-sans text-[0.6rem] tracking-[0.3em] uppercase text-silver hover:text-bone transition-colors duration-300"
          >
            Inquire
          </a>

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
        className="fixed inset-0 z-[9989] bg-ebony/97 backdrop-blur-md hidden flex-col justify-between px-8 md:px-16 py-24"
      >
        {/* Background ambient */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse 60% 60% at 80% 50%, rgba(0,73,91,0.12) 0%, transparent 70%)',
          }}
        />

        {/* Links */}
        <nav ref={linksRef} className="flex flex-col gap-2 mt-auto">
          {navLinks.map(({ label, href, num }) => (
            <div key={label} className="nav-link-item overflow-hidden">
              <button
                onClick={() => handleLinkClick(href)}
                className="group flex items-baseline gap-6 py-3 w-full text-left"
              >
                <span className="font-sans text-[0.55rem] tracking-[0.3em] uppercase text-silver/40 group-hover:text-ember transition-colors duration-500 min-w-[2rem]">
                  {num}
                </span>
                <span
                  className="font-serif text-[clamp(3rem,8vw,7rem)] text-bone group-hover:text-silver transition-colors duration-500"
                  style={{ fontWeight: 300, lineHeight: 1, fontStyle: 'italic' }}
                >
                  {label}
                </span>
              </button>
            </div>
          ))}
        </nav>

        {/* Footer strip */}
        <div className="flex items-end justify-between mt-16 pt-8 border-t border-bone/8">
          <div className="flex gap-6">
            {['Instagram', 'Behance', 'LinkedIn'].map((s) => (
              <a
                key={s}
                href="#"
                className="font-sans text-[0.55rem] tracking-[0.25em] uppercase text-silver/40 hover:text-bone transition-colors duration-300"
              >
                {s}
              </a>
            ))}
          </div>
          <div className="flex items-center gap-4">
            <Logo size={30} className="text-bone/25" />
            <p className="font-sans text-[0.55rem] tracking-[0.2em] uppercase text-silver/30">
              Available for projects
            </p>
          </div>
        </div>
      </div>
    </>
  )
}

'use client'

import { useEffect, useRef, useState } from 'react'
import Logo from '@/components/Logo'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SITE, SOCIAL_LINKS } from '@/lib/site'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

export default function Contact() {
  const sectionRef = useRef<HTMLElement>(null)
  const titleRef   = useRef<HTMLDivElement>(null)
  const [form, setForm]           = useState({ name: '', email: '', project: '', message: '' })
  const [sent, setSent]           = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError]         = useState('')

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(titleRef.current?.querySelectorAll('.reveal-inner') ?? [], {
        yPercent: 110,
        duration: 1.6,
        ease: 'expo.out',
        stagger: 0.12,
        scrollTrigger: { trigger: titleRef.current, start: 'top 80%', once: true },
      })

      gsap.fromTo('.contact-form',
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 1.2, ease: 'expo.out', delay: 0.3,
          scrollTrigger: { trigger: '.contact-form', start: 'top 85%', once: true } }
      )

      gsap.utils.toArray<Element>('.contact-chroma').forEach((el) => {
        ScrollTrigger.create({
          trigger: el,
          start: 'top 80%',
          once: true,
          onEnter: () => el.classList.add('chroma-active'),
        })
      })
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error ?? 'Something went wrong. Please try again.')
        return
      }

      setSent(true)
    } catch {
      setError('Network error. Please check your connection and try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section ref={sectionRef} id="contact" className="section-pad relative overflow-hidden min-h-screen flex flex-col justify-center">
      <div className="contact-ambient absolute inset-0 pointer-events-none" />

      <div className="relative z-10 max-w-4xl mx-auto w-full">
        {/* Header */}
        <div ref={titleRef} className="text-center mb-16">
          <p className="font-sans text-[0.58rem] tracking-[0.08em] uppercase text-silver/40 mb-8">
            06 — Get in Touch
          </p>

          <div className="overflow-hidden mb-3">
            <h2
              className="reveal-inner chroma contact-chroma font-serif contact-heading-light text-[clamp(3rem,8vw,9rem)] text-bone leading-[0.9]"
              data-text="Let's create"
            >
              Let&apos;s create
            </h2>
          </div>
          <div className="overflow-hidden mb-6">
            <h2
              className="reveal-inner chroma contact-chroma font-serif contact-heading-outline text-[clamp(3rem,8vw,9rem)] leading-[0.9]"
              data-text="something"
            >
              something
            </h2>
          </div>
          <div className="overflow-hidden">
            <h2
              className="reveal-inner chroma contact-chroma font-serif contact-heading-light text-[clamp(3rem,8vw,9rem)] text-ember leading-[0.9]"
              data-text="unforgettable."
            >
              unforgettable.
            </h2>
          </div>

          <p className="font-sans text-[0.7rem] text-silver/40 max-w-md mx-auto mt-8 leading-relaxed">
            Available for fashion campaigns, automotive shoots,<br />
            commercial briefs, and editorial commissions.
          </p>
        </div>

        {/* Form */}
        {!sent ? (
          <form
            onSubmit={handleSubmit}
            className="contact-form opacity-0 grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            <InputField
              label="Your Name"
              value={form.name}
              onChange={(v) => setForm((f) => ({ ...f, name: v }))}
              required
            />
            <InputField
              label="Email Address"
              type="email"
              value={form.email}
              onChange={(v) => setForm((f) => ({ ...f, email: v }))}
              required
            />
            <InputField
              label="Project Type"
              value={form.project}
              onChange={(v) => setForm((f) => ({ ...f, project: v }))}
              placeholder="Fashion Campaign, Editorial..."
            />
            <div className="md:col-span-2">
              <label htmlFor="contact-message" className="block font-sans text-[0.58rem] tracking-[0.05em] uppercase text-silver/35 mb-3">
                Tell me about your vision
              </label>
              <textarea
                id="contact-message"
                value={form.message}
                onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                rows={5}
                className="w-full bg-transparent border border-bone/10 focus:border-bone/30 outline-none text-bone font-sans text-[0.75rem] px-5 py-4 resize-none transition-colors duration-300 placeholder:text-silver/20"
                placeholder="Describe your project, timeline, and vision..."
                required
              />
            </div>

            {error && (
              <p className="md:col-span-2 font-sans text-[0.62rem] tracking-[0.1em] text-ember/80">
                {error}
              </p>
            )}

            <div className="md:col-span-2 flex flex-col md:flex-row items-center justify-between gap-6 mt-4">
              <p className="font-sans text-[0.58rem] tracking-[0.03em] text-silver/50">
                <a href={`mailto:${SITE.email}`} className="hover:text-bone transition-colors">{SITE.email}</a>
                &nbsp;·&nbsp;
                <a href={`tel:${SITE.phone}`} className="hover:text-bone transition-colors">+20 111 280 5807</a>
                &nbsp;·&nbsp; Cairo, Egypt
              </p>

              <button
                type="submit"
                disabled={submitting}
                className="magnetic-btn group relative overflow-hidden border border-bone/25 px-10 py-4 font-sans text-[0.62rem] tracking-[0.08em] uppercase text-bone hover:text-ebony transition-colors duration-500 disabled:opacity-40 disabled:pointer-events-none"
              >
                <span className="absolute inset-0 bg-bone scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
                <span className="relative z-10">
                  {submitting ? 'Sending…' : 'Send Inquiry'}
                </span>
              </button>
            </div>
          </form>
        ) : (
          <div className="contact-form text-center py-16">
            <div className="overflow-hidden mb-4">
              <p className="font-serif contact-heading-light text-[2.5rem] text-bone">
                Message received.
              </p>
            </div>
            <p className="font-sans text-[0.65rem] tracking-[0.04em] text-silver/40">
              I&apos;ll be in touch within 24 hours.
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="relative z-10 mt-24 pt-8 border-t border-bone/6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <Logo size={38} className="text-silver/25" />
          <div className="flex items-center gap-5">
            {SOCIAL_LINKS.map(({ label, href, external }) => (
              <a
                key={label}
                href={href}
                aria-label={label}
                {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                className="text-silver/40 hover:text-bone transition-colors duration-200 cursor-pointer"
              >
                <SocialIcon label={label} />
              </a>
            ))}
          </div>
          <p className="font-sans text-[0.5rem] tracking-[0.03em] text-silver/20">
            © {new Date().getFullYear()} Hisham Hany. All rights reserved.
          </p>
        </div>
      </div>
    </section>
  )
}

function SocialIcon({ label }: { label: string }) {
  const cls = 'w-[18px] h-[18px]'
  switch (label) {
    case 'Instagram':
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
        </svg>
      )
    case 'Behance':
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M22 7h-7V5h7v2zm1.726 10c-.442 1.297-2.029 3-5.101 3-3.074 0-5.564-1.729-5.564-5.675 0-3.91 2.325-5.92 5.466-5.92 3.082 0 4.964 1.756 5.375 4.426.078.506.109 1.188.095 2.14H15.97c.13 1.202.792 1.509 1.57 1.509.758 0 1.29-.391 1.49-.9h2.696zM15.883 13h4.917c-.069-1.107-.719-1.502-2.459-1.502-1.585 0-2.238.652-2.458 1.502zM5 19H0V5h4.917C7.009 5 8.5 5.988 8.5 8.104c0 1.555-.687 2.431-1.852 2.956C8.14 11.428 9 12.367 9 14.09 9 16.699 7.428 19 5 19zM3 10.5h1.917C5.917 10.5 6.5 10 6.5 9c0-1-.583-1.5-1.583-1.5H3V10.5zm0 5h2C5.916 15.5 6.5 15 6.5 14c0-1-.584-1.5-1.5-1.5H3V15.5z" />
        </svg>
      )
    case 'LinkedIn':
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
        </svg>
      )
    case 'WhatsApp':
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
      )
    case 'Call':
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
        </svg>
      )
    default:
      return null
  }
}

function InputField({
  label,
  value,
  onChange,
  type = 'text',
  required,
  placeholder,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  type?: string
  required?: boolean
  placeholder?: string
}) {
  const id = `contact-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`
  return (
    <div>
      <label htmlFor={id} className="block font-sans text-[0.58rem] tracking-[0.05em] uppercase text-silver/35 mb-3">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        placeholder={placeholder}
        className="w-full bg-transparent border-b border-bone/10 focus:border-bone/35 outline-none text-bone font-sans text-[0.75rem] py-3 transition-colors duration-300 placeholder:text-silver/20"
      />
    </div>
  )
}

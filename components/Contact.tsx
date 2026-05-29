'use client'

import { useEffect, useRef, useState } from 'react'
import Logo from '@/components/Logo'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

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
          <p className="font-sans text-[0.58rem] tracking-[0.4em] uppercase text-silver/40 mb-8">
            06 — Get in Touch
          </p>

          <div className="overflow-hidden mb-3">
            <h2
              className="reveal-inner chroma contact-chroma font-serif contact-heading-light text-[clamp(3rem,8vw,9rem)] text-bone italic leading-[0.9]"
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
              className="reveal-inner chroma contact-chroma font-serif contact-heading-light text-[clamp(3rem,8vw,9rem)] text-ember italic leading-[0.9]"
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
              <label htmlFor="contact-message" className="block font-sans text-[0.58rem] tracking-[0.25em] uppercase text-silver/35 mb-3">
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
              <p className="font-sans text-[0.58rem] tracking-[0.15em] text-silver/30">
                hishamshiboob@gmail.com &nbsp;·&nbsp; +20 111 280 5807 &nbsp;·&nbsp; Cairo, Egypt
              </p>

              <button
                type="submit"
                disabled={submitting}
                className="magnetic-btn group relative overflow-hidden border border-bone/25 px-10 py-4 font-sans text-[0.62rem] tracking-[0.35em] uppercase text-bone hover:text-ebony transition-colors duration-500 disabled:opacity-40 disabled:pointer-events-none"
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
              <p className="font-serif contact-heading-light text-[2.5rem] text-bone italic">
                Message received.
              </p>
            </div>
            <p className="font-sans text-[0.65rem] tracking-[0.2em] text-silver/40">
              I&apos;ll be in touch within 24 hours.
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="relative z-10 mt-24 pt-8 border-t border-bone/6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <Logo size={38} className="text-silver/25" />
          <div className="flex gap-6">
            {['Instagram', 'Behance', 'LinkedIn'].map((s) => (
              <a
                key={s}
                href="#"
                className="font-sans text-[0.52rem] tracking-[0.25em] uppercase text-silver/25 hover:text-bone/60 transition-colors duration-300"
              >
                {s}
              </a>
            ))}
          </div>
          <p className="font-sans text-[0.5rem] tracking-[0.15em] text-silver/20">
            © {new Date().getFullYear()} Hisham Hany. All rights reserved.
          </p>
        </div>
      </div>
    </section>
  )
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
      <label htmlFor={id} className="block font-sans text-[0.58rem] tracking-[0.25em] uppercase text-silver/35 mb-3">
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

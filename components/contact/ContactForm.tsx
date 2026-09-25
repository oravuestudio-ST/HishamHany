'use client'

import { useEffect, useState } from 'react'
import { useMagnetic } from '@/hooks/useMagnetic'
import { SITE } from '@/lib/site'
import { useScrollReveal } from '@/hooks/useScrollReveal'

/**
 * The inquiry form — extracted from the original home Contact section so the
 * dedicated /contact page owns it. Data flow unchanged: POST /api/contact
 * (rate-limited, Resend-backed), inline error surface, quiet success state.
 */
export default function ContactForm() {
  const submitRef = useMagnetic<HTMLButtonElement>(0.4)
  const revealRef = useScrollReveal<HTMLDivElement>()
  const [form, setForm] = useState({ name: '', email: '', project: '', budget: '', message: '', website: '' })
  const [sent, setSent] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  // Set when the inquiry could not be delivered: the form keeps what was
  // typed and offers the same message by email or WhatsApp instead.
  const [undelivered, setUndelivered] = useState(false)

  // Case studies link here as /contact?project=Automotive. Read on mount
  // rather than via useSearchParams, which would pull the whole form out of
  // the static HTML.
  useEffect(() => {
    const project = new URLSearchParams(window.location.search).get('project')
    if (project && project.length <= 100) setForm((f) => (f.project ? f : { ...f, project }))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    setUndelivered(false)

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        // 4xx carries a message the visitor can act on (rate limit, invalid
        // email); anything server-side gets one plain sentence instead.
        setError(res.status >= 500 ? NOT_DELIVERED : data.error ?? NOT_DELIVERED)
        setUndelivered(true)
        return
      }

      setSent(true)
    } catch {
      setError(NOT_DELIVERED)
      setUndelivered(true)
    } finally {
      setSubmitting(false)
    }
  }

  if (sent) {
    return (
      <div className="text-center py-16">
        <p className="font-serif text-[2.5rem] text-fg" style={{ fontWeight: 300 }}>
          Message received.
        </p>
        <p className="font-sans text-label-sm uppercase text-muted mt-4">
          I&apos;ll be in touch within 24 hours.
        </p>
      </div>
    )
  }

  return (
    <div ref={revealRef}>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
        <InputField
          label="Budget Range (Optional)"
          value={form.budget}
          onChange={(v) => setForm((f) => ({ ...f, budget: v }))}
          placeholder="e.g. 50–150k EGP, open to discuss"
        />
        <div className="group md:col-span-2">
          <label
            htmlFor="contact-message"
            className="block eyebrow mb-3 transition-colors duration-300 group-focus-within:text-accent"
          >
            Tell me about your vision
          </label>
          <textarea
            id="contact-message"
            value={form.message}
            onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
            rows={5}
            className="w-full bg-transparent border border-line focus:border-accent/60 outline-none text-fg font-sans text-body-sm px-5 py-4 resize-none transition-colors duration-300 placeholder:text-muted"
            placeholder="Describe your project, timeline, and vision..."
            required
          />
        </div>

        {error && (
          <div role="alert" className="md:col-span-2">
            <p className="font-sans text-label-sm text-danger">{error}</p>
            {undelivered && (
              <p className="eyebrow mt-4 flex flex-wrap gap-6">
                <a href={mailtoFor(form)} className="link-underline text-fg hover:text-accent">
                  Email it instead
                </a>
                <a
                  href={`${SITE.social.whatsapp}?text=${encodeURIComponent(form.message)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="link-underline text-fg hover:text-accent"
                >
                  WhatsApp
                </a>
              </p>
            )}
          </div>
        )}

        {/* Honeypot: off-screen and out of the tab order, so only bots fill it.
            The API drops any inquiry where it is non-empty. Kept last so the
            first text field is always the visitor's name. */}
        <div aria-hidden="true" className="absolute -left-[10000px] w-px h-px overflow-hidden">
          <label>
            Website
            <input
              type="text"
              name="website"
              tabIndex={-1}
              autoComplete="off"
              value={form.website}
              onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))}
            />
          </label>
        </div>

        <div className="md:col-span-2 flex justify-end mt-4">
          <button
            ref={submitRef}
            type="submit"
            disabled={submitting}
            data-cursor="Send"
            className={`btn-fill btn-cta magnetic-btn disabled:pointer-events-none ${submitting ? 'is-sending' : ''}`}
          >
            <span className="btn-fill__label inline-block">{submitting ? 'Sending…' : 'Send Inquiry'}</span>
          </button>
        </div>
      </form>
    </div>
  )
}

const NOT_DELIVERED = 'It didn’t go through. Your message is still here — send it by email or WhatsApp instead.'

/** The visitor's own words, ready to send from their mail app. */
function mailtoFor(form: { name: string; project: string; budget: string; message: string }) {
  const subject = `Inquiry${form.project ? ` — ${form.project}` : ''}`
  const lines = [form.message, '', `— ${form.name}`]
  if (form.budget) lines.push(`Budget: ${form.budget}`)
  const body = lines.join('\n')
  return `mailto:${SITE.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
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
    <div className="group">
      <label
        htmlFor={id}
        className="block eyebrow mb-3 transition-colors duration-300 group-focus-within:text-accent"
      >
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          placeholder={placeholder}
          className="w-full bg-transparent border-b border-line outline-none text-fg font-sans text-body-sm py-3 transition-colors duration-300 placeholder:text-muted"
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-px origin-center scale-x-0 bg-accent transition-transform duration-micro ease-touch group-focus-within:scale-x-100"
        />
      </div>
    </div>
  )
}

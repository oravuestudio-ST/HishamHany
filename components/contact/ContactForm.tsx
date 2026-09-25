'use client'

import { useEffect, useRef, useState } from 'react'
import { useMagnetic } from '@/hooks/useMagnetic'
import { SITE } from '@/lib/site'
import { useScrollReveal } from '@/hooks/useScrollReveal'
import { isValidEmail } from '@/app/api/contact/email'

type Required = 'name' | 'email' | 'message'
const REQUIRED: Required[] = ['name', 'email', 'message']
const FIELD_ID: Record<Required, string> = {
  name: 'contact-your-name',
  email: 'contact-email-address',
  message: 'contact-message',
}

/** What is wrong with a required field, in plain words — or '' when it's fine. */
function problemFor(field: Required, value: string): string {
  const v = value.trim()
  if (field === 'name') return v ? '' : 'Please add your name.'
  if (field === 'email') {
    if (!v) return 'Please add an email I can reply to.'
    return isValidEmail(v) ? '' : 'That email doesn’t look complete.'
  }
  return v ? '' : 'A line or two about the project is enough.'
}

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
  // A field is only judged once the visitor has left it (or tried to send),
  // so nobody is scolded for a field they haven't reached yet.
  const [touched, setTouched] = useState<Record<Required, boolean>>({ name: false, email: false, message: false })
  const successRef = useRef<HTMLParagraphElement>(null)

  const problems = Object.fromEntries(
    REQUIRED.map((f) => [f, touched[f] ? problemFor(f, form[f]) : ''])
  ) as Record<Required, string>
  const touch = (f: Required) => setTouched((t) => (t[f] ? t : { ...t, [f]: true }))

  useEffect(() => {
    if (sent) successRef.current?.focus()
  }, [sent])

  // Case studies link here as /contact?project=Automotive. Read on mount
  // rather than via useSearchParams, which would pull the whole form out of
  // the static HTML.
  useEffect(() => {
    const project = new URLSearchParams(window.location.search).get('project')
    if (project && project.length <= 100) setForm((f) => (f.project ? f : { ...f, project }))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const firstProblem = REQUIRED.find((f) => problemFor(f, form[f]))
    if (firstProblem) {
      setTouched({ name: true, email: true, message: true })
      document.getElementById(FIELD_ID[firstProblem])?.focus()
      return
    }
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
      <div role="status" className="text-center py-16">
        <p ref={successRef} tabIndex={-1} className="font-serif text-[2.5rem] text-fg outline-none" style={{ fontWeight: 300 }}>
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
      <form onSubmit={handleSubmit} noValidate className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <InputField
          id={FIELD_ID.name}
          label="Your Name"
          value={form.name}
          onChange={(v) => setForm((f) => ({ ...f, name: v }))}
          onBlur={() => touch('name')}
          problem={problems.name}
          autoComplete="name"
          required
        />
        <InputField
          id={FIELD_ID.email}
          label="Email Address"
          type="email"
          value={form.email}
          onChange={(v) => setForm((f) => ({ ...f, email: v }))}
          onBlur={() => touch('email')}
          problem={problems.email}
          autoComplete="email"
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
            htmlFor={FIELD_ID.message}
            className="block eyebrow mb-3 transition-colors duration-300 group-focus-within:text-accent"
          >
            Tell me about your vision
          </label>
          <textarea
            id={FIELD_ID.message}
            value={form.message}
            onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
            onBlur={() => touch('message')}
            rows={5}
            aria-invalid={problems.message ? true : undefined}
            aria-describedby={problems.message ? `${FIELD_ID.message}-problem` : undefined}
            className={`w-full bg-transparent border outline-none text-fg font-sans text-base md:text-body-sm px-5 py-4 resize-none transition-colors duration-300 placeholder:text-muted ${
              problems.message ? 'border-danger' : 'border-line-control focus:border-accent/60'
            }`}
            placeholder="Describe your project, timeline, and vision..."
            required
          />
          {problems.message && (
            <p id={`${FIELD_ID.message}-problem`} className="mt-2 font-sans text-label-sm text-danger">
              {problems.message}
            </p>
          )}
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
  id: idProp,
  label,
  value,
  onChange,
  onBlur,
  problem,
  autoComplete,
  type = 'text',
  required,
  placeholder,
}: {
  /** Explicit id when the form needs to address the field (focus on error). */
  id?: string
  label: string
  value: string
  onChange: (v: string) => void
  onBlur?: () => void
  /** Plain-language problem to show under the field; '' when it's fine. */
  problem?: string
  autoComplete?: string
  type?: string
  required?: boolean
  placeholder?: string
}) {
  const id = idProp ?? `contact-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`
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
          onBlur={onBlur}
          required={required}
          placeholder={placeholder}
          autoComplete={autoComplete}
          aria-invalid={problem ? true : undefined}
          aria-describedby={problem ? `${id}-problem` : undefined}
          // 16px on phones so iOS Safari doesn't zoom the page on focus.
          className={`w-full bg-transparent border-b outline-none text-fg font-sans text-base md:text-body-sm py-3 transition-colors duration-300 placeholder:text-muted ${
            problem ? 'border-danger' : 'border-line-control'
          }`}
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-px origin-center scale-x-0 bg-accent transition-transform duration-micro ease-touch group-focus-within:scale-x-100"
        />
      </div>
      {problem && (
        <p id={`${id}-problem`} className="mt-2 font-sans text-label-sm text-danger">
          {problem}
        </p>
      )}
    </div>
  )
}

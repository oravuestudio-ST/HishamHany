'use client'

import { useState } from 'react'
import { useMagnetic } from '@/hooks/useMagnetic'
import { useScrollReveal } from '@/hooks/useScrollReveal'

/**
 * The inquiry form — extracted from the original home Contact section so the
 * dedicated /contact page owns it. Data flow unchanged: POST /api/contact
 * (rate-limited, Resend-backed), inline error surface, quiet success state.
 */
export default function ContactForm() {
  const submitRef = useMagnetic<HTMLButtonElement>(0.4)
  const revealRef = useScrollReveal<HTMLDivElement>()
  const [form, setForm] = useState({ name: '', email: '', project: '', budget: '', message: '' })
  const [sent, setSent] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

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
            className="block font-sans text-label-xs uppercase text-muted mb-3 transition-colors duration-300 group-focus-within:text-accent"
          >
            Tell me about your vision
          </label>
          <textarea
            id="contact-message"
            value={form.message}
            onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
            rows={5}
            className="w-full bg-transparent border border-fg/10 focus:border-accent/60 outline-none text-fg font-sans text-body-sm px-5 py-4 resize-none transition-colors duration-300 placeholder:text-muted"
            placeholder="Describe your project, timeline, and vision..."
            required
          />
        </div>

        {error && (
          <p role="alert" className="md:col-span-2 font-sans text-label-sm text-accent">
            {error}
          </p>
        )}

        <div className="md:col-span-2 flex justify-end mt-4">
          <button
            ref={submitRef}
            type="submit"
            disabled={submitting}
            data-cursor="Send"
            className={`btn-fill magnetic-btn border border-fg px-10 py-4 font-sans text-label-sm uppercase text-fg disabled:pointer-events-none ${submitting ? 'is-sending' : ''}`}
          >
            <span className="btn-fill__label inline-block">{submitting ? 'Sending…' : 'Send Inquiry'}</span>
          </button>
        </div>
      </form>
    </div>
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
    <div className="group">
      <label
        htmlFor={id}
        className="block font-sans text-label-xs uppercase text-muted mb-3 transition-colors duration-300 group-focus-within:text-accent"
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
          className="w-full bg-transparent border-b border-fg/10 outline-none text-fg font-sans text-body-sm py-3 transition-colors duration-300 placeholder:text-muted"
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-px origin-center scale-x-0 bg-accent transition-transform duration-400 ease-touch group-focus-within:scale-x-100"
        />
      </div>
    </div>
  )
}

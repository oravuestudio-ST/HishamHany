'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function NewTestimonialPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    client_name: '',
    company: '',
    role: '',
    body: '',
    rating: 5,
    visible: true,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch('/api/admin/testimonials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })

    if (res.ok) {
      router.push('/admin/testimonials')
      router.refresh()
    } else {
      const data = await res.json().catch(() => ({}))
      setError(data.error ?? 'Save failed')
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900">New testimonial</h1>
      <form onSubmit={handleSubmit} className="space-y-5 max-w-lg">
        <Field label="Client name">
          <input
            value={form.client_name}
            onChange={(e) => set('client_name', e.target.value)}
            required
            className="input"
          />
        </Field>
        <Field label="Company">
          <input
            value={form.company}
            onChange={(e) => set('company', e.target.value)}
            required
            className="input"
          />
        </Field>
        <Field label="Role / title">
          <input
            value={form.role}
            onChange={(e) => set('role', e.target.value)}
            required
            className="input"
          />
        </Field>
        <Field label="Testimonial body">
          <textarea
            value={form.body}
            onChange={(e) => set('body', e.target.value)}
            required
            rows={4}
            className="input resize-none"
          />
        </Field>
        <Field label="Rating (1–5)">
          <select
            value={form.rating}
            onChange={(e) => set('rating', Number(e.target.value))}
            className="input"
          >
            {[5, 4, 3, 2, 1].map((n) => (
              <option key={n} value={n}>
                {'★'.repeat(n)} ({n}/5)
              </option>
            ))}
          </select>
        </Field>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.visible}
            onChange={(e) => set('visible', e.target.checked)}
          />
          Visible on site
        </label>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="rounded bg-gray-900 px-4 py-2 text-sm text-white hover:bg-gray-700 disabled:opacity-50"
          >
            {loading ? 'Saving…' : 'Create testimonial'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      {children}
    </div>
  )
}

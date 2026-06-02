'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Project } from '@/drizzle/schema'

const categories = ['Fashion', 'Automotive', 'Commercial', 'Editorial'] as const

interface Props {
  project?: Project
}

export default function ProjectForm({ project }: Props) {
  const router = useRouter()
  const isEdit = !!project

  const [form, setForm] = useState({
    title: project?.title ?? '',
    category: project?.category ?? 'Fashion',
    year: project?.year ?? String(new Date().getFullYear()),
    client: project?.client ?? '',
    image: project?.image ?? '',
    aspect: project?.aspect ?? 'portrait',
    colorized: project?.colorized ?? false,
    visible: project?.visible ?? true,
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

    const res = await fetch(
      isEdit ? `/api/admin/projects/${project.id}` : '/api/admin/projects',
      {
        method: isEdit ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      },
    )

    if (res.ok) {
      router.push('/admin/projects')
      router.refresh()
    } else {
      const data = await res.json().catch(() => ({}))
      setError(data.error ?? 'Save failed')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-lg">
      <Field label="Title">
        <input
          value={form.title}
          onChange={(e) => set('title', e.target.value)}
          required
          className="input"
        />
      </Field>

      <Field label="Category">
        <select
          value={form.category}
          onChange={(e) => set('category', e.target.value)}
          className="input"
        >
          {categories.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </Field>

      <Field label="Year">
        <input
          value={form.year}
          onChange={(e) => set('year', e.target.value)}
          required
          className="input"
        />
      </Field>

      <Field label="Client">
        <input
          value={form.client}
          onChange={(e) => set('client', e.target.value)}
          required
          className="input"
        />
      </Field>

      <Field label="Image path (URL-encoded path under /public)">
        <input
          value={form.image}
          onChange={(e) => set('image', e.target.value)}
          required
          placeholder="/images/..."
          className="input font-mono text-xs"
        />
      </Field>

      <Field label="Aspect">
        <div className="flex gap-4">
          {(['portrait', 'landscape'] as const).map((a) => (
            <label key={a} className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="aspect"
                value={a}
                checked={form.aspect === a}
                onChange={() => set('aspect', a)}
              />
              {a}
            </label>
          ))}
        </div>
      </Field>

      <div className="flex gap-6">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.colorized}
            onChange={(e) => set('colorized', e.target.checked)}
          />
          Colorized (GlitchColorGrid)
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.visible}
            onChange={(e) => set('visible', e.target.checked)}
          />
          Visible on site
        </label>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="rounded bg-gray-900 px-4 py-2 text-sm text-white hover:bg-gray-700 disabled:opacity-50"
        >
          {loading ? 'Saving…' : isEdit ? 'Save changes' : 'Create project'}
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

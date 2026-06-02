'use client'

import { useState } from 'react'
import type { Testimonial } from '@/drizzle/schema'

export default function TestimonialsTableClient({
  initialTestimonials,
}: {
  initialTestimonials: Testimonial[]
}) {
  const [rows, setRows] = useState<Testimonial[]>(initialTestimonials)

  async function toggleVisible(id: number, current: boolean) {
    await fetch(`/api/admin/testimonials/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ visible: !current }),
    })
    setRows((prev) =>
      prev.map((t) => (t.id === id ? { ...t, visible: !current } : t)),
    )
  }

  async function deleteTestimonial(id: number) {
    if (!confirm('Delete this testimonial?')) return
    await fetch(`/api/admin/testimonials/${id}`, { method: 'DELETE' })
    setRows((prev) => prev.filter((t) => t.id !== id))
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-left">
          <tr>
            <th className="px-4 py-3 font-medium text-gray-600">Client</th>
            <th className="px-4 py-3 font-medium text-gray-600">Company</th>
            <th className="px-4 py-3 font-medium text-gray-600">Rating</th>
            <th className="px-4 py-3 font-medium text-gray-600">Visible</th>
            <th className="px-4 py-3 font-medium text-gray-600">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 bg-white">
          {rows.map((t) => (
            <tr key={t.id} className="hover:bg-gray-50">
              <td className="px-4 py-3 font-medium text-gray-900">
                <div>{t.client_name}</div>
                <div className="text-xs text-gray-400">{t.role}</div>
              </td>
              <td className="px-4 py-3 text-gray-600">{t.company}</td>
              <td className="px-4 py-3 text-gray-600">{'★'.repeat(t.rating)}</td>
              <td className="px-4 py-3">
                <button
                  onClick={() => toggleVisible(t.id, t.visible)}
                  className={`rounded px-2 py-0.5 text-xs font-medium ${
                    t.visible
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {t.visible ? 'Visible' : 'Hidden'}
                </button>
              </td>
              <td className="px-4 py-3">
                <button
                  onClick={() => deleteTestimonial(t.id)}
                  className="text-red-500 hover:underline text-sm"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                No testimonials yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

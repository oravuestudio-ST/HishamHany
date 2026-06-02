'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { Project } from '@/drizzle/schema'

export default function ProjectsTableClient({
  initialProjects,
}: {
  initialProjects: Project[]
}) {
  const [rows, setRows] = useState<Project[]>(initialProjects)

  async function toggleVisible(id: number, current: boolean) {
    await fetch(`/api/admin/projects/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ visible: !current }),
    })
    setRows((prev) =>
      prev.map((p) => (p.id === id ? { ...p, visible: !current } : p)),
    )
  }

  async function moveOrder(id: number, direction: 'up' | 'down') {
    const idx = rows.findIndex((p) => p.id === id)
    if (idx === -1) return
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= rows.length) return

    const a = rows[idx]
    const b = rows[swapIdx]

    await Promise.all([
      fetch(`/api/admin/projects/${a.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order: b.order }),
      }),
      fetch(`/api/admin/projects/${b.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order: a.order }),
      }),
    ])

    const next = [...rows]
    next[idx] = { ...a, order: b.order }
    next[swapIdx] = { ...b, order: a.order }
    next.sort((x, y) => x.order - y.order)
    setRows(next)
  }

  async function deleteProject(id: number) {
    if (!confirm('Delete this project?')) return
    await fetch(`/api/admin/projects/${id}`, { method: 'DELETE' })
    setRows((prev) => prev.filter((p) => p.id !== id))
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-left">
          <tr>
            <th className="px-4 py-3 font-medium text-gray-600">Order</th>
            <th className="px-4 py-3 font-medium text-gray-600">Title</th>
            <th className="px-4 py-3 font-medium text-gray-600">Category</th>
            <th className="px-4 py-3 font-medium text-gray-600">Year</th>
            <th className="px-4 py-3 font-medium text-gray-600">Visible</th>
            <th className="px-4 py-3 font-medium text-gray-600">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 bg-white">
          {rows.map((p, i) => (
            <tr key={p.id} className="hover:bg-gray-50">
              <td className="px-4 py-3">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => moveOrder(p.id, 'up')}
                    disabled={i === 0}
                    className="text-gray-400 hover:text-gray-700 disabled:opacity-30"
                    aria-label="Move up"
                  >
                    ↑
                  </button>
                  <button
                    onClick={() => moveOrder(p.id, 'down')}
                    disabled={i === rows.length - 1}
                    className="text-gray-400 hover:text-gray-700 disabled:opacity-30"
                    aria-label="Move down"
                  >
                    ↓
                  </button>
                  <span className="ml-1 text-gray-400">{p.order}</span>
                </div>
              </td>
              <td className="px-4 py-3 font-medium text-gray-900">{p.title}</td>
              <td className="px-4 py-3 text-gray-600">{p.category}</td>
              <td className="px-4 py-3 text-gray-600">{p.year}</td>
              <td className="px-4 py-3">
                <button
                  onClick={() => toggleVisible(p.id, p.visible)}
                  className={`rounded px-2 py-0.5 text-xs font-medium ${
                    p.visible
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {p.visible ? 'Visible' : 'Hidden'}
                </button>
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <Link
                    href={`/admin/projects/${p.id}`}
                    className="text-blue-600 hover:underline"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => deleteProject(p.id)}
                    className="text-red-500 hover:underline"
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

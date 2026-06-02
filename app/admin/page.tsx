export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { getSession } from '@/lib/session'
import { db } from '@/lib/db'
import { projects, testimonials, page_views } from '@/drizzle/schema'
import { count, gte } from 'drizzle-orm'
import AdminDashboardChart from './DashboardChart'

export default async function AdminDashboardPage() {
  const session = await getSession()
  if (!session.isLoggedIn) redirect('/admin/login')

  const since = new Date()
  since.setDate(since.getDate() - 30)

  const [[{ projectCount }], [{ testimonialCount }], [{ viewCount }]] = await Promise.all([
    db.select({ projectCount: count() }).from(projects),
    db.select({ testimonialCount: count() }).from(testimonials),
    db.select({ viewCount: count() }).from(page_views).where(gte(page_views.visited_at, since)),
  ])

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Projects" value={projectCount} />
        <StatCard label="Testimonials" value={testimonialCount} />
        <StatCard label="Page views (30d)" value={viewCount} />
      </div>

      <AdminDashboardChart />
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-1 text-3xl font-semibold text-gray-900">{value}</p>
    </div>
  )
}

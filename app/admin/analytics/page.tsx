export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { getSession } from '@/lib/session'
import { db } from '@/lib/db'
import { page_views } from '@/drizzle/schema'
import { sql, gte, desc } from 'drizzle-orm'
import AnalyticsChart from '../DashboardChart'

export default async function AdminAnalyticsPage() {
  const session = await getSession()
  if (!session.isLoggedIn) redirect('/admin/login')

  const since = new Date()
  since.setDate(since.getDate() - 30)

  const [topPaths, topReferrers] = await Promise.all([
    db
      .select({
        path: page_views.path,
        views: sql<number>`count(*)::int`.as('views'),
      })
      .from(page_views)
      .where(gte(page_views.visited_at, since))
      .groupBy(page_views.path)
      .orderBy(desc(sql`count(*)`))
      .limit(20),

    db
      .select({
        referrer: page_views.referrer,
        views: sql<number>`count(*)::int`.as('views'),
      })
      .from(page_views)
      .where(gte(page_views.visited_at, since))
      .groupBy(page_views.referrer)
      .orderBy(desc(sql`count(*)`))
      .limit(10),
  ])

  return (
    <div className="space-y-10">
      <h1 className="text-2xl font-semibold text-gray-900">Analytics — last 30 days</h1>

      <AnalyticsChart />

      <section>
        <h2 className="mb-4 text-sm font-medium text-gray-600">Top pages</h2>
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left">
              <tr>
                <th className="px-4 py-3 font-medium text-gray-600">Path</th>
                <th className="px-4 py-3 font-medium text-gray-600 text-right">Views</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {topPaths.map((r) => (
                <tr key={r.path} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs text-gray-700">{r.path}</td>
                  <td className="px-4 py-3 text-right text-gray-900">{r.views}</td>
                </tr>
              ))}
              {topPaths.length === 0 && (
                <tr>
                  <td colSpan={2} className="px-4 py-8 text-center text-gray-400">
                    No data yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-sm font-medium text-gray-600">Top referrers</h2>
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left">
              <tr>
                <th className="px-4 py-3 font-medium text-gray-600">Referrer</th>
                <th className="px-4 py-3 font-medium text-gray-600 text-right">Views</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {topReferrers.map((r, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs text-gray-700">
                    {r.referrer ?? '(direct)'}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-900">{r.views}</td>
                </tr>
              ))}
              {topReferrers.length === 0 && (
                <tr>
                  <td colSpan={2} className="px-4 py-8 text-center text-gray-400">
                    No data yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { page_views } from '@/drizzle/schema'
import { requireAuth } from '@/lib/session'
import { sql, gte, desc } from 'drizzle-orm'

export const runtime = 'nodejs'

export async function GET() {
  try {
    await requireAuth()
  } catch (res) {
    return res as NextResponse
  }

  const since = new Date()
  since.setDate(since.getDate() - 30)

  const [topPaths, topReferrers, dailyViews] = await Promise.all([
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

    db
      .select({
        date: sql<string>`date_trunc('day', visited_at)::date::text`.as('date'),
        views: sql<number>`count(*)::int`.as('views'),
      })
      .from(page_views)
      .where(gte(page_views.visited_at, since))
      .groupBy(sql`date_trunc('day', visited_at)`)
      .orderBy(sql`date_trunc('day', visited_at)`),
  ])

  return NextResponse.json({ topPaths, topReferrers, dailyViews })
}

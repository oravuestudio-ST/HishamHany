export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { projects } from '@/drizzle/schema'
import { requireAuth } from '@/lib/session'
import { asc, max } from 'drizzle-orm'

export const runtime = 'nodejs'

export async function GET() {
  try {
    await requireAuth()
  } catch (res) {
    return res as NextResponse
  }

  const rows = await db.select().from(projects).orderBy(asc(projects.order))
  return NextResponse.json(rows)
}

export async function POST(req: NextRequest) {
  try {
    await requireAuth()
  } catch (res) {
    return res as NextResponse
  }

  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Bad request' }, { status: 400 })

  const [{ maxOrder }] = await db
    .select({ maxOrder: max(projects.order) })
    .from(projects)

  const newOrder = (maxOrder ?? -1) + 1

  const [row] = await db
    .insert(projects)
    .values({ ...body, order: newOrder })
    .returning()

  return NextResponse.json(row, { status: 201 })
}

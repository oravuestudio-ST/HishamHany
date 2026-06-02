export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { testimonials } from '@/drizzle/schema'
import { requireAuth } from '@/lib/session'
import { desc } from 'drizzle-orm'

export const runtime = 'nodejs'

export async function GET() {
  try {
    await requireAuth()
  } catch (res) {
    return res as NextResponse
  }

  const rows = await db
    .select()
    .from(testimonials)
    .orderBy(desc(testimonials.created_at))

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

  const rating = Number(body.rating)
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return NextResponse.json({ error: 'rating must be 1–5' }, { status: 400 })
  }

  const [row] = await db
    .insert(testimonials)
    .values({
      client_name: String(body.client_name),
      company: String(body.company),
      role: String(body.role),
      body: String(body.body),
      rating,
      visible: body.visible !== false,
    })
    .returning()

  return NextResponse.json(row, { status: 201 })
}

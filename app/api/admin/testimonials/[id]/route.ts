export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { testimonials } from '@/drizzle/schema'
import { requireAuth } from '@/lib/session'
import { eq } from 'drizzle-orm'

export const runtime = 'nodejs'

type Params = { params: { id: string } }

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    await requireAuth()
  } catch (res) {
    return res as NextResponse
  }

  const id = Number(params.id)
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 })
  }

  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Bad request' }, { status: 400 })

  const { id: _id, created_at: _ca, ...patch } = body

  const [row] = await db
    .update(testimonials)
    .set(patch)
    .where(eq(testimonials.id, id))
    .returning()

  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(row)
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    await requireAuth()
  } catch (res) {
    return res as NextResponse
  }

  const id = Number(params.id)
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 })
  }

  await db.delete(testimonials).where(eq(testimonials.id, id))
  return NextResponse.json({ ok: true })
}

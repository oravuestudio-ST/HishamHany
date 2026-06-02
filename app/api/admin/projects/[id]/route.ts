export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { projects } from '@/drizzle/schema'
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

  // Strip immutable fields
  const { id: _id, ...patch } = body

  const [row] = await db
    .update(projects)
    .set(patch)
    .where(eq(projects.id, id))
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

  await db.delete(projects).where(eq(projects.id, id))
  return NextResponse.json({ ok: true })
}

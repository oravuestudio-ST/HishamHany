export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { testimonials } from '@/drizzle/schema'
import { eq, desc } from 'drizzle-orm'

export const runtime = 'nodejs'

export async function GET() {
  const rows = await db
    .select()
    .from(testimonials)
    .where(eq(testimonials.visible, true))
    .orderBy(desc(testimonials.created_at))

  return NextResponse.json(rows)
}

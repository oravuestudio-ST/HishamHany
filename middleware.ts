import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'
import {
  HERO_EXPERIMENT,
  newAssignment,
  parseAssignment,
  serializeAssignment,
} from '@/lib/experiments'

export const config = {
  matcher: ['/((?!_next|api|admin|favicon|images).*)'],
}

export function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname

  // The variant page is only ever reached by the rewrite below.
  if (path === HERO_EXPERIMENT.variantPath) {
    return NextResponse.redirect(new URL('/', req.url))
  }

  const dbUrl = process.env.DATABASE_URL
  if (dbUrl) {
    const referrer = req.headers.get('referer') ?? null
    const country = req.headers.get('x-vercel-ip-country') ?? null
    const sql = neon(dbUrl)

    // Fire-and-forget: never awaited, never blocks the response
    sql`INSERT INTO page_views (path, referrer, country, visited_at)
        VALUES (${path}, ${referrer}, ${country}, NOW())`
      .catch(() => {})
  }

  if (path !== '/') return NextResponse.next()

  // ── Hero A/B test: sticky 50/50 assignment; B is a rewrite, so the URL
  //    stays "/" and both arms remain static pages.
  const existing = parseAssignment(req.cookies.get(HERO_EXPERIMENT.cookie)?.value)
  const assignment = existing ?? newAssignment()
  const res =
    assignment.variant === 'b'
      ? NextResponse.rewrite(new URL(HERO_EXPERIMENT.variantPath, req.url))
      : NextResponse.next()

  if (!existing) {
    res.cookies.set(HERO_EXPERIMENT.cookie, serializeAssignment(assignment), {
      path: '/',
      maxAge: HERO_EXPERIMENT.maxAgeDays * 24 * 60 * 60,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    })
  }
  return res
}

import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

export const config = {
  matcher: ['/((?!_next|api|admin|favicon|images).*)'],
}

export function middleware(req: NextRequest) {
  const dbUrl = process.env.DATABASE_URL
  if (dbUrl) {
    const path = req.nextUrl.pathname
    const referrer = req.headers.get('referer') ?? null
    const country = req.headers.get('x-vercel-ip-country') ?? null
    const sql = neon(dbUrl)

    // Fire-and-forget: never awaited, never blocks the response
    sql`INSERT INTO page_views (path, referrer, country, visited_at)
        VALUES (${path}, ${referrer}, ${country}, NOW())`
      .catch(() => {})
  }

  return NextResponse.next()
}

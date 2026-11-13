import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit, getIp } from '@/lib/rate-limiter'
import { HERO_EXPERIMENT, isExperimentEvent, isVariant, isVisitorId } from '@/lib/experiments'

/**
 * A/B event sink (lib/track-experiment.ts posts here via sendBeacon). Accepts
 * only known experiment/variant/event values and a well-formed visitor id;
 * everything else is a 400. Without a database it accepts and drops, so local
 * dev and previews never error.
 */
export async function POST(req: NextRequest) {
  const { ok } = checkRateLimit(`ab:${getIp(req)}`, 60, 60_000)
  if (!ok) return new NextResponse(null, { status: 429 })

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  }

  const { experiment, variant, visitorId, event, path } = body ?? {}
  if (
    experiment !== HERO_EXPERIMENT.id ||
    !isVariant(variant) ||
    !isVisitorId(visitorId) ||
    !isExperimentEvent(event) ||
    (path !== undefined && (typeof path !== 'string' || path.length > 200))
  ) {
    return NextResponse.json({ error: 'Invalid event.' }, { status: 400 })
  }

  if (!process.env.DATABASE_URL) return new NextResponse(null, { status: 204 })

  try {
    const { db } = await import('@/lib/db')
    const { ab_events } = await import('@/drizzle/schema')
    await db.insert(ab_events).values({
      experiment,
      variant,
      visitor_id: visitorId,
      event,
      path: typeof path === 'string' ? path : null,
    })
    return new NextResponse(null, { status: 204 })
  } catch (err) {
    console.error('[ab]', err)
    return new NextResponse(null, { status: 500 })
  }
}

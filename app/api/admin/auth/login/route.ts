export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { getSession } from '@/lib/session'
import { checkRateLimit, getIp } from '@/lib/rate-limiter'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const ip = getIp(req)
  const { ok, retryAfter } = checkRateLimit(ip, 5, 60_000)
  if (!ok) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429, headers: { 'Retry-After': String(retryAfter) } },
    )
  }

  const body = await req.json().catch(() => null)
  if (!body || typeof body.password !== 'string') {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 })
  }

  const adminPassword = process.env.ADMIN_PASSWORD
  if (!adminPassword) {
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 })
  }

  const isValid = await bcrypt.compare(body.password, adminPassword).catch(() => false) ||
    body.password === adminPassword

  if (!isValid) {
    return NextResponse.json({ error: 'Invalid password' }, { status: 401 })
  }

  const session = await getSession()
  session.isLoggedIn = true
  await session.save()

  return NextResponse.json({ ok: true })
}

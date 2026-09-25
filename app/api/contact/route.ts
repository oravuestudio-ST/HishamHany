import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { checkRateLimit, getIp } from '@/lib/rate-limiter'
import { buildInquiryEmail, isValidEmail } from './email'

const TO_EMAIL = process.env.CONTACT_EMAIL || 'hishamshiboob@gmail.com'

// Upper bounds per field. Generous for a real brief, small enough that the
// endpoint can't be used to push megabytes through Resend.
const FIELD_LIMITS: Record<string, number> = {
  name: 200,
  email: 254,
  project: 100,
  budget: 100,
  message: 5000,
}

// Instantiate lazily inside the handler. Constructing Resend at module scope
// throws "Missing API key" when RESEND_API_KEY is absent, which breaks the
// production build (page-data collection imports the route) and any env that
// hasn't set the key. Returns null when unconfigured so we can degrade cleanly.
function getResendClient(): Resend | null {
  const key = process.env.RESEND_API_KEY
  return key ? new Resend(key) : null
}

export async function POST(req: NextRequest) {
  const { ok, retryAfter } = checkRateLimit(`contact:${getIp(req)}`, 5, 60_000)
  if (!ok) {
    return NextResponse.json(
      { error: 'Too many requests. Please wait a moment before trying again.' },
      { status: 429, headers: { 'Retry-After': String(retryAfter) } }
    )
  }

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  }

  // Honeypot: the form renders a hidden "website" input no human fills in.
  // Answer exactly as for a real inquiry so bots learn nothing, but send nothing.
  if (typeof body?.website === 'string' && body.website.trim() !== '') {
    return NextResponse.json({ ok: true })
  }

  for (const [field, max] of Object.entries(FIELD_LIMITS)) {
    const value = body?.[field]
    if (value === undefined || value === null) continue
    if (typeof value !== 'string' || value.length > max) {
      return NextResponse.json({ error: 'One of the fields is too long or invalid.' }, { status: 400 })
    }
  }

  const { name, email, project, budget, message } = body as {
    name?: string
    email?: string
    project?: string
    budget?: string
    message?: string
  }

  if (!name || !email || !message) {
    return NextResponse.json({ error: 'Name, email, and message are required.' }, { status: 400 })
  }
  if (!isValidEmail(email)) {
    return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 })
  }

  const resend = getResendClient()
  if (!resend) {
    // In production an unconfigured key means the inquiry would vanish, so
    // say so (the form then offers email/WhatsApp with the message prefilled)
    // instead of faking success. Local dev accepts it so the form stays
    // testable without a key. Never log the visitor's details.
    if (process.env.NODE_ENV === 'production') {
      console.error('[contact] RESEND_API_KEY is not set — inquiry could not be emailed')
      return NextResponse.json({ error: 'Email is not configured.' }, { status: 503 })
    }
    console.warn('[contact] RESEND_API_KEY not set — inquiry accepted in development, not emailed')
    return NextResponse.json({ ok: true })
  }

  try {
    const { subject, html } = buildInquiryEmail({ name, email, project, budget, message })
    await resend.emails.send({
      from: 'Hisham Hany Portfolio <onboarding@resend.dev>',
      to: TO_EMAIL,
      replyTo: email,
      subject,
      html,
    })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[contact]', err)
    return NextResponse.json({ error: 'Failed to send message.' }, { status: 500 })
  }
}

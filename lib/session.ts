import { getIronSession, type SessionOptions } from 'iron-session'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export interface SessionData {
  isLoggedIn: boolean
}

export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET!,
  cookieName: 'hh-admin-session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax',
  },
}

export async function getSession() {
  return getIronSession<SessionData>(await cookies(), sessionOptions)
}

export async function requireAuth(): Promise<void | never> {
  const session = await getSession()
  if (!session.isLoggedIn) {
    throw NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

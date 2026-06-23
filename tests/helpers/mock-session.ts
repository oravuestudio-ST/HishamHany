/**
 * iron-session mock for admin route tests.
 *
 * Mirrors the real `@/lib/session` surface the routes consume:
 *   - getSession()  → a session object whose `isLoggedIn` is read/written by
 *                     the login route and whose `save()`/`destroy()` are spied.
 *   - requireAuth() → throws the same NextResponse 401 when logged out.
 *
 * Drive it from a test:
 *   vi.mock('@/lib/session', () => import('@/tests/helpers/mock-session'))
 *   import { __setLoggedIn, __session, __resetSession } from '@/tests/helpers/mock-session'
 *   __setLoggedIn(true)   // exercise the authenticated path
 */
import { vi } from 'vitest'
import { NextResponse } from 'next/server'

let loggedIn = false

const session = {
  get isLoggedIn() {
    return loggedIn
  },
  set isLoggedIn(v: boolean) {
    loggedIn = v
  },
  save: vi.fn(async () => {}),
  destroy: vi.fn(() => {
    loggedIn = false
  }),
}

export const getSession = vi.fn(async () => session)

export async function requireAuth(): Promise<void | never> {
  if (!loggedIn) {
    throw NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

/** Test control: the shared session object (assert on save/destroy spies). */
export const __session = session

/** Test control: set the logged-in state before invoking a route. */
export function __setLoggedIn(v: boolean) {
  loggedIn = v
}

/** Test control: reset state + spies between tests. */
export function __resetSession() {
  loggedIn = false
  session.save.mockClear()
  session.destroy.mockClear()
  getSession.mockClear()
}

/**
 * Drizzle/Neon mock for route unit tests.
 *
 * Routes import `db` (a Proxy over the Neon HTTP client) and `getDb` from
 * `@/lib/db` and build query chains like:
 *   await db.select().from(t).where(...).orderBy(...).limit(...)
 *   await db.insert(t).values(...).returning()
 *   await db.update(t).set(...).where(...).returning()
 *   await db.delete(t).where(...)
 *
 * Every Drizzle builder is thenable, so the real client resolves when awaited.
 * This mock reproduces that: each top-level `db.select/insert/update/delete`
 * call dequeues the next queued result (in call order) and returns a chainable,
 * awaitable builder bound to it. Empty queue → resolves to `[]` (the natural
 * "no rows" shape that 404 paths rely on, e.g. `const [row] = await ...`).
 *
 * Usage in a test file:
 *   vi.mock('@/lib/db', () => import('@/tests/helpers/mock-db'))
 *   import { __queue, __resetDb } from '@/tests/helpers/mock-db'
 *   __queue([{ maxOrder: 4 }], [insertedRow])  // results for the next two chains
 *
 * The dynamic-import factory sidesteps vi.mock hoisting: it references only a
 * path string, and vitest's module cache makes the test's static import the
 * same singleton, so `__queue`/`__resetDb` drive the very instance the route uses.
 */

const results: unknown[] = []

/** Flat log of every db/builder method call, so tests can assert on what a
 *  route passed to e.g. `.values({...})` or `.set({...})`. */
export const __calls: { method: string; args: unknown[] }[] = []

function makeBuilder(result: unknown): unknown {
  return new Proxy(
    {},
    {
      get(_target, prop) {
        if (prop === 'then') {
          return (onFulfilled: (v: unknown) => unknown, onRejected?: (e: unknown) => unknown) =>
            Promise.resolve(result).then(onFulfilled, onRejected)
        }
        // Any chain method (from/where/orderBy/groupBy/values/set/returning/limit…)
        // records its args and returns a builder still bound to the same result.
        return (...args: unknown[]) => {
          __calls.push({ method: String(prop), args })
          return makeBuilder(result)
        }
      },
    },
  )
}

/** The mocked `db`: each select/insert/update/delete starts a fresh chain. */
export const db = new Proxy(
  {},
  {
    get(_target, prop) {
      return (...args: unknown[]) => {
        __calls.push({ method: String(prop), args })
        return makeBuilder(results.length ? results.shift() : [])
      }
    },
  },
)

export const getDb = () => db

/** Queue resolved values for upcoming chains, in the order the route runs them. */
export function __queue(...values: unknown[]) {
  results.push(...values)
}

/** Find the args of the last call to a given builder method (e.g. 'values'). */
export function __lastCall(method: string): unknown[] | undefined {
  for (let i = __calls.length - 1; i >= 0; i--) {
    if (__calls[i].method === method) return __calls[i].args
  }
  return undefined
}

/** Clear any leftover queued results + call log between tests. */
export function __resetDb() {
  results.length = 0
  __calls.length = 0
}

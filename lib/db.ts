import { neon } from '@neondatabase/serverless'
import { drizzle, type NeonHttpDatabase } from 'drizzle-orm/neon-http'
import * as schema from '@/drizzle/schema'

// Lazily initialized so module import doesn't throw when DATABASE_URL is absent.
let _db: NeonHttpDatabase<typeof schema> | null = null

export function getDb(): NeonHttpDatabase<typeof schema> {
  if (!_db) {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL is not set')
    }
    _db = drizzle(neon(process.env.DATABASE_URL), { schema })
  }
  return _db
}

// Convenience export — same as getDb() but imported as `db`.
export const db = new Proxy({} as NeonHttpDatabase<typeof schema>, {
  get(_target, prop) {
    return getDb()[prop as keyof NeonHttpDatabase<typeof schema>]
  },
})

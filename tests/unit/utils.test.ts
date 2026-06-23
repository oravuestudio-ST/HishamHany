import { describe, it, expect } from 'vitest'
import { cn } from '@/lib/utils'

describe('cn (class merge)', () => {
  it('joins plain class names', () => {
    expect(cn('a', 'b')).toBe('a b')
  })

  it('drops falsy/conditional values', () => {
    expect(cn('a', false && 'b', undefined, null, 'c')).toBe('a c')
  })

  it('resolves conflicting Tailwind utilities — last one wins', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4')
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500')
  })

  it('keeps non-conflicting utilities from the same family', () => {
    expect(cn('px-2', 'py-4')).toBe('px-2 py-4')
  })
})

import { describe, it, expect, beforeEach } from 'vitest'
import {
  MAX_WEBGL_CONTEXTS,
  acquireWebGLContext,
  releaseWebGLContext,
  __activeWebGLContexts,
  __resetWebGLBudget,
} from '@/lib/webgl-budget'

beforeEach(() => __resetWebGLBudget())

describe('webgl-budget', () => {
  it('grants slots up to the cap, then denies', () => {
    for (let i = 0; i < MAX_WEBGL_CONTEXTS; i++) {
      expect(acquireWebGLContext()).toBe(true)
    }
    expect(acquireWebGLContext()).toBe(false)
    expect(__activeWebGLContexts()).toBe(MAX_WEBGL_CONTEXTS)
  })

  it('frees a slot on release so a new acquire can succeed', () => {
    for (let i = 0; i < MAX_WEBGL_CONTEXTS; i++) acquireWebGLContext()
    expect(acquireWebGLContext()).toBe(false)
    releaseWebGLContext()
    expect(acquireWebGLContext()).toBe(true)
  })

  it('never underflows below zero on extra releases', () => {
    releaseWebGLContext()
    releaseWebGLContext()
    expect(__activeWebGLContexts()).toBe(0)
  })
})

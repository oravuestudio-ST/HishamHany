// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'

describe('isWebGLAvailable', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it('returns true and probes the canvas only once (cached singleton)', async () => {
    const getContext = vi.fn().mockReturnValue({})
    vi.spyOn(document, 'createElement').mockImplementation(((tag: string) => {
      if (tag === 'canvas') return { getContext } as unknown as HTMLCanvasElement
      return document.createElementNS('http://www.w3.org/1999/xhtml', tag)
    }) as typeof document.createElement)

    const { isWebGLAvailable } = await import('@/lib/webgl')
    expect(isWebGLAvailable()).toBe(true)
    isWebGLAvailable()
    isWebGLAvailable()
    // createElement('canvas') only called on the first probe
    expect(getContext).toHaveBeenCalledTimes(1)
  })

  it('returns false when no WebGL context is available', async () => {
    vi.spyOn(document, 'createElement').mockImplementation(((tag: string) => {
      if (tag === 'canvas') return { getContext: () => null } as unknown as HTMLCanvasElement
      return document.createElementNS('http://www.w3.org/1999/xhtml', tag)
    }) as typeof document.createElement)

    const { isWebGLAvailable } = await import('@/lib/webgl')
    expect(isWebGLAvailable()).toBe(false)
  })
})

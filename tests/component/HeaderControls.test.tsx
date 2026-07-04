import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderToString } from 'react-dom/server'
import { hydrateRoot, type Root } from 'react-dom/client'
import { act, render, screen } from '@testing-library/react'

// SettingsProvider pulls the motion engine in for intensity; stub it out.
vi.mock('@/lib/motion', () => ({ setIntensity: vi.fn() }))

import { SettingsProvider } from '@/components/SettingsProvider'
import HeaderControls from '@/components/HeaderControls'

function App() {
  return (
    <SettingsProvider>
      <HeaderControls />
    </SettingsProvider>
  )
}

describe('HeaderControls', () => {
  beforeEach(() => {
    window.localStorage.clear()
    delete document.documentElement.dataset.theme
  })

  afterEach(() => {
    delete document.documentElement.dataset.theme
  })

  it('shows the theme toggle after mount', () => {
    document.documentElement.dataset.theme = 'dark'
    render(<App />)
    // Effects have run: dark theme → offer to switch to light.
    expect(screen.getByLabelText('Switch to light theme')).toBeInTheDocument()
  })

  it('hydrates cleanly when the bootstrap script set dark mode before React', async () => {
    // 1. "Server" render: no data-theme on <html>, so the default (light) HTML
    //    is what gets serialized — same as a real SSR pass.
    const serverHtml = renderToString(<App />)

    const container = document.createElement('div')
    container.innerHTML = serverHtml
    document.body.appendChild(container)

    // 2. The pre-hydration bootstrap script has stamped the stored preference.
    document.documentElement.dataset.theme = 'dark'
    window.localStorage.setItem('hh-theme', 'dark')

    // 3. Hydrate and capture React's console output.
    const errors: string[] = []
    const spy = vi.spyOn(console, 'error').mockImplementation((...args) => {
      errors.push(args.map(String).join(' '))
    })
    ;(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true

    let root: Root | undefined
    await act(async () => {
      root = hydrateRoot(container, <App />)
    })

    spy.mockRestore()

    const hydrationErrors = errors.filter((e) =>
      /hydrat|server html|did not match/i.test(e),
    )
    expect(hydrationErrors).toEqual([])

    // After mount the toggle reflects the real (dark) theme.
    expect(container.querySelector('[aria-label="Switch to light theme"]')).not.toBeNull()

    await act(async () => root?.unmount())
    container.remove()
  })
})

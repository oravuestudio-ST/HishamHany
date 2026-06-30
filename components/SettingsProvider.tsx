'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { setIntensity as applyMotionIntensity } from '@/lib/motion'

/**
 * Site-wide settings: the light/dark theme plus the tweakable "knobs" the brief
 * asks for (accent colour, motion intensity, smooth-scroll, custom cursor).
 *
 * The theme is bootstrapped before paint by the inline script in app/layout.tsx
 * (no FOUC); this provider hydrates from the values that script already applied
 * to <html>, then owns every subsequent change — persisting to localStorage and
 * writing the matching attribute / CSS variable on the document element.
 */

export type Theme = 'light' | 'dark'
export type Intensity = 'subtle' | 'balanced' | 'bold'

export interface Settings {
  theme: Theme
  /** Accent as a hex string for the colour input (e.g. "#2421c9"). */
  accent: string
  intensity: Intensity
  smoothScroll: boolean
  cursor: boolean
  toggleTheme: () => void
  setAccent: (hex: string) => void
  setIntensity: (i: Intensity) => void
  setSmoothScroll: (on: boolean) => void
  setCursor: (on: boolean) => void
  resetAccent: () => void
}

const DEFAULT_ACCENT = '#2421c9'
const INTENSITY_VALUE: Record<Intensity, number> = { subtle: 0.6, balanced: 1, bold: 1.5 }

const SettingsContext = createContext<Settings | null>(null)

/** Hex "#2421c9" → channel string "36 33 201" for the rgb(var() / a) tokens. */
function hexToChannels(hex: string): string | null {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim())
  if (!m) return null
  const n = parseInt(m[1], 16)
  return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`
}

function readInitialTheme(): Theme {
  if (typeof document === 'undefined') return 'light'
  return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light'
}

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(readInitialTheme)
  const [accent, setAccentState] = useState(DEFAULT_ACCENT)
  const [intensity, setIntensityState] = useState<Intensity>('balanced')
  const [smoothScroll, setSmoothScrollState] = useState(true)
  const [cursor, setCursorState] = useState(true)

  // Hydrate the knobs from localStorage / the values the bootstrap script set.
  useEffect(() => {
    const ls = window.localStorage
    setTheme(readInitialTheme())

    const storedAccent = ls.getItem('hh-accent')
    if (storedAccent) {
      const hex = '#' + storedAccent.split(/\s+/).map((c) => Number(c).toString(16).padStart(2, '0')).join('')
      setAccentState(hex)
    }

    const storedIntensity = (ls.getItem('hh-intensity') as Intensity) || 'balanced'
    setIntensityState(storedIntensity)
    applyMotionIntensity(INTENSITY_VALUE[storedIntensity])

    const ss = ls.getItem('hh-smooth')
    if (ss !== null) setSmoothScrollState(ss === '1')
    const cur = ls.getItem('hh-cursor')
    if (cur !== null) setCursorState(cur === '1')
  }, [])

  // Follow the OS preference live — but only while the user hasn't made a manual
  // choice (no 'hh-theme' key). Manual choice freezes the theme until they clear it.
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = (e: MediaQueryListEvent) => {
      if (window.localStorage.getItem('hh-theme')) return
      const next: Theme = e.matches ? 'dark' : 'light'
      document.documentElement.dataset.theme = next
      setTheme(next)
    }
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next: Theme = prev === 'dark' ? 'light' : 'dark'
      document.documentElement.dataset.theme = next
      window.localStorage.setItem('hh-theme', next) // marks a manual choice
      return next
    })
  }, [])

  const setAccent = useCallback((hex: string) => {
    const channels = hexToChannels(hex)
    if (!channels) return
    document.documentElement.style.setProperty('--accent-rgb', channels)
    window.localStorage.setItem('hh-accent', channels)
    setAccentState(hex)
  }, [])

  const resetAccent = useCallback(() => {
    document.documentElement.style.removeProperty('--accent-rgb')
    window.localStorage.removeItem('hh-accent')
    setAccentState(DEFAULT_ACCENT)
  }, [])

  const setIntensity = useCallback((i: Intensity) => {
    document.documentElement.dataset.intensity = i
    document.documentElement.style.setProperty('--motion-intensity', String(INTENSITY_VALUE[i]))
    applyMotionIntensity(INTENSITY_VALUE[i])
    window.localStorage.setItem('hh-intensity', i)
    setIntensityState(i)
  }, [])

  const setSmoothScroll = useCallback((on: boolean) => {
    window.localStorage.setItem('hh-smooth', on ? '1' : '0')
    setSmoothScrollState(on)
  }, [])

  const setCursor = useCallback((on: boolean) => {
    window.localStorage.setItem('hh-cursor', on ? '1' : '0')
    setCursorState(on)
  }, [])

  const value = useMemo<Settings>(
    () => ({
      theme, accent, intensity, smoothScroll, cursor,
      toggleTheme, setAccent, setIntensity, setSmoothScroll, setCursor, resetAccent,
    }),
    [theme, accent, intensity, smoothScroll, cursor, toggleTheme, setAccent, setIntensity, setSmoothScroll, setCursor, resetAccent],
  )

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
}

/** Read site settings. Safe to call outside the provider — returns sane defaults. */
export function useSettings(): Settings {
  const ctx = useContext(SettingsContext)
  if (ctx) return ctx
  // Fallback for components rendered outside the provider (e.g. isolated tests).
  return {
    theme: 'light', accent: DEFAULT_ACCENT, intensity: 'balanced', smoothScroll: true, cursor: true,
    toggleTheme: () => {}, setAccent: () => {}, setIntensity: () => {},
    setSmoothScroll: () => {}, setCursor: () => {}, resetAccent: () => {},
  }
}

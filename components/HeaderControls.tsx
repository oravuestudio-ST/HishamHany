'use client'

import { useEffect, useState } from 'react'
import { useSettings, type Intensity } from '@/components/SettingsProvider'

/**
 * Header cluster: the sun/moon theme toggle plus a small "tune" panel exposing
 * the motion/appearance knobs (accent, motion intensity, smooth-scroll, custom
 * cursor). Lives in the top-right of the nav. All controls are real buttons /
 * inputs so they stay keyboard-accessible.
 */
export default function HeaderControls() {
  const s = useSettings()
  const [open, setOpen] = useState(false)
  // The real theme only exists on the client (localStorage / the data-theme
  // attribute the bootstrap script sets), so the toggle stays neutral until
  // after hydration — otherwise the server and client trees disagree.
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const isDark = s.theme === 'dark'
  const nextMode = mounted ? (isDark ? 'Light' : 'Dark') : null

  return (
    <div className="flex items-center gap-3">
      {/* Theme toggle — label reads the mode you'll switch TO. */}
      <button
        type="button"
        onClick={s.toggleTheme}
        aria-label={nextMode ? `Switch to ${nextMode.toLowerCase()} theme` : 'Toggle theme'}
        data-cursor={nextMode ?? 'Theme'}
        className="magnetic-btn group flex items-center gap-2 font-sans text-[0.55rem] tracking-[0.14em] uppercase text-silver hover:text-bone transition-colors duration-300"
      >
        {!mounted ? <ContrastIcon /> : isDark ? <SunIcon /> : <MoonIcon />}
        <span className="hidden sm:inline">{nextMode ?? 'Theme'}</span>
      </button>

      {/* Knobs */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label="Appearance & motion settings"
          aria-expanded={open}
          className="group flex h-7 w-7 items-center justify-center text-silver hover:text-bone transition-colors duration-300"
        >
          <TuneIcon />
        </button>

        {open && (
          <>
            {/* click-away */}
            <button
              type="button"
              aria-hidden="true"
              tabIndex={-1}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-[9992] cursor-default"
            />
            <div
              role="dialog"
              aria-label="Settings"
              className="absolute right-0 top-10 z-[9993] w-64 border border-fg/10 bg-bg/95 backdrop-blur-md p-5 shadow-[0_24px_60px_-24px_rgb(var(--ink-rgb)/0.55)]"
            >
              <p className="font-sans text-[0.5rem] tracking-[0.3em] uppercase text-silver/50 mb-4">
                Appearance
              </p>

              {/* Accent */}
              <div className="flex items-center justify-between mb-5">
                <label htmlFor="hh-accent" className="font-sans text-[0.62rem] text-fg/80">Accent</label>
                <div className="flex items-center gap-2">
                  <input
                    id="hh-accent"
                    type="color"
                    value={s.accent}
                    onChange={(e) => s.setAccent(e.target.value)}
                    className="h-6 w-8 cursor-pointer rounded-sm border border-fg/15 bg-transparent p-0"
                    aria-label="Accent colour"
                  />
                  <button
                    type="button"
                    onClick={s.resetAccent}
                    className="font-sans text-[0.5rem] tracking-[0.15em] uppercase text-silver/50 hover:text-accent transition-colors"
                  >
                    Reset
                  </button>
                </div>
              </div>

              {/* Motion intensity */}
              <div className="mb-5">
                <p className="font-sans text-[0.62rem] text-fg/80 mb-2">Motion</p>
                <div className="grid grid-cols-3 gap-1 border border-fg/10 p-1">
                  {(['subtle', 'balanced', 'bold'] as Intensity[]).map((i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => s.setIntensity(i)}
                      aria-pressed={s.intensity === i}
                      className={`font-sans text-[0.5rem] tracking-[0.12em] uppercase py-1.5 transition-colors duration-200 ${
                        s.intensity === i ? 'bg-accent text-paper' : 'text-silver/60 hover:text-fg'
                      }`}
                    >
                      {i}
                    </button>
                  ))}
                </div>
              </div>

              {/* Smooth scroll */}
              <Toggle
                label="Smooth scroll"
                on={s.smoothScroll}
                onChange={s.setSmoothScroll}
              />
              {/* Custom cursor */}
              <Toggle
                label="Custom cursor"
                on={s.cursor}
                onChange={s.setCursor}
              />
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function Toggle({ label, on, onChange }: { label: string; on: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="font-sans text-[0.62rem] text-fg/80">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-label={label}
        onClick={() => onChange(!on)}
        className={`relative h-4 w-8 rounded-full border transition-colors duration-300 ${
          on ? 'bg-accent border-accent' : 'bg-transparent border-fg/25'
        }`}
      >
        <span
          className={`absolute top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full transition-all duration-300 ${
            on ? 'left-[1.05rem] bg-paper' : 'left-[0.15rem] bg-fg/40'
          }`}
        />
      </button>
    </div>
  )
}

function SunIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" aria-hidden="true">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  )
}

/** Neutral pre-hydration glyph — a half-filled contrast circle, correct in either theme. */
function ContrastIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" aria-hidden="true">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 8a4 4 0 010 8z" fill="currentColor" stroke="none" />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z" />
    </svg>
  )
}

function TuneIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" aria-hidden="true">
      <path d="M4 6h10M18 6h2M4 12h2M10 12h10M4 18h7M15 18h5" />
      <circle cx="16" cy="6" r="2" /><circle cx="8" cy="12" r="2" /><circle cx="13" cy="18" r="2" />
    </svg>
  )
}

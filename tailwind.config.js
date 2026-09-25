/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Semantic, theme-reactive tokens (preferred for new markup).
        bg:     'rgb(var(--bg-rgb) / <alpha-value>)',
        fg:     'rgb(var(--fg-rgb) / <alpha-value>)',
        muted:  'rgb(var(--muted-rgb) / <alpha-value>)',
        accent: 'rgb(var(--accent-rgb) / <alpha-value>)',
        // Constant brand surfaces (don't flip with theme).
        ink:    'rgb(var(--ink-rgb) / <alpha-value>)',
        paper:  'rgb(var(--paper-rgb) / <alpha-value>)',
        // Legacy aliases — repointed at the atelier roles so every existing
        // text-bone / bg-ebony / text-ember class becomes theme-aware with
        // working opacity modifiers, no markup churn required.
        bone:    'rgb(var(--fg-rgb) / <alpha-value>)',
        silver:  'rgb(var(--muted-rgb) / <alpha-value>)',
        ember:   'rgb(var(--accent-rgb) / <alpha-value>)',
        ebony:   'rgb(var(--ink-rgb) / <alpha-value>)',
        teal:    'rgb(var(--accent-rgb) / <alpha-value>)',
        olive:   'rgb(var(--muted-rgb) / <alpha-value>)',
        // Hairlines are the site's main structural device: two fixed weights
        // instead of per-component alphas (border-line / border-line-strong).
        line:          'rgb(var(--fg-rgb) / 0.1)',
        'line-strong': 'rgb(var(--fg-rgb) / 0.25)',
        // Errors only (invalid fields, role=alert, destructive admin actions).
        // Ultramarine already means link/hover/CTA, so errors need their own role.
        danger: 'rgb(var(--danger-rgb) / <alpha-value>)',
      },
      fontFamily: {
        // Bodoni Moda (display) + Spline Sans Mono (labels/body) wired through
        // the same CSS variables, so font-serif/font-sans flip site-wide.
        serif: ['var(--font-serif)', 'Bodoni Moda', 'Georgia', 'serif'],
        sans:  ['var(--font-mono)', 'Spline Sans Mono', 'monospace'],
        mono:  ['var(--font-mono)', 'Spline Sans Mono', 'monospace'],
      },
      letterSpacing: {
        tight: '-0.04em',
        snug:  '-0.02em',
        label: '0.08em',
      },
      fontSize: {
        // Mono label ladder — eyebrows, nav, meta captions. Tracking is part
        // of the token so labels read identically everywhere.
        'label-xs': ['0.5625rem', { letterSpacing: '0.3em',  lineHeight: '1.4' }],
        'label-sm': ['0.625rem',  { letterSpacing: '0.25em', lineHeight: '1.4' }],
        'label':    ['0.6875rem', { letterSpacing: '0.2em',  lineHeight: '1.5' }],
        // Body ladder — mirrors the prose defaults in globals.css.
        'body-sm':  ['0.8125rem', { lineHeight: '1.7'  }],
        'body':     ['0.9375rem', { lineHeight: '1.75' }],
        'body-lg':  ['1.125rem',  { lineHeight: '1.7'  }],
        // Bodoni fluid display ladder — the editorial voice. Line-height
        // tightens as size grows, matching the global h1-h3 treatment.
        'display-sm': ['clamp(1.75rem, 1.2rem + 2vw, 3rem)',    { lineHeight: '1.05', letterSpacing: '-0.02em' }],
        'display':    ['clamp(2.5rem, 1.5rem + 4.5vw, 5.5rem)', { lineHeight: '0.95', letterSpacing: '-0.03em' }],
        'display-lg': ['clamp(3.5rem, 2rem + 7vw, 8.5rem)',     { lineHeight: '0.87', letterSpacing: '-0.04em' }],
        'display-xl': ['clamp(4.5rem, 2.5rem + 10vw, 12rem)',   { lineHeight: '0.85', letterSpacing: '-0.04em' }],
      },
      spacing: {
        // Fluid layout rhythm — matches the existing 10vw/6vw section cadence.
        'gutter':     'clamp(1.5rem, 4vw, 3rem)',
        'section-sm': 'clamp(4rem, 6vw, 7rem)',
        'section':    'clamp(6rem, 10vw, 12rem)',
        'stack-sm':   'clamp(1rem, 2vw, 1.5rem)',
        'stack':      'clamp(2rem, 4vw, 3.5rem)',
        'stack-lg':   'clamp(3rem, 6vw, 5rem)',
      },
      maxWidth: {
        // Reading measures for editorial copy.
        'measure-narrow': '28rem',
        'measure':        '38rem',
        'measure-wide':   '52rem',
      },
      // Mirrors DUR.micro / DUR.swift (animations/tokens.ts) — asserted in
      // tests/unit/motion-tokens.test.ts so the two can't drift.
      transitionDuration: {
        micro: '350ms',
        swift: '700ms',
      },
      // One stacking scale, defined once as --z-* in app/globals.css so CSS,
      // Tailwind and inline styles (the route wipe) all read the same order.
      zIndex: {
        preview:  'var(--z-preview)',
        intro:    'var(--z-intro)',
        menu:     'var(--z-menu)',
        header:   'var(--z-header)',
        progress: 'var(--z-progress)',
        'popover-backdrop': 'var(--z-popover-backdrop)',
        popover:  'var(--z-popover)',
        modal:    'var(--z-modal)',
        'cursor-ring': 'var(--z-cursor-ring)',
        cursor:   'var(--z-cursor)',
        loader:   'var(--z-loader)',
      },
      transitionTimingFunction: {
        'expo-out': 'cubic-bezier(0.16, 1, 0.3, 1)',
        'expo-in':  'cubic-bezier(0.7, 0, 0.84, 0)',
        'circ-out': 'cubic-bezier(0, 0.55, 0.45, 1)',
        // Signature ease — mirrors --ease-premium / MOTION.ease (tokens-v2 settle).
        'premium':  'cubic-bezier(0.16, 1, 0.3, 1)',
        // Tokens-v2 family — mirror --ease-drift / --ease-touch.
        'drift':    'cubic-bezier(0.33, 0, 0.2, 1)',
        'touch':    'cubic-bezier(0.3, 0.9, 0.3, 1)',
      },
    },
  },
  plugins: [],
}

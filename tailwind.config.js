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
      transitionTimingFunction: {
        'expo-out': 'cubic-bezier(0.16, 1, 0.3, 1)',
        'expo-in':  'cubic-bezier(0.7, 0, 0.84, 0)',
        'circ-out': 'cubic-bezier(0, 0.55, 0.45, 1)',
        // Signature ease — mirrors --ease-premium / MOTION.ease.
        'premium':  'cubic-bezier(0.22, 1, 0.36, 1)',
      },
    },
  },
  plugins: [],
}

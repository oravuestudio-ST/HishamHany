import type { Metadata } from 'next'
import { Bodoni_Moda, Spline_Sans_Mono } from 'next/font/google'
import { SITE, SITE_URL, personJsonLd } from '@/lib/site'
import { SettingsProvider } from '@/components/SettingsProvider'
import './globals.css'

// Display face — high-contrast didone for the editorial headlines.
const bodoni = Bodoni_Moda({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-serif',
  display: 'swap',
  // Bodoni Moda has no fallback-metric override data in next/font — disable the
  // automatic adjustment (and its noisy warning); `display: swap` still applies.
  adjustFontFallback: false,
})

// Label / body face — a monospaced grotesque for the atelier captions.
const splineMono = Spline_Sans_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  style: ['normal', 'italic'],
  variable: '--font-mono',
  display: 'swap',
})

/**
 * Pre-hydration theme + knobs bootstrap. Runs synchronously before paint so the
 * correct theme/accent/intensity are applied with no flash. Reads a manual
 * choice from localStorage('hh-theme') first, else the OS preference. Mirrored
 * by SettingsProvider once React hydrates.
 */
const themeBootstrap = `(function(){try{
  var d=document.documentElement, ls=localStorage;
  var t=ls.getItem('hh-theme');
  if(t!=='light'&&t!=='dark'){t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}
  d.dataset.theme=t;
  var a=ls.getItem('hh-accent'); if(a){d.style.setProperty('--accent-rgb',a);}
  var i=ls.getItem('hh-intensity')||'balanced'; d.dataset.intensity=i;
  d.style.setProperty('--motion-intensity', i==='subtle'?'0.6':i==='bold'?'1.5':'1');
}catch(e){}})();`

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: SITE.title,
  description: SITE.description,
  keywords: ['fashion photography', 'automotive photography', 'commercial photographer', 'Cairo photographer', 'editorial photography', 'brand photography'],
  alternates: { canonical: '/' },
  openGraph: {
    title: SITE.title,
    description: 'Where light becomes language.',
    type: 'website',
    url: SITE_URL,
    siteName: SITE.name,
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE.title,
    description: 'Where light becomes language.',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${bodoni.variable} ${splineMono.variable}`} suppressHydrationWarning>
      <head>
        {/* Apply theme before paint — prevents a flash of the wrong palette. */}
        <script dangerouslySetInnerHTML={{ __html: themeBootstrap }} />
      </head>
      <body className="grain antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd()) }}
        />
        {/* Graceful no-JS fallback — the animated homepage mounts client-side, so
            give non-JS visitors a visible, usable summary instead of a blank page. */}
        <noscript>
          <div style={{ maxWidth: '40rem', margin: '0 auto', padding: '20vh 8vw', textAlign: 'center' }}>
            <h1 style={{ fontFamily: 'var(--font-serif), Georgia, serif', fontSize: '2.5rem', textTransform: 'uppercase', letterSpacing: '-0.03em' }}>
              Hisham Hany
            </h1>
            <p style={{ fontFamily: 'var(--font-mono), monospace', fontSize: '0.8rem', lineHeight: 1.8, marginTop: '1rem' }}>
              Cairo-based photographer — fashion, automotive &amp; commercial.<br />
              This portfolio uses motion that needs JavaScript. Reach me at{' '}
              <a href={`mailto:${SITE.email}`} style={{ color: 'var(--accent)' }}>{SITE.email}</a>.
            </p>
          </div>
        </noscript>
        <SettingsProvider>{children}</SettingsProvider>
      </body>
    </html>
  )
}

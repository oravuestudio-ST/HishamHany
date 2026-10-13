import type { Metadata } from 'next'
import { Bodoni_Moda, Spline_Sans_Mono } from 'next/font/google'
import { SITE, SITE_URL, personJsonLd } from '@/lib/site'
import { LOAD } from '@/animations/tokens'
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
  var d=document.documentElement; d.dataset.js='1';
  var ls=localStorage;
  var t=ls.getItem('hh-theme');
  if(t!=='light'&&t!=='dark'){t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}
  d.dataset.theme=t;
  var a=ls.getItem('hh-accent'); if(a){d.style.setProperty('--accent-rgb',a);}
  var i=ls.getItem('hh-intensity')||'balanced'; d.dataset.intensity=i;
  d.style.setProperty('--motion-intensity', i==='subtle'?'0.6':i==='bold'?'1.5':'1');
}catch(e){}})();`

/**
 * Home intro state + failsafes (see .intro-overlay in globals.css). The intro
 * only runs on a fresh navigation to "/" with no hash and motion allowed —
 * never on reload, back/forward or a deep link, where the reader expects to be
 * put straight back where they were. "full" the first time in this tab's
 * session, "short" (the opening alone, assets cached) after that.
 *
 * Two timers guarantee nobody is ever left behind an ink curtain: if JS never
 * claims the intro by LOAD.failsafe the page is forced to its finished state,
 * and a claimed intro that stalls gets LOAD.watchdog more before the same.
 * The first timer also drops data-js when React never hydrated (e.g. a chunk
 * failed to load), releasing every data-js-gated starting state site-wide.
 */
const introBootstrap = `(function(){try{
  var d=document.documentElement;
  var nav=performance.getEntriesByType&&performance.getEntriesByType('navigation')[0];
  var type=nav?nav.type:'navigate';
  var ok=location.pathname==='/'&&!location.hash&&type==='navigate'&&matchMedia('(prefers-reduced-motion: no-preference)').matches;
  if(ok){var seen=null;try{seen=sessionStorage.getItem('hh-intro');}catch(e){}d.dataset.intro=seen?'short':'full';}
  setTimeout(function(){
    if(!window.__hhHydrated){delete d.dataset.js;}
    var s=d.dataset.intro; if(s==='full'||s==='short'){d.dataset.intro='done';}
  },${Math.round(LOAD.failsafe * 1000)});
  setTimeout(function(){if(d.dataset.intro==='run'){d.dataset.intro='done';}},${Math.round((LOAD.failsafe + LOAD.watchdog) * 1000)});
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
        <script dangerouslySetInnerHTML={{ __html: introBootstrap }} />
      </head>
      <body className="grain antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd()) }}
        />
        <SettingsProvider>{children}</SettingsProvider>
      </body>
    </html>
  )
}

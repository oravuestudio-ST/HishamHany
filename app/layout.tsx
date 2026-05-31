import type { Metadata } from 'next'
import { IBM_Plex_Serif, IBM_Plex_Mono } from 'next/font/google'
import { SITE, SITE_URL, personJsonLd } from '@/lib/site'
import './globals.css'

const ibmPlexSerif = IBM_Plex_Serif({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  style: ['normal', 'italic'],
  variable: '--font-serif',
  display: 'swap',
})

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  style: ['normal'],
  variable: '--font-mono',
  display: 'swap',
})

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
    <html lang="en" className={`${ibmPlexSerif.variable} ${ibmPlexMono.variable}`}>
      <body className="grain bg-ebony text-bone antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd()) }}
        />
        {children}
      </body>
    </html>
  )
}

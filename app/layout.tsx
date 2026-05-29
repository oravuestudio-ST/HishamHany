import type { Metadata } from 'next'
import { Cormorant_Garamond, Inter } from 'next/font/google'
import './globals.css'

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  style: ['normal', 'italic'],
  variable: '--font-cormorant',
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Hisham Hany — Commercial, Automotive & Fashion Photographer',
  description: 'Cairo-based photographer specializing in commercial, automotive, and fashion photography. Where light becomes language.',
  keywords: ['fashion photography', 'automotive photography', 'commercial photographer', 'Cairo photographer', 'editorial photography', 'brand photography'],
  openGraph: {
    title: 'Hisham Hany — Commercial, Automotive & Fashion Photographer',
    description: 'Where light becomes language.',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${cormorant.variable} ${inter.variable}`}>
      <body className="grain bg-ebony text-bone antialiased">
        {children}
      </body>
    </html>
  )
}

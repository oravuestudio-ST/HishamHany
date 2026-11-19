// Baseline hardening applied to every response. No full script/style CSP:
// GSAP writes inline styles and the theme bootstrap is an inline script, so a
// strict CSP would need nonces end to end. frame-ancestors is safe on its own.
const SECURITY_HEADERS = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'Content-Security-Policy', value: "frame-ancestors 'self'" },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()' },
]

// Case-study slugs before the 2026-11-19 commercial rename (old -> new), so
// shared and indexed links keep landing on the right project.
const RENAMED_SLUGS = {
  'glitch-club-outdoor': 'glitch-goods-street-edition',
  'mercedes-gle-450-4matic': 'mercedes-benz-gle-450-detail-study',
  'baby-gang-childrenswear': 'baby-gang-childrenswear-campaign',
  'binghatti-cairo-activation': 'binghatti-cairo-launch-activation',
  'glitch-club-germany': 'glitch-goods-germany-tour-editorial',
  'glitch-club-party-till-die': 'glitch-goods-party-till-die-capsule',
  'glitch-set-color-study': 'glitch-goods-monochrome-color-study',
  'glitch-kanta': 'glitch-goods-kanta-product-story',
  'glitch-circle-kk': 'glitch-goods-circle-kk-capsule',
  'glitch-bag': 'glitch-goods-accessories-campaign',
  'isis-festival-coverage': 'isis-festival-press-coverage',
  'volkswagen-jetta': 'volkswagen-jetta-showroom-campaign',
  'glide-electric-scooter': 'glide-electric-scooter-launch',
  'seat-ibiza': 'seat-ibiza-dealer-campaign',
  'new-capital-architectural-study': 'new-administrative-capital-architectural-editorial',
  'hands-of-clay': 'hands-of-clay-documentary-essay',
  'ei-cons-on-site': 'ei-cons-construction-on-site-documentary',
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [{ source: '/:path*', headers: SECURITY_HEADERS }]
  },
  async redirects() {
    return Object.entries(RENAMED_SLUGS).map(([from, to]) => ({
      source: `/work/${from}`,
      destination: `/work/${to}`,
      permanent: true,
    }))
  },
  images: {
    // AVIF first: ~20-30% smaller than WebP for the photographs that make up
    // most of the home page's weight (encoded once, then cached).
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'plus.unsplash.com',
      },
    ],
  },
  experimental: {
    // Prevent Next.js from bundling the large public/images folder into serverless functions.
    // galleries.ts uses fs.readdirSync which causes the tracer to include all image files.
    // Images in /public are static CDN assets — they don't belong in the lambda.
    outputFileTracingExcludes: {
      '.*': [
        './public/images/**/*',
        './public/**/*.jpg',
        './public/**/*.JPG',
        './public/**/*.jpeg',
        './public/**/*.png',
        './public/**/*.webp',
      ],
    },
  },
}

// Opt-in bundle analysis: `ANALYZE=true npm run build` opens an interactive treemap
// (useful for auditing the three.js / gsap / lenis footprint).
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

module.exports = withBundleAnalyzer(nextConfig)

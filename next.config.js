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

/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [{ source: '/:path*', headers: SECURITY_HEADERS }]
  },
  images: {
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

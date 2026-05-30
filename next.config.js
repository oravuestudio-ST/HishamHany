/** @type {import('next').NextConfig} */
const nextConfig = {
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
  // Prevent Next.js from bundling the large public/images folder into serverless functions.
  // Images in /public are served as static assets and don't need to be in the function trace.
  outputFileTracingExcludes: {
    '*': ['./public/images/**/*'],
  },
}

// Opt-in bundle analysis: `ANALYZE=true npm run build` opens an interactive treemap
// (useful for auditing the three.js / gsap / lenis footprint).
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

module.exports = withBundleAnalyzer(nextConfig)

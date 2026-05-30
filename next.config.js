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

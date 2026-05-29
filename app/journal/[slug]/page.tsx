import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { MDXRemote } from 'next-mdx-remote/rsc'
import { getAllPosts, getPost, formatDate } from '@/lib/journal'
import { SITE, SITE_URL } from '@/lib/site'

export function generateStaticParams() {
  return getAllPosts().map((p) => ({ slug: p.slug }))
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const post = getPost(params.slug)
  if (!post) return {}
  return {
    title: `${post.title} — ${SITE.name}`,
    description: post.excerpt,
    alternates: { canonical: `/journal/${post.slug}` },
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: 'article',
      url: `${SITE_URL}/journal/${post.slug}`,
      publishedTime: post.date || undefined,
    },
  }
}

export default function JournalPost({ params }: { params: { slug: string } }) {
  const post = getPost(params.slug)
  if (!post) notFound()

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.excerpt,
    datePublished: post.date || undefined,
    author: { '@type': 'Person', name: SITE.name, url: SITE_URL },
    url: `${SITE_URL}/journal/${post.slug}`,
  }

  return (
    <main className="min-h-screen bg-ebony text-bone">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <header className="flex items-center justify-between px-6 md:px-12 py-8">
        <Link href="/journal" className="font-sans text-[0.6rem] tracking-[0.3em] uppercase text-silver/60 hover:text-bone transition-colors">
          ← Journal
        </Link>
        <Link href="/" className="font-sans text-[0.6rem] tracking-[0.3em] uppercase text-silver/60 hover:text-bone transition-colors">
          {SITE.name}
        </Link>
      </header>

      <article className="px-6 md:px-12 pt-10 pb-28 max-w-2xl mx-auto">
        <time className="font-sans text-[0.55rem] tracking-[0.3em] uppercase text-silver/40">
          {formatDate(post.date)}
        </time>
        <h1 className="font-serif text-[clamp(2.2rem,6vw,4.5rem)] leading-[1] italic text-bone mt-3" style={{ fontWeight: 300 }}>
          {post.title}
        </h1>

        <div className="prose-journal mt-12">
          <MDXRemote source={post.content} />
        </div>
      </article>
    </main>
  )
}

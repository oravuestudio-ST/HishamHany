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
    <main id="main" tabIndex={-1} className="min-h-screen bg-bg text-fg">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <article className="px-6 md:px-12 pt-36 pb-28 max-w-2xl mx-auto">
        <Link
          href="/journal"
          className="link-underline inline-block font-sans text-[0.6rem] tracking-[0.3em] uppercase text-silver hover:text-bone transition-colors mb-10"
        >
          ← Journal
        </Link>
        <br />
        <time className="font-sans text-[0.55rem] tracking-[0.3em] uppercase text-silver">
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

'use client'

import { useRef, useState } from 'react'
import type { RefObject } from 'react'
import Chapter from '@/components/home/Chapter'
import Lightbox from '@/components/case-study/Lightbox'
import type { ChapterData } from '@/lib/chapters'
import { useChapterScroll } from '@/hooks/useChapterScroll'

/**
 * The exhibition: an ordered list of full-screen scenes. Server-rendered and
 * legible as markup; useChapterScroll layers the motion on (and drives the
 * hero's exit, since chapter 1 is what rises over it).
 */
export default function ChapterJourney({
  chapters,
  heroRef,
}: {
  chapters: ChapterData[]
  heroRef?: RefObject<HTMLElement>
}) {
  const listRef = useRef<HTMLOListElement>(null)
  useChapterScroll(listRef, heroRef)
  const [viewer, setViewer] = useState<{ chapter: ChapterData; open: number } | null>(null)

  return (
    <section id="work" aria-labelledby="work-title" className="chapters stage-scope">
      <h2 id="work-title" className="sr-only">
        Selected work
      </h2>
      <ol ref={listRef} className="m-0 p-0">
        {chapters.map((chapter) => (
          <Chapter key={chapter.slug} chapter={chapter} onOpen={() => setViewer({ chapter, open: 0 })} />
        ))}
      </ol>
      <Lightbox
        images={viewer?.chapter.gallery ?? []}
        open={viewer?.open ?? null}
        title={viewer?.chapter.title ?? ''}
        onClose={() => setViewer(null)}
        onNavigate={(open) => setViewer((v) => v && { ...v, open })}
      />
    </section>
  )
}

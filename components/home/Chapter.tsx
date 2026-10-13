import Image from 'next/image'
import type { CSSProperties } from 'react'
import Viewfinder from '@/components/Viewfinder'
import type { ChapterData } from '@/lib/chapters'
import { CHAPTER } from '@/lib/motion'

/**
 * One scene of the exhibition. Pure markup — fully legible as rendered
 * (no JS, reduced motion, phones); useChapterScroll adds the motion on top.
 *
 * The title's anchor stretches over the whole stage (`.stretched-link`), so
 * the scene is one link and one tab stop. Its ::after resolves against the
 * nearest positioned/transformed ancestor — `.scene-recede`, which spans the
 * stage — so nothing between the two may be positioned.
 */
export default function Chapter({ chapter }: { chapter: ChapterData }) {
  const { slug, composition } = chapter
  const titleId = `chapter-${slug}-title`
  const ratio = chapter.image.w / chapter.image.h
  const bleed = composition === 'bleed'

  return (
    <li
      className="chapter list-none"
      id={`chapter-${slug}`}
      data-composition={composition}
      style={{ '--hold': `${chapter.hold}vh` } as CSSProperties}
    >
      <article aria-labelledby={titleId} data-scene="chapter" className="chapter-stage stage-scope relative md:min-h-[100svh]">
        <div className="scene-recede relative h-full w-full md:min-h-[100svh]">
          {bleed ? (
            <BleedScene chapter={chapter} titleId={titleId} />
          ) : (
            <div
              className={`flex h-full flex-col justify-center gap-stack px-gutter py-section-sm md:min-h-[100svh] md:items-center md:gap-[6vw] ${
                chapter.side === 'right' ? 'md:flex-row-reverse' : 'md:flex-row'
              }`}
            >
              <figure
                className="chapter-plate relative w-full shrink-0 self-center md:w-[var(--plate-w)]"
                data-composition={composition}
                data-morph-source={chapter.morph ? slug : undefined}
                style={{
                  // Phones: full width at the photo's own ratio. From md: the
                  // shared eye-line (hung) or the tall plate (portrait).
                  '--plate-w': composition === 'portrait'
                    ? `min(46vw, calc(${CHAPTER.portraitHeight}svh * ${ratio.toFixed(4)}))`
                    : `min(${CHAPTER.hangMaxWidth}vw, calc(${CHAPTER.hangHeight}svh * ${ratio.toFixed(4)}))`,
                  aspectRatio: `${chapter.image.w} / ${chapter.image.h}`,
                  // Dense screens: never stretch a source past ~1.25× its pixels.
                  '--plate-max': `${Math.round((chapter.image.w / 2) * 1.25)}px`,
                } as CSSProperties}
              >
                <PlateImage chapter={chapter} />
                {composition === 'hung' && <Viewfinder className="chapter-brackets" />}
              </figure>
              <ChapterCopy chapter={chapter} titleId={titleId} />
            </div>
          )}
          <div className="scene-dim absolute inset-0 bg-ink opacity-0 pointer-events-none" aria-hidden="true" />
        </div>
      </article>
    </li>
  )
}

function BleedScene({ chapter, titleId }: { chapter: ChapterData; titleId: string }) {
  const top = chapter.copyZone === 'top-left'
  return (
    <>
      {/* Phones: a full-width plate at the photo's own ratio with the copy
          below — a landscape cropped to a portrait screen would show only a
          sliver of it. From md the plate fills the stage. */}
      <figure
        className="chapter-plate relative w-full md:absolute md:inset-0"
        data-composition="bleed"
        data-morph-source={chapter.morph ? chapter.slug : undefined}
        style={{ '--bleed-ratio': `${chapter.image.w} / ${chapter.image.h}` } as CSSProperties}
      >
        <div className="aspect-[var(--bleed-ratio)] md:hidden" aria-hidden="true" />
        <PlateImage chapter={chapter} />
      </figure>
      {/* Static scrim under the copy's zone — chosen per photograph. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none hidden md:block"
        style={{
          background: top
            ? 'linear-gradient(165deg, rgb(var(--ink-rgb) / 0.8) 0%, rgb(var(--ink-rgb) / 0.45) 32%, rgb(var(--ink-rgb) / 0) 60%)'
            : 'linear-gradient(15deg, rgb(var(--ink-rgb) / 0.82) 0%, rgb(var(--ink-rgb) / 0.45) 34%, rgb(var(--ink-rgb) / 0) 62%)',
        }}
      />
      <div className={`flex h-full flex-col px-gutter py-section-sm md:min-h-[100svh] ${top ? 'md:justify-start md:pt-[max(7.5rem,16svh)]' : 'md:justify-end'}`}>
        <ChapterCopy chapter={chapter} titleId={titleId} large />
      </div>
    </>
  )
}

function PlateImage({ chapter }: { chapter: ChapterData }) {
  return (
    <div className="plate-clip absolute inset-0 overflow-hidden">
      <Image
        src={chapter.image.src}
        alt={chapter.image.alt}
        fill
        sizes={chapter.sizes}
        quality={75}
        className="plate-img object-cover object-center"
      />
    </div>
  )
}

function ChapterCopy({ chapter, titleId, large = false }: { chapter: ChapterData; titleId: string; large?: boolean }) {
  return (
    <div className="chapter-copy max-w-[34rem] text-paper">
      <h3 id={titleId} className={`normal-case font-serif ${large ? 'text-display-lg' : 'text-display'}`} style={{ letterSpacing: '-0.03em', lineHeight: 0.92 }}>
        <a
          href={chapter.href}
          className="stretched-link"
          data-cursor="View"
          data-morph-slug={chapter.morph ? chapter.slug : undefined}
        >
          <span className="chapter-mask block overflow-hidden pb-[0.06em]">
            <span className="chapter-line block">{chapter.title}</span>
          </span>
          {/* Titles repeat across a client's projects — the subtitle makes the
              link's purpose unambiguous to assistive tech. */}
          {chapter.subtitle && <span className="sr-only">, {chapter.subtitle}</span>}
        </a>
      </h3>
      {chapter.subtitle && (
        <p className="chapter-fade mt-3 font-serif italic text-display-sm text-paper/80" style={{ lineHeight: 1.1 }}>
          {chapter.subtitle}
        </p>
      )}
      <dl className="chapter-fade mt-6 flex flex-wrap gap-x-8 gap-y-1 font-sans text-body-sm text-paper/70">
        <div>
          <dt className="sr-only">Discipline</dt>
          <dd>{chapter.category}</dd>
        </div>
        <div>
          <dt className="sr-only">{chapter.creditLabel}</dt>
          <dd>{chapter.credit}</dd>
        </div>
        <div>
          <dt className="sr-only">Year</dt>
          <dd>{chapter.year}</dd>
        </div>
      </dl>
      <span aria-hidden="true" className="chapter-fade chapter-cta mt-8 inline-flex items-center gap-4 font-sans text-body-sm text-paper">
        View project
        <span className="chapter-cta-rule block h-px w-10 bg-paper/40" />
      </span>
    </div>
  )
}

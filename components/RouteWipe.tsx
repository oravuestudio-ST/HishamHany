'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { wipeTo } from '@/animations/transitions'

/**
 * Gives the mask-wipe transition its exit phase. Next's app router has no
 * native route-exit hook, so this intercepts internal link clicks at the
 * document capture phase (which runs before React's own delegated handlers —
 * preventDefault() makes next/link's onClick bail), plays the cover sweep,
 * then pushes. The incoming template lifts the surface (see app/template.tsx).
 *
 * Skipped: modified clicks, external/blank/download links, hash jumps, and
 * same-path clicks. Back/forward navigations bypass this entirely and enter
 * with the template's plain fade.
 */
export default function RouteWipe() {
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0) return
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return

      const anchor = (e.target as HTMLElement).closest?.('a[href]')
      if (!anchor) return
      const href = anchor.getAttribute('href')
      if (!href || !href.startsWith('/')) return
      if (anchor.getAttribute('target') === '_blank' || anchor.hasAttribute('download')) return

      const [path] = href.split('#')
      if (href.includes('#') && (path === '' || path === pathname)) return
      if (path === pathname) return

      e.preventDefault()
      wipeTo(() => router.push(href))
    }

    document.addEventListener('click', onClick, true)
    return () => document.removeEventListener('click', onClick, true)
  }, [router, pathname])

  return null
}

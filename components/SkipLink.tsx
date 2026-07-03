'use client'

/**
 * First focusable element on every page — moves focus (not just scroll)
 * into the main content, which fragment navigation alone doesn't guarantee
 * across browsers.
 */
export default function SkipLink() {
  return (
    <a
      href="#main"
      className="skip-link"
      onClick={(e) => {
        e.preventDefault()
        const main = document.getElementById('main')
        if (main) {
          main.focus({ preventScroll: true })
          main.scrollIntoView()
        }
      }}
    >
      Skip to content
    </a>
  )
}

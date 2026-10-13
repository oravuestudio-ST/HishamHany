/**
 * Viewfinder corner brackets — the site's one camera motif (award brief A3).
 * Pure markup; geometry lives in globals.css (.viewfinder) so the loader
 * window and the hung plates share exactly one bracket.
 */
export default function Viewfinder({ className = '' }: { className?: string }) {
  return (
    <div className={`viewfinder ${className}`} aria-hidden="true">
      <span />
      <span />
      <span />
      <span />
    </div>
  )
}

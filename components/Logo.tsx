interface LogoProps {
  className?: string
  size?: number
}

export default function Logo({ className = '', size = 48 }: LogoProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 66"
      fill="none"
      width={size}
      height={size * 0.66}
      className={className}
      aria-label="Hisham Hany"
    >
      {/* Verticals */}
      <line x1="19" y1="13" x2="19" y2="53" stroke="currentColor" strokeWidth="2.2" />
      <line x1="50" y1="13" x2="50" y2="53" stroke="currentColor" strokeWidth="2.2" />
      <line x1="81" y1="13" x2="81" y2="53" stroke="currentColor" strokeWidth="2.2" />

      {/* Crossbar */}
      <line x1="19" y1="35" x2="81" y2="35" stroke="currentColor" strokeWidth="1.6" />

      {/* Left serifs */}
      <line x1="11" y1="13" x2="27" y2="13" stroke="currentColor" strokeWidth="2.2" />
      <line x1="11" y1="53" x2="27" y2="53" stroke="currentColor" strokeWidth="2.2" />

      {/* Middle serifs */}
      <line x1="42" y1="13" x2="58" y2="13" stroke="currentColor" strokeWidth="2.2" />
      <line x1="42" y1="53" x2="58" y2="53" stroke="currentColor" strokeWidth="2.2" />

      {/* Right serifs */}
      <line x1="73" y1="13" x2="89" y2="13" stroke="currentColor" strokeWidth="2.2" />
      <line x1="73" y1="53" x2="89" y2="53" stroke="currentColor" strokeWidth="2.2" />
    </svg>
  )
}

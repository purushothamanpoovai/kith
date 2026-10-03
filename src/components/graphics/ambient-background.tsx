/**
 * The page-wide ambient layer.
 *
 * Two very soft washes plus one fine-line lattice, all far below the contrast
 * of any content. The line work is desktop-only (§39). Geometry is abstract —
 * intersecting arcs and a square lattice — so it reads as ornament rather
 * than as any tradition's iconography (§6).
 */
export function AmbientBackground() {
  return (
    <div className="ds-ambient" aria-hidden>
      <svg
        className="ds-ambient__svg"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <radialGradient id="ambient-wash-a" cx="12%" cy="0%" r="60%">
            <stop
              offset="0%"
              stopColor="var(--ambient-wash)"
              stopOpacity="var(--ambient-opacity)"
            />
            <stop offset="100%" stopColor="var(--ambient-wash)" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="ambient-wash-b" cx="92%" cy="88%" r="55%">
            <stop
              offset="0%"
              stopColor="var(--ambient-wash)"
              stopOpacity="calc(var(--ambient-opacity) * 0.8)"
            />
            <stop offset="100%" stopColor="var(--ambient-wash)" stopOpacity="0" />
          </radialGradient>
          <pattern
            id="ambient-lattice"
            width="96"
            height="96"
            patternUnits="userSpaceOnUse"
          >
            <g
              fill="none"
              stroke="var(--ambient-line)"
              strokeWidth="0.7"
              opacity="var(--ambient-line-opacity)"
            >
              <path d="M0 48 A48 48 0 0 1 48 0 A48 48 0 0 1 96 48 A48 48 0 0 1 48 96 A48 48 0 0 1 0 48 Z" />
              <path d="M48 0 V96 M0 48 H96" />
            </g>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#ambient-wash-a)" />
        <rect width="100%" height="100%" fill="url(#ambient-wash-b)" />
        <rect
          className="ds-ambient__detail"
          width="100%"
          height="100%"
          fill="url(#ambient-lattice)"
        />
      </svg>
    </div>
  );
}

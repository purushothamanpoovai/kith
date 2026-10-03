import type { ThemePattern } from "@/domain/theme/theme-config";

/** Math.cos/sin aren't bit-identical across JS engines; round to avoid SSR hydration mismatches. */
function round(n: number): number {
  return Math.round(n * 1000) / 1000;
}

/**
 * The one place decorative pattern markup is defined (§7).
 *
 * Every family is abstract: lattice, waves, radiating lines, architectural
 * arches, a manuscript rule border, and an eight-fold bloom built from
 * circles. None depicts a religious symbol, so the same component is safe as
 * the global design language and is only *tinted* by a contextual theme (§6).
 */

type PatternProps = {
  /** Which family to draw. Resolved from a ContextTheme, never hard-coded. */
  pattern?: ThemePattern;
  /** 0–1. Kept low by default; the surrounding CSS clamps it further. */
  opacity?: number;
  /** Softens the pattern out towards the bottom or the inline end. */
  fade?: "block" | "inline" | "none";
  className?: string;
  /** Shows exactly one tile of the motif, scaled to fill the box, instead of
   *  tiling at the family's native pixel size — for a small preview swatch,
   *  where the native tile (64–128px) is larger than the whole container and
   *  would otherwise show only an unrecognisable fragment of one repeat. */
  singleTile?: boolean;
};

const TILE: Record<Exclude<ThemePattern, "none">, { size: number; body: React.ReactNode }> = {
  lattice: {
    size: 96,
    body: (
      <>
        <path d="M0 48 A48 48 0 0 1 48 0 A48 48 0 0 1 96 48 A48 48 0 0 1 48 96 A48 48 0 0 1 0 48 Z" />
        <path d="M48 0 V96 M0 48 H96" />
        <circle cx="48" cy="48" r="9" />
      </>
    ),
  },
  waves: {
    size: 120,
    body: (
      <>
        <path d="M0 30 Q30 6 60 30 T120 30" />
        <path d="M0 60 Q30 36 60 60 T120 60" />
        <path d="M0 90 Q30 66 60 90 T120 90" />
      </>
    ),
  },
  radiance: {
    size: 128,
    body: (
      <>
        <circle cx="64" cy="64" r="42" />
        <circle cx="64" cy="64" r="20" />
        {Array.from({ length: 12 }, (_, i) => {
          const angle = (i * Math.PI) / 6;
          return (
            <path
              key={i}
              d={`M${round(64 + Math.cos(angle) * 22)} ${round(64 + Math.sin(angle) * 22)}
                  L${round(64 + Math.cos(angle) * 58)} ${round(64 + Math.sin(angle) * 58)}`}
            />
          );
        })}
      </>
    ),
  },
  arch: {
    size: 88,
    body: (
      <>
        <path d="M8 88 V40 A36 36 0 0 1 80 40 V88" />
        <path d="M22 88 V44 A22 22 0 0 1 66 44 V88" />
        <path d="M0 88 H88" />
      </>
    ),
  },
  manuscript: {
    size: 64,
    body: (
      <>
        <path d="M0 8 H64 M0 56 H64" />
        <path d="M8 8 V56 M56 8 V56" />
        <path d="M32 20 L44 32 L32 44 L20 32 Z" />
      </>
    ),
  },
  bloom: {
    size: 112,
    body: (
      <>
        {Array.from({ length: 8 }, (_, i) => {
          const angle = (i * Math.PI) / 4;
          return (
            <circle
              key={i}
              cx={round(56 + Math.cos(angle) * 22)}
              cy={round(56 + Math.sin(angle) * 22)}
              r="22"
            />
          );
        })}
      </>
    ),
  },
};

export function DecorativePattern({
  pattern = "lattice",
  opacity = 0.08,
  fade = "block",
  className,
  singleTile = false,
}: PatternProps) {
  if (pattern === "none") return null;

  const tile = TILE[pattern];
  const id = `pattern-${pattern}`;
  const fadeClass =
    fade === "block"
      ? "ds-pattern--fade"
      : fade === "inline"
        ? "ds-pattern--fade-inline"
        : "";

  return (
    <div
      className={["ds-pattern", fadeClass, className].filter(Boolean).join(" ")}
      style={{ ["--ds-pattern-opacity" as string]: opacity }}
      aria-hidden
    >
      {singleTile ? (
        // A viewBox matching the tile's own native units scales that single
        // repeat to fill the box exactly, rather than tiling it at native
        // pixel size — the right shape for a small preview swatch.
        <svg xmlns="http://www.w3.org/2000/svg" viewBox={`0 0 ${tile.size} ${tile.size}`}>
          <g fill="none" stroke="currentColor" strokeWidth="1.6">
            {tile.body}
          </g>
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern
              id={id}
              width={tile.size}
              height={tile.size}
              patternUnits="userSpaceOnUse"
            >
              <g fill="none" stroke="currentColor" strokeWidth="0.8">
                {tile.body}
              </g>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill={`url(#${id})`} />
        </svg>
      )}
    </div>
  );
}

/**
 * A single fine-line corner flourish. Desktop only, and never more than one
 * per corner — a frame of ornaments would read as a wedding invitation (§2).
 */
export function Ornament({
  corner = "tl",
  size = 72,
}: {
  corner?: "tl" | "br";
  size?: number;
}) {
  return (
    <svg
      className={`ds-ornament ds-ornament--${corner}`}
      width={size}
      height={size}
      viewBox="0 0 72 72"
      fill="none"
      stroke="currentColor"
      strokeWidth="1"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path d="M0 24 A24 24 0 0 0 24 0" />
      <path d="M0 40 A40 40 0 0 0 40 0" />
      <path d="M10 10 L18 18" />
      <circle cx="24" cy="24" r="2.5" />
    </svg>
  );
}

/** A centred rule with a small diamond — closes a section without a heading. */
export function SectionDivider({ label }: { label?: string }) {
  return (
    <div className="ds-divider" role="presentation">
      {label ? (
        <span className="ds-eyebrow ds-caps" style={{ margin: 0 }}>
          {label}
        </span>
      ) : (
        <svg
          className="ds-divider__mark"
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          aria-hidden
        >
          <path d="M7 1 L13 7 L7 13 L1 7 Z" />
        </svg>
      )}
    </div>
  );
}

import type { CSSProperties } from "react";

/**
 * Generated cover art.
 *
 * Content in this platform frequently has no photograph, so a cover has to be
 * synthesised. Two rules follow from the design directive:
 *
 *  - It must not be one motif recoloured. Eight genuinely different abstract
 *    compositions are seeded from the content id, so a grid of cards does not
 *    read as the same picture eight times (§29).
 *  - It must carry no religious iconography, because these covers are the
 *    platform's default imagery on every surface (§6). All eight are drawn
 *    from arcs, lattices, horizons, rosettes and architectural rhythm.
 */

type Palette = {
  base: string;
  figure: string;
  light: string;
};

/** Covers follow the active accent. Composition still varies by seed. */
const THEMED: Palette = {
  base: "var(--cover-base)",
  figure: "var(--cover-figure)",
  light: "var(--cover-light)",
};

const COMPOSITIONS = [
  "arcs",
  "lattice",
  "horizon",
  "rosette",
  "rays",
  "colonnade",
  "waves",
  "folio",
] as const;

type Composition = (typeof COMPOSITIONS)[number];

/**
 * Math.cos/Math.sin aren't guaranteed bit-identical across JS engines, so
 * baking their full precision into SVG attributes causes SSR/client
 * hydration mismatches. Rounding is invisible in decorative art but keeps
 * server and client markup byte-identical.
 */
function round(n: number): number {
  return Math.round(n * 1000) / 1000;
}

function hashSeed(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function coverPalette(_seed: string): Palette {
  return THEMED;
}

/** A second, independent draw so palette and composition don't move together. */
function coverComposition(seed: string): Composition {
  return COMPOSITIONS[hashSeed(`${seed}::form`) % COMPOSITIONS.length];
}

const W = 400;
const H = 260;

function Figure({ kind, p }: { kind: Composition; p: Palette }) {
  const stroke = { fill: "none", stroke: p.figure, strokeWidth: 1.4 } as const;
  const strokeLight = { fill: "none", stroke: p.light, strokeWidth: 1 } as const;

  switch (kind) {
    case "arcs":
      return (
        <g>
          {[70, 120, 170, 220, 270].map((r, i) => (
            <circle
              key={r}
              cx={40}
              cy={H + 20}
              r={r}
              {...(i % 2 ? strokeLight : stroke)}
              opacity={0.5 - i * 0.06}
            />
          ))}
          <circle cx={300} cy={70} r={26} fill={p.light} opacity={0.14} />
        </g>
      );

    case "lattice":
      return (
        <g>
          {Array.from({ length: 6 }, (_, row) =>
            Array.from({ length: 9 }, (_, col) => (
              <circle
                key={`${row}-${col}`}
                cx={col * 50 + 10}
                cy={row * 50 + 15}
                r={26}
                {...stroke}
                opacity={0.28}
              />
            )),
          )}
          <rect
            x={0}
            y={0}
            width={W}
            height={H}
            fill="none"
            stroke={p.light}
            strokeWidth={0.8}
            opacity={0.25}
          />
        </g>
      );

    case "horizon":
      return (
        <g>
          <path
            d={`M0 190 Q100 150 200 178 T400 160 L400 ${H} L0 ${H} Z`}
            fill={p.figure}
            opacity={0.34}
          />
          <path
            d={`M0 214 Q120 182 240 206 T400 194 L400 ${H} L0 ${H} Z`}
            fill={p.light}
            opacity={0.14}
          />
          <circle cx={296} cy={78} r={30} fill={p.light} opacity={0.2} />
          <circle cx={296} cy={78} r={46} {...strokeLight} opacity={0.3} />
        </g>
      );

    case "rosette":
      return (
        <g transform={`translate(${W / 2} ${H / 2})`}>
          {Array.from({ length: 8 }, (_, i) => {
            const a = (i * Math.PI) / 4;
            return (
              <circle
                key={i}
                cx={round(Math.cos(a) * 42)}
                cy={round(Math.sin(a) * 42)}
                r={42}
                {...stroke}
                opacity={0.3}
              />
            );
          })}
          <circle r={42} {...strokeLight} opacity={0.4} />
          <circle r={5} fill={p.light} opacity={0.5} />
        </g>
      );

    case "rays":
      return (
        <g>
          {Array.from({ length: 18 }, (_, i) => {
            const a = (i * Math.PI) / 17 - Math.PI / 2;
            return (
              <path
                key={i}
                d={`M300 ${-30} L${round(300 + Math.cos(a) * 420)} ${round(-30 + Math.sin(a) * 420)}`}
                stroke={p.figure}
                strokeWidth={1}
                opacity={0.22}
              />
            );
          })}
          <path
            d={`M0 200 Q200 168 400 208 L400 ${H} L0 ${H} Z`}
            fill={p.figure}
            opacity={0.3}
          />
        </g>
      );

    case "colonnade":
      return (
        <g>
          {Array.from({ length: 5 }, (_, i) => {
            const x = 34 + i * 84;
            return (
              <g key={i}>
                <path d={`M${x} ${H} V120 A26 26 0 0 1 ${x + 52} 120 V${H}`} {...stroke} opacity={0.4} />
                <path d={`M${x + 12} ${H} V128 A14 14 0 0 1 ${x + 40} 128 V${H}`} {...strokeLight} opacity={0.22} />
              </g>
            );
          })}
          <path d={`M0 ${H - 14} H${W}`} stroke={p.light} strokeWidth={1.2} opacity={0.3} />
        </g>
      );

    case "waves":
      return (
        <g>
          {Array.from({ length: 7 }, (_, i) => (
            <path
              key={i}
              d={`M-20 ${52 + i * 30} Q60 ${28 + i * 30} 140 ${52 + i * 30} T300 ${52 + i * 30} T460 ${52 + i * 30}`}
              {...(i % 2 ? strokeLight : stroke)}
              opacity={0.34 - i * 0.02}
            />
          ))}
        </g>
      );

    case "folio":
    default:
      return (
        <g>
          <rect x={30} y={26} width={W - 60} height={H - 52} {...stroke} opacity={0.45} />
          <rect x={38} y={34} width={W - 76} height={H - 68} {...strokeLight} opacity={0.22} />
          {Array.from({ length: 7 }, (_, i) => (
            <path
              key={i}
              d={`M62 ${64 + i * 22} H${W - 96}`}
              stroke={p.light}
              strokeWidth={2.5}
              opacity={0.12}
            />
          ))}
          <path d={`M200 40 L212 52 L200 64 L188 52 Z`} fill={p.light} opacity={0.3} />
        </g>
      );
  }
}

export function CoverArtSvg({
  seed,
  className,
}: {
  seed: string;
  className?: string;
}) {
  const p = THEMED;
  const kind = coverComposition(seed);
  const id = `cv${hashSeed(seed)}`;
  const tint = hashSeed(`${seed}::tint`) % 3;

  return (
    <svg
      className={className}
      data-tint={tint}
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMid slice"
      xmlns="http://www.w3.org/2000/svg"
      role="presentation"
      aria-hidden
    >
      <defs>
        <linearGradient id={`${id}-bg`} x1="0%" y1="0%" x2="70%" y2="100%">
          <stop offset="0%" stopColor={p.base} />
          <stop offset="100%" stopColor={p.figure} stopOpacity="0.55" />
        </linearGradient>
      </defs>
      <rect width={W} height={H} fill={`url(#${id}-bg)`} />
      <Figure kind={kind} p={p} />
    </svg>
  );
}

/** Solid colour for skeletons and image placeholders while art is loading. */
export function coverArtStyle(_seed: string): CSSProperties {
  return { backgroundColor: "var(--cover-base)" };
}

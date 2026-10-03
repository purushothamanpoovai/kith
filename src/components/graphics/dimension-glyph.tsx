import type { ScopeType } from "@/generated/prisma/client";

/**
 * A small abstract mark for each Explore dimension tile (§23).
 *
 * Same visual family as `DecorativePattern`/`Ornament` — thin `currentColor`
 * line art, no fill, no religious iconography (§6, §44): a sunburst stands
 * for "religion" as a category, not for any one faith's actual symbol. Drawn
 * at icon scale rather than tiled, since a background pattern reads as
 * texture at this size but a glyph needs to read as a mark.
 */

export type DimensionKind = ScopeType | "organization";

const GLYPH: Record<DimensionKind, React.ReactNode> = {
  // Religion — a radiating sunburst: many rays from one centre, standing for
  // "a religious family" as a category, not any one faith's own emblem.
  religion: (
    <>
      <circle cx="12" cy="12" r="4" />
      {Array.from({ length: 8 }, (_, i) => {
        const angle = (i * Math.PI) / 4;
        const x1 = 12 + Math.cos(angle) * 6.5;
        const y1 = 12 + Math.sin(angle) * 6.5;
        const x2 = 12 + Math.cos(angle) * 10.5;
        const y2 = 12 + Math.sin(angle) * 10.5;
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} />;
      })}
    </>
  ),
  // Tradition — a branching lineage: one trunk forking into several lines,
  // standing for a tradition growing out of and within a wider religion.
  tradition: (
    <>
      <path d="M12 21 V13" />
      <path d="M12 13 L6 5" />
      <path d="M12 13 L12 4" />
      <path d="M12 13 L18 5" />
      <circle cx="6" cy="5" r="1.4" />
      <circle cx="12" cy="4" r="1.4" />
      <circle cx="18" cy="5" r="1.4" />
    </>
  ),
  // Sacred entity — an eight-petal bloom, the same family `DecorativePattern`
  // calls "bloom": a figure honoured within a tradition, drawn as a flower
  // rather than any specific iconographic form.
  sacred_entity: (
    <>
      {Array.from({ length: 8 }, (_, i) => {
        const angle = (i * Math.PI) / 4;
        const cx = 12 + Math.cos(angle) * 4.4;
        const cy = 12 + Math.sin(angle) * 4.4;
        return <circle key={i} cx={cx} cy={cy} r="4" />;
      })}
    </>
  ),
  // Topic — an open book: two pages meeting at a spine, standing for a
  // theme explored across many pieces of writing.
  topic: (
    <>
      <path d="M12 5 C9.5 3.3 6 3 3 4 V18 C6 17 9.5 17.3 12 19" />
      <path d="M12 5 C14.5 3.3 18 3 21 4 V18 C18 17 14.5 17.3 12 19" />
      <path d="M12 5 V19" />
    </>
  ),
  // Region — a simple compass rose: the plain navigational mark for "place",
  // not a map of anywhere specific.
  region: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 3 V6 M12 18 V21 M3 12 H6 M18 12 H21" />
      <path d="M12 7 L14 12 L12 17 L10 12 Z" />
    </>
  ),
  // Language — two overlapping speech marks, standing for conversation
  // between languages rather than any one script.
  language: (
    <>
      <path d="M3 6 H14 V14 H8 L4.5 17 V14 H3 Z" />
      <path d="M11 10 H20 V17 H16.5 V20 L13 17 H11 Z" />
    </>
  ),
  // Sacred place — a plain post-and-lintel gate: architecture in the most
  // generic sense (two uprights, one crossbeam), not any one faith's
  // building style.
  organization: (
    <>
      <path d="M4 20 V9 M20 20 V9" />
      <path d="M3 9 H21" />
      <path d="M3 9 L12 3 L21 9" />
      <path d="M9 20 V13 H15 V20" />
    </>
  ),
  // Unused by the Explore dimension index today, kept for completeness so
  // this map stays total over ScopeType rather than needing a fallback.
  sacred_text: (
    <>
      <rect x="5" y="3" width="14" height="18" rx="1" />
      <path d="M8 8 H16 M8 12 H16 M8 16 H13" />
    </>
  ),
  festival: (
    <>
      <path d="M12 3 V12" />
      {Array.from({ length: 6 }, (_, i) => {
        const angle = (i * Math.PI) / 3;
        const x1 = 12 + Math.cos(angle) * 4;
        const y1 = 12 + Math.sin(angle) * 4;
        const x2 = 12 + Math.cos(angle) * 9;
        const y2 = 12 + Math.sin(angle) * 9;
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} />;
      })}
    </>
  ),
  community: (
    <>
      <circle cx="8" cy="9" r="3" />
      <circle cx="16" cy="9" r="3" />
      <path d="M2 20 C2 15.5 5 13 8 13 C11 13 14 15.5 14 20" />
      <path d="M12 20 C12 15.8 14.5 13.6 16.5 13.6 C19 13.6 22 16 22 20" />
    </>
  ),
  cultural_group: (
    <>
      <path d="M4 19 C4 12 8 8 12 8 C16 8 20 12 20 19" />
      <path d="M8 19 V14 M12 19 V11 M16 19 V14" />
    </>
  ),
};

export function DimensionGlyph({
  kind,
  size = 22,
  className,
}: {
  kind: DimensionKind;
  size?: number;
  className?: string;
}) {
  const body = GLYPH[kind];
  if (!body) return null;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      {body}
    </svg>
  );
}

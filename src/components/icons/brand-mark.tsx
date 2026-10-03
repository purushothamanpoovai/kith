/**
 * The brand mark.
 *
 * A fine-line seal: two concentric rings, an eight-fold rosette built from
 * arcs, and a centre point. It reads as an emblem or a colophon — the
 * vocabulary of an archive — and deliberately depicts nothing. The previous
 * mark was a filled lotus petal that read as a flame, which is exactly the
 * kind of tradition-specific imagery the global design language must avoid
 * (§6).
 */
/** Math.cos/sin aren't bit-identical across JS engines; round to avoid SSR hydration mismatches. */
function round(n: number): number {
  return Math.round(n * 1000) / 1000;
}

export function BrandMark({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="26"
      height="26"
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <circle cx="24" cy="24" r="22" strokeWidth="1.25" opacity="0.35" />
      <circle cx="24" cy="24" r="17" strokeWidth="1.25" opacity="0.9" />
      {Array.from({ length: 8 }, (_, i) => {
        const a = (i * Math.PI) / 4;
        return (
          <circle
            key={i}
            cx={round(24 + Math.cos(a) * 8.5)}
            cy={round(24 + Math.sin(a) * 8.5)}
            r="8.5"
            strokeWidth="1"
            opacity="0.5"
          />
        );
      })}
      <circle cx="24" cy="24" r="2.75" fill="currentColor" stroke="none" />
    </svg>
  );
}

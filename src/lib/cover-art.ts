import type { CSSProperties } from "react";

const COVER_GRADIENTS = [
  "linear-gradient(145deg, var(--cover-base) 0%, var(--cover-figure) 48%, var(--cover-light) 100%)",
  "linear-gradient(160deg, var(--text-primary) 0%, var(--accent) 52%, var(--accent-soft) 100%)",
  "linear-gradient(125deg, var(--editorial) 0%, var(--accent) 50%, var(--accent-soft) 100%)",
  "linear-gradient(180deg, var(--cover-base) 0%, var(--accent) 100%)",
  "linear-gradient(210deg, var(--accent) 0%, var(--editorial) 45%, var(--accent-soft) 100%)",
  "linear-gradient(90deg, var(--text-primary) 0%, var(--cover-figure) 60%, var(--cover-light) 100%)",
] as const;

function hashSeed(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function coverGradient(seed: string): string {
  return COVER_GRADIENTS[hashSeed(seed) % COVER_GRADIENTS.length];
}

export function coverStyle(
  coverImage: string | null | undefined,
  seed: string,
): CSSProperties {
  const gradient = coverGradient(seed);
  if (coverImage) {
    return {
      backgroundImage: `${gradient}, url(${coverImage})`,
      backgroundSize: "cover",
      backgroundPosition: "center",
    };
  }
  return { backgroundImage: gradient };
}

export function authorInitials(name: string | null | undefined): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`.toUpperCase();
}

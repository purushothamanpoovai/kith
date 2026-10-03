import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";

/**
 * The section header used across Home, Explore, scope and organization pages.
 *
 * Takes an explicit heading level so pages keep a valid outline — the audit
 * found routes jumping straight from h1 to h3 (§38). The rule under the title
 * is a hairline in the editorial accent, not a heavy 2px bar.
 */
export function SectionHeader({
  title,
  kicker,
  lede,
  link,
  id,
  as: Heading = "h2",
}: {
  title: string;
  kicker?: string;
  lede?: string;
  link?: { href: string; label: string };
  /** Needed when the section uses aria-labelledby. */
  id?: string;
  as?: "h2" | "h3" | "h4";
}) {
  return (
    <header className="ds-section-head">
      <div className="ds-section-head__text">
        {kicker ? <span className="ds-kicker ds-caps">{kicker}</span> : null}
        <Heading className="ds-section-head__title" id={id}>
          {title}
        </Heading>
        {lede ? <p className="ds-section-head__lede">{lede}</p> : null}
      </div>
      {link ? (
        <Link className="ds-text-link" href={link.href}>
          {link.label}
          <ArrowRight size={13} strokeWidth={2} aria-hidden className="ds-flip-rtl" />
        </Link>
      ) : null}
    </header>
  );
}

/**
 * A section that only renders when it has something to show — scope and
 * organization pages must not display empty placeholder sections (§24).
 */
/** Exported so a caller can link straight to a section by the same title it
 *  will render with, without duplicating the slugify rule (see explore-hub.tsx,
 *  which points its dimension-index tiles at these ids instead of navigating
 *  to a whole new page for content already on the current one). */
export function sectionDomId(title: string): string {
  const slug = title
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "");
  if (slug) return `sec-${slug}`;
  let hash = 0;
  for (const char of title) hash = (hash * 31 + char.charCodeAt(0)) | 0;
  return `sec-${Math.abs(hash).toString(36)}`;
}

export function Section({
  title,
  kicker,
  lede,
  link,
  as,
  children,
  className,
}: {
  title: string;
  kicker?: string;
  lede?: string;
  link?: { href: string; label: string };
  as?: "h2" | "h3" | "h4";
  children: ReactNode;
  className?: string;
}) {
  const id = sectionDomId(title);
  return (
    <section
      className={["ds-section", className].filter(Boolean).join(" ")}
      aria-labelledby={id}
    >
      <SectionHeader
        title={title}
        kicker={kicker}
        lede={lede}
        link={link}
        as={as}
        id={id}
      />
      {children}
    </section>
  );
}

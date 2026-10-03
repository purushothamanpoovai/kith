import type { ReactNode } from "react";
import { DecorativePattern } from "@/components/graphics/decorative-pattern";

type Props = {
  title: string;
  /** A short line under the title explaining what this page is for. */
  lede?: string;
  children: ReactNode;
};

/**
 * The sign-in / register surface.
 *
 * A single centred card on the ambient ground rather than a bare column: an
 * auth page is the one screen a reader meets before any content, so it carries
 * the same pattern-and-hairline language as the rest of the site (§6) instead
 * of reading as an unstyled form.
 */
export function AuthPage({ title, lede, children }: Props) {
  return (
    <article className="ds-auth-page">
      <div className="ds-auth-page__inner">
        <DecorativePattern pattern="bloom" opacity={0.05} fade="block" />
        <header className="ds-auth-page__head">
          <h1 className="ds-auth-page__title">{title}</h1>
          {lede ? <p className="ds-auth-page__lede">{lede}</p> : null}
        </header>
        {children}
      </div>
    </article>
  );
}

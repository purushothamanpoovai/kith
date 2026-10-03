import sanitizeHtml from "sanitize-html";

/**
 * Article HTML sanitisation.
 *
 * Rich-text bodies are stored as HTML, which means the stored value is
 * attacker-controlled markup that ends up in `dangerouslySetInnerHTML`. This
 * module is the single chokepoint that makes that safe, and it is applied
 * TWICE by design (defence in depth):
 *
 *   - on write, so the database never knowingly holds hostile markup;
 *   - on render, so a row that arrived by any other path (an older migration,
 *     a direct SQL edit, a future action that forgets to sanitise) still
 *     cannot execute script in a reader's browser.
 *
 * The policy is an allowlist: anything not named here is dropped. That is the
 * only safe direction — a denylist of "bad" tags is always incomplete.
 *
 * Specifically defended against:
 *   - <script>, <style>, <iframe>, <object>, <form> and friends — not allowed.
 *   - on* handlers (onclick, onerror, …) — no `on*` attribute is allowed.
 *   - `javascript:` and `data:` URLs — only http/https/mailto survive, so
 *     `<a href="javascript:...">` and `<img src="data:text/html,...">` die.
 *   - CSS injection via style="" — style is allowed only on a few tags and
 *     only for a fixed set of properties matched against strict patterns,
 *     so `style="background:url(javascript:…)"` or `expression()` cannot pass.
 *   - <svg> — excluded entirely; SVG can carry script. (The upload validator
 *     in lib/media/validate-upload.ts refuses .svg files for the same reason.)
 */

/** Colours the editor may set: hex, rgb()/rgba(), or a bare CSS keyword. */
const COLOR_PATTERN = [
  /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/,
  /^rgba?\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*(?:,\s*(?:0|1|0?\.\d+)\s*)?\)$/,
  /^[a-zA-Z]{3,20}$/,
];

/** Font sizes are constrained to the design system's own scale. */
const FONT_SIZE_PATTERN = [/^var\(--ds-text-(?:2xs|xs|sm|base|lg|xl|2xl|3xl)\)$/];

const TEXT_ALIGN_PATTERN = [/^(?:start|end|center|justify|left|right)$/];

export const ARTICLE_HTML_POLICY: sanitizeHtml.IOptions = {
  allowedTags: [
    "p",
    "br",
    "h2",
    "h3",
    "h4",
    "strong",
    "b",
    "em",
    "i",
    "u",
    "s",
    "mark",
    "sub",
    "sup",
    "blockquote",
    "ul",
    "ol",
    "li",
    "a",
    "img",
    "figure",
    "figcaption",
    "hr",
    "code",
    "pre",
    "span",
    "div",
  ],
  allowedAttributes: {
    a: ["href", "title", "target", "rel"],
    img: ["src", "alt", "title", "width", "height", "loading", "decoding"],
    // `style` is permitted only where the editor actually emits it, and the
    // allowedStyles map below constrains it to safe properties/values.
    p: ["style", "dir", "lang"],
    span: ["style", "dir", "lang"],
    h2: ["style", "dir", "lang"],
    h3: ["style", "dir", "lang"],
    h4: ["style", "dir", "lang"],
    li: ["style", "dir", "lang"],
    blockquote: ["style", "dir", "lang", "cite"],
    div: ["dir", "lang"],
    figure: ["class"],
    figcaption: ["dir", "lang"],
  },
  allowedStyles: {
    "*": {
      color: COLOR_PATTERN,
      "background-color": COLOR_PATTERN,
      "font-size": FONT_SIZE_PATTERN,
      "text-align": TEXT_ALIGN_PATTERN,
    },
  },
  // Only these URL schemes survive; everything else (javascript:, data:,
  // vbscript:, file:) is stripped from the attribute.
  allowedSchemes: ["http", "https", "mailto"],
  allowedSchemesByTag: {
    // Images may additionally be same-origin relative paths, which
    // allowProtocolRelative:false + this list keeps safe.
    img: ["http", "https"],
  },
  allowProtocolRelative: false,
  // Anything not in allowedTags has its markup removed. `discardEntirely`
  // also drops the *contents* of these, so a stripped <script> cannot leave
  // its source code behind as visible text.
  nonTextTags: ["script", "style", "textarea", "option", "noscript", "iframe"],
  // Every external link is made safe against reverse-tabnabbing.
  transformTags: {
    a: (tagName, attribs) => {
      const href = attribs.href ?? "";
      const external = /^https?:\/\//i.test(href);
      return {
        tagName: "a",
        attribs: {
          ...attribs,
          ...(external
            ? { target: "_blank", rel: "noopener noreferrer nofollow" }
            : {}),
        },
      };
    },
  },
  // Keep the output tidy and predictable.
  allowedClasses: {
    figure: [
      "ds-figure",
      "ds-figure--small",
      "ds-figure--wide",
      "ds-figure--align-left",
      "ds-figure--align-right",
      "ds-figure--align-center",
    ],
  },
};

/**
 * Sanitises an article body. Safe to call on already-sanitised HTML — the
 * operation is idempotent, which is what makes double-sanitising free.
 */
export function sanitizeArticleHtml(dirty: string): string {
  if (!dirty) return "";
  return sanitizeHtml(dirty, ARTICLE_HTML_POLICY);
}

/**
 * Strips ALL markup, for deriving a plain-text summary/search blob from a
 * rich body. Entities are decoded so the result reads as prose.
 */
export function htmlToPlainText(html: string): string {
  if (!html) return "";
  const text = sanitizeHtml(html, { allowedTags: [], allowedAttributes: {} });
  return text.replace(/\s+/g, " ").trim();
}

/** Rough reading time, used to fill Content.readingMinutes. */
export function estimateReadingMinutes(html: string): number {
  const words = htmlToPlainText(html).split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

/** Top-level block tags a sanitised article body is built from (§ARTICLE_HTML_POLICY). */
const TOP_LEVEL_BLOCK = /<(p|h2|h3|h4|blockquote|ul|ol|figure|hr)\b[^>]*>[\s\S]*?<\/\1>|<hr\s*\/?>/gi;

/**
 * The anonymous-visitor teaser (§ sign-in gate).
 *
 * Keeps only the first `blockCount` top-level block elements of an already
 * sanitised article body, so a signed-out reader sees real opening prose —
 * not a lorem-ipsum stand-in — before the sign-in wall. Operates on markup
 * that has already been through `sanitizeArticleHtml`, so no unsafe content
 * can enter here; this only shortens it.
 */
export function truncateArticleHtml(safeHtml: string, blockCount: number): string {
  const matches = safeHtml.match(TOP_LEVEL_BLOCK);
  if (!matches) return safeHtml;
  return matches.slice(0, blockCount).join("");
}

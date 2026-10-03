import type { EditorThemeClasses } from "lexical";

/**
 * Maps Lexical's internal node types onto this app's own classes.
 *
 * Lexical is headless: it ships no styling of its own, which is why it can
 * inherit the design system instead of fighting it. Everything here resolves
 * to `.ds-prose` descendants, so what a writer sees in the composer is set in
 * the same faces and rhythm as the published article.
 */
export const editorTheme: EditorThemeClasses = {
  paragraph: "ds-editor__paragraph",
  quote: "ds-editor__quote",
  heading: {
    h2: "ds-editor__h2",
    h3: "ds-editor__h3",
    h4: "ds-editor__h4",
  },
  list: {
    ul: "ds-editor__ul",
    ol: "ds-editor__ol",
    listitem: "ds-editor__li",
    nested: {
      listitem: "ds-editor__li--nested",
    },
  },
  link: "ds-editor__link",
  hashtag: "ds-editor__hashtag",
  text: {
    bold: "ds-editor__bold",
    italic: "ds-editor__italic",
    underline: "ds-editor__underline",
    strikethrough: "ds-editor__strike",
    code: "ds-editor__code",
  },
};

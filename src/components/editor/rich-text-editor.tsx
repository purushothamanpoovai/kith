"use client";

import { useCallback, useEffect } from "react";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { ListItemNode, ListNode } from "@lexical/list";
import { AutoLinkNode, LinkNode } from "@lexical/link";
import { HashtagNode, registerLexicalHashtag } from "@lexical/hashtag";
import { $generateHtmlFromNodes } from "@lexical/html";
import { $getRoot } from "lexical";
import type { EditorState, LexicalEditor } from "lexical";
import { editorTheme } from "./editor-theme";
import { EditorToolbar, type BackgroundSlot, type ImageSlots } from "./editor-toolbar";
import { ImageNode } from "./image-node";
import { parseTagInput } from "@/domain/tags/normalize";
import { DecorativePattern } from "@/components/graphics/decorative-pattern";
import { resolveBackgroundPreset } from "@/domain/theme/backgrounds";

/**
 * Registers `#hashtag` recognition in the editor body. Lexical turns a typed
 * `#word` into a `HashtagNode` (a styled `<span>`, already covered by the
 * sanitiser's allowlist) as soon as it is terminated by whitespace or
 * punctuation, which is what gives the writer a live pill instead of a
 * separate tag field to fill in.
 */
function HashtagPlugin() {
  const [editor] = useLexicalComposerContext();
  useEffect(() => registerLexicalHashtag(editor), [editor]);
  return null;
}

/**
 * The article body editor.
 *
 * Lexical's node allowlist is the first line of defence: the editor can only
 * ever construct the node types registered here, so pasted markup is coerced
 * into this shape rather than carried through verbatim. The server sanitiser
 * remains authoritative — this is a convenience, not a control.
 *
 * Images live entirely in the body as ordinary figures (see image-node.tsx):
 * the writer places the caret wherever they want the picture — including the
 * very first line, which is how a header image is made — clicks Insert, and
 * resizes it afterwards with the small size control that appears on hover.
 * That replaces the previous separate "banner" concept, which the published
 * page never actually displayed.
 *
 * Text direction is intentionally left to the browser. The app serves Tamil,
 * Hindi, Malayalam, Urdu and English; `dir="auto"` lets each paragraph resolve
 * its own direction from its first strong character, which is what makes a
 * mixed English/Urdu article read correctly without the writer choosing.
 */

/** Matches the literal text a HashtagNode holds, e.g. "#bhakti". */
const HASHTAG_TEXT = /#([\p{L}\p{N}\p{M}_-]+)/gu;

export function RichTextEditor({
  onChangeHtml,
  onTagsChange,
  placeholder,
  images,
  background,
}: {
  onChangeHtml: (html: string) => void;
  /** Tags the writer has typed as `#tag` anywhere in the body. */
  onTagsChange?: (tags: string[]) => void;
  placeholder: string;
  /** The cover slot, surfaced in the toolbar beside the insert-image tool. */
  images?: ImageSlots;
  /** The article-level background preset, surfaced as a toolbar dropdown. */
  background?: BackgroundSlot;
}) {
  const resolvedBackground = background
    ? resolveBackgroundPreset(background.value)
    : null;

  const handleChange = useCallback(
    (_editorState: EditorState, editor: LexicalEditor) => {
      editor.read(() => {
        onChangeHtml($generateHtmlFromNodes(editor, null));
        if (onTagsChange) {
          const text = $getRoot().getTextContent();
          const found = [...text.matchAll(HASHTAG_TEXT)].map((match) => match[1]);
          onTagsChange(parseTagInput(found).map((tag) => tag.label));
        }
      });
    },
    [onChangeHtml, onTagsChange],
  );

  return (
    <LexicalComposer
      initialConfig={{
        namespace: "kith-article",
        theme: editorTheme,
        nodes: [
          HeadingNode,
          QuoteNode,
          ListNode,
          ListItemNode,
          LinkNode,
          AutoLinkNode,
          HashtagNode,
          ImageNode,
        ],
        onError(error: Error) {
          // Surfacing beats swallowing: a thrown editor error would otherwise
          // leave the writer with a silently frozen surface.
          console.error("Editor error", error);
        },
      }}
    >
      <div className="ds-editor">
        <EditorToolbar images={images} background={background} />
        <div className="ds-editor__surface">
          {resolvedBackground ? (
            <DecorativePattern
              pattern={resolvedBackground.pattern}
              // A little stronger than the published article's own opacity:
              // this is a live preview meant to be noticed the moment the
              // writer picks a preset, not a background that should already
              // recede the way it will on the finished page.
              opacity={resolvedBackground.opacity * 1.6}
              fade="block"
            />
          ) : null}
          <RichTextPlugin
            contentEditable={
              <ContentEditable
                className="ds-editor__input ds-prose"
                dir="auto"
                aria-label={placeholder}
              />
            }
            placeholder={<div className="ds-editor__placeholder">{placeholder}</div>}
            ErrorBoundary={LexicalErrorBoundary}
          />
        </div>
        <HistoryPlugin />
        <ListPlugin />
        <LinkPlugin />
        <HashtagPlugin />
        <OnChangePlugin onChange={handleChange} ignoreSelectionChange />
      </div>
    </LexicalComposer>
  );
}

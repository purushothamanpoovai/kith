"use client";

import { useCallback, useEffect, useState } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $getSelection, $isRangeSelection, FORMAT_TEXT_COMMAND } from "lexical";
import { $setBlocksType } from "@lexical/selection";
import { $createHeadingNode, $createQuoteNode } from "@lexical/rich-text";
import { $createParagraphNode } from "lexical";
import {
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
} from "@lexical/list";
import { TOGGLE_LINK_COMMAND } from "@lexical/link";
import { $patchStyleText } from "@lexical/selection";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Heading2,
  Heading3,
  Quote,
  List,
  ListOrdered,
  Link2,
  Pilcrow,
  Baseline,
  Type,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { ImageToolbarGroup } from "@/components/editor/image-toolbar-group";
import { $createImageNode } from "@/components/editor/image-node";
import { $insertNodeToNearestRoot } from "@lexical/utils";
import { BackgroundPicker } from "@/components/editor/background-picker";

/**
 * The formatting toolbar.
 *
 * Deliberately narrow: headings, emphasis, lists, quote, link, colour, size
 * and — when the composer passes one — the article's background preset.
 * Everything it can produce maps onto a tag the sanitiser allows, so a
 * writer cannot compose something that will be stripped on save — a toolbar
 * offering formatting that silently disappears is worse than no toolbar.
 */

/** Colours offered to writers, as design tokens rather than free hex input. */
const TEXT_COLORS = [
  { key: "default", value: "" },
  { key: "accent", value: "#8a3f24" },
  { key: "crimson", value: "#9b2c2c" },
  { key: "indigo", value: "#3a3d8f" },
  { key: "pine", value: "#2a5546" },
  { key: "slate", value: "#4a5568" },
];

/** Sizes restricted to the type scale the sanitiser's regex accepts. */
const FONT_SIZES = [
  { key: "small", value: "var(--ds-text-sm)" },
  { key: "normal", value: "" },
  { key: "large", value: "var(--ds-text-lg)" },
  { key: "xlarge", value: "var(--ds-text-xl)" },
];

export type ImageSlots = {
  onCover: (url: string) => void;
  hasCover: boolean;
};

export type BackgroundSlot = {
  value: string;
  onChange: (id: string) => void;
};

export function EditorToolbar({
  images,
  background,
}: {
  images?: ImageSlots;
  /** The article-level background preset, surfaced as a toolbar dropdown
   *  rather than its own sidebar widget — one property of the draft, set
   *  from the same bar as everything else about how the piece looks. */
  background?: BackgroundSlot;
}) {
  const [editor] = useLexicalComposerContext();
  const t = useTranslations("create");
  const [active, setActive] = useState<Set<string>>(new Set());

  // Reflect the caret's current formatting in the toolbar's pressed states.
  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection)) return;
        const next = new Set<string>();
        for (const format of ["bold", "italic", "underline", "strikethrough"]) {
          if (selection.hasFormat(format as "bold")) next.add(format);
        }
        setActive(next);
      });
    });
  }, [editor]);

  const setBlock = useCallback(
    (kind: "p" | "h2" | "h3" | "quote") => {
      editor.update(() => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection)) return;
        $setBlocksType(selection, () => {
          if (kind === "h2") return $createHeadingNode("h2");
          if (kind === "h3") return $createHeadingNode("h3");
          if (kind === "quote") return $createQuoteNode();
          return $createParagraphNode();
        });
      });
    },
    [editor],
  );

  const applyStyle = useCallback(
    (property: string, value: string) => {
      editor.update(() => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection)) return;
        // An empty value clears the property rather than writing "".
        $patchStyleText(selection, { [property]: value || null });
      });
    },
    [editor],
  );

  /**
   * Drops an uploaded figure at the caret, as a block of its own. It starts
   * with no fixed size, so it simply fills the column like any other
   * figure — pinning it to its raw upload pixel width instead left a gap
   * down the side of the column whenever that was narrower than the editor,
   * which is wrong for an image the writer just cropped to a full-width
   * shape (a banner, say). Dragging the resize handle is what opts a figure
   * into a fixed pixel size.
   */
  const insertImage = useCallback(
    (url: string) => {
      editor.update(() => {
        $insertNodeToNearestRoot($createImageNode(url));
      });
    },
    [editor],
  );

  const insertLink = useCallback(() => {
    const url = window.prompt(t("linkPrompt"));
    if (url === null) return;
    if (url === "") {
      editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
      return;
    }
    // Only http/https/mailto survive the sanitiser, so refuse anything else
    // here too and tell the writer, instead of silently dropping it on save.
    if (!/^(https?:\/\/|mailto:)/i.test(url)) {
      window.alert(t("linkInvalid"));
      return;
    }
    editor.dispatchCommand(TOGGLE_LINK_COMMAND, url);
  }, [editor, t]);

  return (
    <div className="ds-editor__toolbar" role="toolbar" aria-label={t("toolbarLabel")}>
      <div className="ds-editor__group">
        <ToolbarButton
          label={t("formatParagraph")}
          onClick={() => setBlock("p")}
          icon={<Pilcrow size={15} strokeWidth={1.75} />}
        />
        <ToolbarButton
          label={t("formatH2")}
          onClick={() => setBlock("h2")}
          icon={<Heading2 size={15} strokeWidth={1.75} />}
        />
        <ToolbarButton
          label={t("formatH3")}
          onClick={() => setBlock("h3")}
          icon={<Heading3 size={15} strokeWidth={1.75} />}
        />
        <ToolbarButton
          label={t("formatQuote")}
          onClick={() => setBlock("quote")}
          icon={<Quote size={15} strokeWidth={1.75} />}
        />
      </div>

      <span className="ds-editor__divider" aria-hidden />

      <div className="ds-editor__group">
        <ToolbarButton
          label={t("formatBold")}
          pressed={active.has("bold")}
          onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold")}
          icon={<Bold size={15} strokeWidth={2} />}
        />
        <ToolbarButton
          label={t("formatItalic")}
          pressed={active.has("italic")}
          onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic")}
          icon={<Italic size={15} strokeWidth={2} />}
        />
        <ToolbarButton
          label={t("formatUnderline")}
          pressed={active.has("underline")}
          onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "underline")}
          icon={<Underline size={15} strokeWidth={2} />}
        />
        <ToolbarButton
          label={t("formatStrike")}
          pressed={active.has("strikethrough")}
          onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "strikethrough")}
          icon={<Strikethrough size={15} strokeWidth={2} />}
        />
      </div>

      <span className="ds-editor__divider" aria-hidden />

      <div className="ds-editor__group">
        <ToolbarButton
          label={t("formatBullet")}
          onClick={() => editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined)}
          icon={<List size={15} strokeWidth={1.75} />}
        />
        <ToolbarButton
          label={t("formatNumbered")}
          onClick={() => editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined)}
          icon={<ListOrdered size={15} strokeWidth={1.75} />}
        />
        <ToolbarButton
          label={t("formatLink")}
          onClick={insertLink}
          icon={<Link2 size={15} strokeWidth={1.75} />}
        />
      </div>

      {images ? (
        <>
          <span className="ds-editor__divider" aria-hidden />
          <ImageToolbarGroup
            onCover={images.onCover}
            onInline={insertImage}
            hasCover={images.hasCover}
          />
        </>
      ) : null}

      <span className="ds-editor__divider" aria-hidden />

      <div className="ds-editor__group">
        <label className="ds-editor__picker">
          <Baseline size={15} strokeWidth={1.75} aria-hidden />
          <span className="ds-sr-only">{t("textColor")}</span>
          <select
            className="ds-editor__select"
            onChange={(event) => applyStyle("color", event.target.value)}
            defaultValue=""
          >
            {TEXT_COLORS.map((color) => (
              <option key={color.key} value={color.value}>
                {t(`colors.${color.key}`)}
              </option>
            ))}
          </select>
        </label>

        <label className="ds-editor__picker">
          <Type size={15} strokeWidth={1.75} aria-hidden />
          <span className="ds-sr-only">{t("fontSize")}</span>
          <select
            className="ds-editor__select"
            onChange={(event) => applyStyle("font-size", event.target.value)}
            defaultValue=""
          >
            {FONT_SIZES.map((size) => (
              <option key={size.key} value={size.value}>
                {t(`sizes.${size.key}`)}
              </option>
            ))}
          </select>
        </label>

        {background ? (
          <>
            <span className="ds-editor__divider" aria-hidden />
            <BackgroundPicker value={background.value} onChange={background.onChange} />
          </>
        ) : null}
      </div>
    </div>
  );
}

function ToolbarButton({
  label,
  icon,
  onClick,
  pressed,
}: {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  pressed?: boolean;
}) {
  return (
    <button
      type="button"
      className="ds-editor__tool"
      // The browser moves focus (and collapses the editor's selection)
      // between mousedown and click on any other element — by the time
      // onClick fired, Lexical's formatting commands saw no selection to act
      // on, so every button looked clickable but silently did nothing.
      // Preventing default on mousedown keeps focus (and the selection) in
      // the editor, the standard fix for a Lexical/contentEditable toolbar.
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      aria-pressed={pressed}
      aria-label={label}
      title={label}
    >
      {icon}
    </button>
  );
}

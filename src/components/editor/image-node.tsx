"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useTranslations } from "next-intl";
import { PanelLeft, PanelRight, Rows3, Square, Trash2 } from "lucide-react";
import {
  $getNodeByKey,
  DecoratorNode,
  type DOMConversionMap,
  type DOMExportOutput,
  type LexicalNode,
  type NodeKey,
  type SerializedLexicalNode,
  type Spread,
} from "lexical";
import type { JSX } from "react";

/**
 * An inline figure inside the article body.
 *
 * Lexical can only produce node types registered with the editor, so an image
 * needs its own node rather than raw HTML. Export deliberately emits the same
 * `<figure class="ds-figure">` shape the published article uses and the
 * sanitiser allows, which means what the writer sees in the composer is what
 * survives the save — the alternative is markup that silently disappears on
 * publish. There is no caption or alt-text field: this is decorative inline
 * art the writer places by eye, not content that needs a description, so
 * nothing stands between dropping the image in and moving on.
 *
 * Size is a real pixel width and height, set by dragging the handle in the
 * corner — not a preset. The published article renders the image at exactly
 * that size (see `.ds-figure__media img` in editorial.css), capped with
 * `max-width: 100%` so a size chosen on a wide screen still fits a phone;
 * height is left to scale with the image's own aspect ratio unless the
 * writer has also dragged vertically, in which case both are honoured and
 * the picture can be cropped by its frame the way an inline image editor
 * would let it.
 *
 * Alignment ("full", "left", "right", "center") is a separate choice from
 * size, the way a word processor treats them: a freshly inserted image is
 * "full" — it fills the column, the same width as the surrounding text — and
 * choosing left or right floats a smaller copy of it so text wraps around
 * the opposite side, or "center" for a smaller image with no wrap. It is
 * stored as a `ds-figure--align-*` class on the exported `<figure>`, which
 * both the editor and the published article style, so the choice survives
 * all the way to the reader.
 */

/** Generous, but bounded — matches the values HTML attributes can hold and
 *  keeps a stray drag or a hand-edited import from storing something absurd. */
const MIN_DIMENSION = 40;
const MAX_DIMENSION = 4000;

function clampDimension(value: number): number {
  return Math.round(Math.min(MAX_DIMENSION, Math.max(MIN_DIMENSION, value)));
}

/** Reads a width/height back off an imported <img>, ignoring anything unusable. */
function readDimension(value: string | null): number | null {
  if (!value) return null;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? clampDimension(parsed) : null;
}

export type ImageAlignment = "full" | "left" | "right" | "center";

const ALIGNMENT_CLASS: Record<ImageAlignment, string | null> = {
  full: null,
  left: "ds-figure--align-left",
  right: "ds-figure--align-right",
  center: "ds-figure--align-center",
};

/** Reads alignment back off an imported figure's class list. */
function readAlignment(className: string): ImageAlignment {
  if (className.includes("ds-figure--align-left")) return "left";
  if (className.includes("ds-figure--align-right")) return "right";
  if (className.includes("ds-figure--align-center")) return "center";
  return "full";
}

export type SerializedImageNode = Spread<
  {
    src: string;
    width: number | null;
    height: number | null;
    alignment: ImageAlignment;
  },
  SerializedLexicalNode
>;

export class ImageNode extends DecoratorNode<JSX.Element> {
  __src: string;
  __width: number | null;
  __height: number | null;
  __alignment: ImageAlignment;

  static getType(): string {
    return "kith-image";
  }

  static clone(node: ImageNode): ImageNode {
    return new ImageNode(
      node.__src,
      node.__width,
      node.__height,
      node.__alignment,
      node.__key,
    );
  }

  constructor(
    src: string,
    width: number | null = null,
    height: number | null = null,
    alignment: ImageAlignment = "full",
    key?: NodeKey,
  ) {
    super(key);
    this.__src = src;
    this.__width = width;
    this.__height = height;
    this.__alignment = alignment;
  }

  static importJSON(serialized: SerializedImageNode): ImageNode {
    return new ImageNode(
      serialized.src,
      serialized.width,
      serialized.height,
      serialized.alignment ?? "full",
    );
  }

  exportJSON(): SerializedImageNode {
    return {
      ...super.exportJSON(),
      type: ImageNode.getType(),
      version: 1,
      src: this.__src,
      width: this.__width,
      height: this.__height,
      alignment: this.__alignment,
    };
  }

  /** Parses a pasted or re-loaded figure back into a node. */
  static importDOM(): DOMConversionMap | null {
    return {
      figure: (domNode: HTMLElement) => {
        const img = domNode.querySelector("img");
        if (!img) return null;
        return {
          conversion: () => ({
            node: new ImageNode(
              img.getAttribute("src") ?? "",
              readDimension(img.getAttribute("width")),
              readDimension(img.getAttribute("height")),
              readAlignment(domNode.className),
            ),
          }),
          priority: 2 as const,
        };
      },
    };
  }

  exportDOM(): DOMExportOutput {
    const figure = document.createElement("figure");
    const alignClass = ALIGNMENT_CLASS[this.__alignment];
    figure.className = alignClass ? `ds-figure ${alignClass}` : "ds-figure";

    const media = document.createElement("div");
    media.className = "ds-figure__media";
    const img = document.createElement("img");
    img.setAttribute("src", this.__src);
    // No writer-facing alt text: this is decorative inline art, not content
    // a screen-reader user needs described, so the attribute is left empty
    // rather than prompting for one on every image.
    img.setAttribute("alt", "");
    img.setAttribute("loading", "lazy");
    img.setAttribute("decoding", "async");
    if (this.__width) img.setAttribute("width", String(this.__width));
    if (this.__height) img.setAttribute("height", String(this.__height));
    media.appendChild(img);
    figure.appendChild(media);
    return { element: figure };
  }

  createDOM(): HTMLElement {
    const span = document.createElement("div");
    span.className = "ds-editor__figure-host";
    return span;
  }

  updateDOM(): false {
    // The React decorator owns the subtree; Lexical need not re-create it.
    return false;
  }

  setDimensions(width: number, height: number): void {
    const writable = this.getWritable();
    writable.__width = clampDimension(width);
    writable.__height = clampDimension(height);
  }

  setAlignment(alignment: ImageAlignment): void {
    this.getWritable().__alignment = alignment;
  }

  getSrc(): string {
    return this.__src;
  }

  getWidth(): number | null {
    return this.__width;
  }

  getHeight(): number | null {
    return this.__height;
  }

  getAlignment(): ImageAlignment {
    return this.__alignment;
  }

  decorate(): JSX.Element {
    return <ImageFigure nodeKey={this.getKey()} />;
  }
}

export function $createImageNode(
  src: string,
  width: number | null = null,
  height: number | null = null,
): ImageNode {
  return new ImageNode(src, width, height);
}

export function $isImageNode(node: LexicalNode | null | undefined): node is ImageNode {
  return node instanceof ImageNode;
}

type DragState = {
  pointerId: number;
  startX: number;
  startY: number;
  startWidth: number;
  startHeight: number;
};

/**
 * The in-editor rendering of a figure.
 *
 * Takes a node key rather than the node itself: a Lexical node instance is a
 * snapshot, and holding one across renders would show stale text after an
 * edit. Reading it fresh from the key inside an update keeps the caption in
 * sync with the editor state.
 */
function ImageFigure({ nodeKey }: { nodeKey: NodeKey }) {
  const [editor] = useLexicalComposerContext();
  const t = useTranslations("create");
  const imgRef = useRef<HTMLImageElement>(null);
  const dragRef = useRef<DragState | null>(null);
  const [state, setState] = useState(() =>
    editor.getEditorState().read(() => {
      const node = $getNodeByKey(nodeKey);
      return $isImageNode(node)
        ? {
            src: node.getSrc(),
            width: node.getWidth(),
            height: node.getHeight(),
            alignment: node.getAlignment(),
          }
        : null;
    }),
  );
  // Mirrors the node's width/height during a drag, so the image visibly
  // tracks the pointer without waiting for a Lexical update round-trip on
  // every pixel of movement.
  const [liveSize, setLiveSize] = useState<{ width: number; height: number } | null>(
    null,
  );

  useEffect(
    () =>
      editor.registerUpdateListener(({ editorState }) => {
        editorState.read(() => {
          const node = $getNodeByKey(nodeKey);
          if (!$isImageNode(node)) return;
          setState({
            src: node.getSrc(),
            width: node.getWidth(),
            height: node.getHeight(),
            alignment: node.getAlignment(),
          });
        });
      }),
    [editor, nodeKey],
  );

  const mutate = useCallback(
    (apply: (node: ImageNode) => void) => {
      editor.update(() => {
        const node = $getNodeByKey(nodeKey);
        if ($isImageNode(node)) apply(node);
      });
    },
    [editor, nodeKey],
  );

  const startDrag = useCallback(
    (event: React.PointerEvent<HTMLSpanElement>) => {
      const img = imgRef.current;
      if (!img) return;
      event.preventDefault();
      event.stopPropagation();
      (event.target as Element).setPointerCapture?.(event.pointerId);
      dragRef.current = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        // Read the rendered box rather than the stored value: the stored
        // value can be null (natural size) on a freshly inserted image, and
        // the drag has to start from what is actually on screen.
        startWidth: img.getBoundingClientRect().width,
        startHeight: img.getBoundingClientRect().height,
      };
    },
    [],
  );

  const onDragMove = useCallback((event: React.PointerEvent<HTMLSpanElement>) => {
    const drag = dragRef.current;
    if (!drag || event.pointerId !== drag.pointerId) return;
    // Free-form: width and height track the pointer independently, so the
    // writer can crop a figure into a shape as well as scale it up or down.
    const width = clampDimension(drag.startWidth + (event.clientX - drag.startX));
    const height = clampDimension(drag.startHeight + (event.clientY - drag.startY));
    setLiveSize({ width, height });
  }, []);

  const endDrag = useCallback(
    (event: React.PointerEvent<HTMLSpanElement>) => {
      const drag = dragRef.current;
      if (!drag || event.pointerId !== drag.pointerId) return;
      dragRef.current = null;
      setLiveSize((current) => {
        if (current) mutate((node) => node.setDimensions(current.width, current.height));
        return null;
      });
    },
    [mutate],
  );

  if (!state) return null;

  const width = liveSize?.width ?? state.width ?? undefined;
  const height = liveSize?.height ?? state.height ?? undefined;
  const alignClass = ALIGNMENT_CLASS[state.alignment];

  const alignments: Array<{
    value: ImageAlignment;
    label: string;
    icon: React.ReactNode;
  }> = [
    {
      value: "full",
      label: t("figureAlignFull"),
      icon: <Rows3 size={14} strokeWidth={1.75} aria-hidden />,
    },
    {
      value: "left",
      label: t("figureAlignLeft"),
      icon: <PanelLeft size={14} strokeWidth={1.75} aria-hidden />,
    },
    {
      value: "center",
      label: t("figureAlignCenter"),
      icon: <Square size={14} strokeWidth={1.75} aria-hidden />,
    },
    {
      value: "right",
      label: t("figureAlignRight"),
      icon: <PanelRight size={14} strokeWidth={1.75} aria-hidden />,
    },
  ];

  return (
    <figure className={alignClass ? `ds-figure ${alignClass}` : "ds-figure"}>
      {/* The chosen size lives on the wrapper; the image itself fills it at
          object-fit: cover, so dragging to a different aspect ratio than the
          source crops the picture to the new frame instead of squashing it —
          the same "auto fit with crop" behaviour the banner uses. */}
      <div
        className="ds-figure__media"
        style={{
          width: width ? `${width}px` : undefined,
          height: height ? `${height}px` : undefined,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- local /media mount */}
        <img ref={imgRef} src={state.src} alt="" width={width} height={height} />

        <div className="ds-editor__figure-tools" contentEditable={false}>
          {alignments.map((option) => (
            <button
              key={option.value}
              type="button"
              className="ds-editor__tool"
              title={option.label}
              aria-label={option.label}
              aria-pressed={state.alignment === option.value}
              onClick={() => mutate((node) => node.setAlignment(option.value))}
            >
              {option.icon}
            </button>
          ))}
          <button
            type="button"
            className="ds-editor__tool"
            title={t("figureRemove")}
            aria-label={t("figureRemove")}
            onClick={() => mutate((node) => node.remove())}
          >
            <Trash2 size={14} strokeWidth={1.75} aria-hidden />
          </button>
        </div>

        {/* The resize handle: a small grip in the bottom-right corner, shown
            with the rest of the tools on hover. Width and height are tracked
            independently while dragging (§freestyle resize) rather than
            locked to the source aspect ratio, so the writer can also use it
            to crop a figure into a new shape. */}
        <span
          className="ds-editor__figure-resize"
          role="presentation"
          contentEditable={false}
          title={t("figureResize")}
          onPointerDown={startDrag}
          onPointerMove={onDragMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
        />
      </div>
    </figure>
  );
}

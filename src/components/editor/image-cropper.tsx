"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  COVER_ASPECT,
  CROP_PRESET_ASPECT,
  centeredCrop,
  decodeImage,
  processImage,
  type CropPreset,
  type CropRect,
  type ImageRole,
  type ProcessedImage,
} from "@/lib/media/process-image";

/**
 * Crop-and-adjust, shown once for every image a writer adds.
 *
 * Three things make this worth a dialog rather than a silent auto-crop. A
 * cover is displayed at a fixed aspect ratio in cards and listings, so
 * *something* has to decide what gets cut — better the writer than the
 * layout. An inline image, though, has no single correct shape: the same
 * "insert image" action is how a writer makes a normal figure, a full-width
 * banner-style strip, or a square inset, so this dialog offers those shapes
 * as presets plus a fully free crop, rather than the app assuming one shape
 * per image slot. And the subject of a devotional photograph is frequently
 * off-centre (a figure at the edge of a shrine, an inscription along one
 * side), which is exactly the case an automatic centre-crop gets wrong.
 *
 * The crop box is dragged and resized with pointer events, so it works with
 * a mouse, a finger and a stylus from one code path.
 */

const INLINE_PRESETS: CropPreset[] = ["free", "original", "square", "banner", "wide"];

type Props = {
  file: File;
  role: ImageRole;
  onCancel: () => void;
  onConfirm: (result: ProcessedImage) => void;
};

type DragState =
  | { kind: "none" }
  | { kind: "move"; startX: number; startY: number; origin: CropRect }
  | { kind: "resize"; startX: number; startY: number; origin: CropRect };

export function ImageCropper({ file, role, onCancel, onConfirm }: Props) {
  const t = useTranslations("create");
  const frameRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragState>({ kind: "none" });

  const [source, setSource] = useState<{ url: string; width: number; height: number } | null>(
    null,
  );
  // Only an inline image offers a shape choice; the cover always uses its
  // own fixed listing-thumbnail ratio.
  const [preset, setPreset] = useState<CropPreset>("free");
  const [crop, setCrop] = useState<CropRect | null>(null);
  const [working, setWorking] = useState(false);
  const [failed, setFailed] = useState(false);

  const aspect = role === "cover" ? COVER_ASPECT : CROP_PRESET_ASPECT[preset];

  // Decode once to learn the real dimensions, then seed a centred crop.
  useEffect(() => {
    let cancelled = false;
    const url = URL.createObjectURL(file);
    decodeImage(file)
      .then((bitmap) => {
        if (cancelled) {
          bitmap.close();
          return;
        }
        setSource({ url, width: bitmap.width, height: bitmap.height });
        bitmap.close();
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
      URL.revokeObjectURL(url);
    };
  }, [file]);

  // Re-centre the crop whenever the source image or the target shape
  // changes — switching preset mid-adjustment should reset to a sensible box
  // for the new shape rather than keep a crop that no longer matches it.
  // Computed during render (not in an effect) so it takes effect in the same
  // commit rather than causing an extra render pass; the last-seen key is
  // itself state (not a ref) since React docs disallow reading refs while
  // rendering.
  const recenterKey = source ? `${source.url}:${aspect ?? "free"}` : null;
  const [lastRecenterKey, setLastRecenterKey] = useState<string | null>(null);
  if (source && recenterKey !== lastRecenterKey) {
    setLastRecenterKey(recenterKey);
    setCrop(centeredCrop(source.width, source.height, aspect));
  }

  const clamp = useCallback((next: CropRect): CropRect => {
    // Keep the box inside the image and above a usable minimum.
    const width = Math.min(1, Math.max(0.08, next.width));
    const height = Math.min(1, Math.max(0.08, next.height));
    return {
      width,
      height,
      x: Math.min(Math.max(0, next.x), 1 - width),
      y: Math.min(Math.max(0, next.y), 1 - height),
    };
  }, []);

  function onPointerDown(event: React.PointerEvent, kind: "move" | "resize") {
    if (!crop) return;
    event.preventDefault();
    event.stopPropagation();
    (event.target as Element).setPointerCapture?.(event.pointerId);
    dragRef.current = {
      kind,
      startX: event.clientX,
      startY: event.clientY,
      origin: crop,
    };
  }

  function onPointerMove(event: React.PointerEvent) {
    const drag = dragRef.current;
    const frame = frameRef.current;
    if (drag.kind === "none" || !frame) return;

    const rect = frame.getBoundingClientRect();
    const dx = (event.clientX - drag.startX) / rect.width;
    const dy = (event.clientY - drag.startY) / rect.height;

    if (drag.kind === "move") {
      setCrop(clamp({ ...drag.origin, x: drag.origin.x + dx, y: drag.origin.y + dy }));
      return;
    }

    // Resizing from the corner. With a fixed aspect the width leads and the
    // height follows, so the box can never leave the required shape.
    const width = drag.origin.width + dx;
    if (aspect) {
      const displayAspect = rect.width / rect.height;
      setCrop(
        clamp({
          ...drag.origin,
          width,
          height: (width * displayAspect) / aspect,
        }),
      );
      return;
    }
    setCrop(clamp({ ...drag.origin, width, height: drag.origin.height + dy }));
  }

  function endDrag() {
    dragRef.current = { kind: "none" };
  }

  /** Nudge with the keyboard, so the crop is not pointer-only. */
  function onKeyDown(event: React.KeyboardEvent) {
    if (!crop) return;
    const step = event.shiftKey ? 0.05 : 0.01;
    const moves: Record<string, Partial<CropRect>> = {
      ArrowLeft: { x: crop.x - step },
      ArrowRight: { x: crop.x + step },
      ArrowUp: { y: crop.y - step },
      ArrowDown: { y: crop.y + step },
    };
    const move = moves[event.key];
    if (!move) return;
    event.preventDefault();
    setCrop(clamp({ ...crop, ...move }));
  }

  async function confirm() {
    if (!crop) return;
    setWorking(true);
    try {
      onConfirm(await processImage(file, role, crop));
    } catch {
      setFailed(true);
    } finally {
      setWorking(false);
    }
  }

  return (
    <Dialog
      open
      onClose={onCancel}
      title={t("cropTitle")}
      closeLabel={t("cancel")}
      footer={
        <>
          <Button variant="ghost" onClick={onCancel}>
            {t("cancel")}
          </Button>
          <Button
            variant="primary"
            loading={working}
            disabled={!crop || failed}
            onClick={confirm}
          >
            {t("cropApply")}
          </Button>
        </>
      }
    >
      {failed ? (
        <p className="ds-field__message ds-field__message--error" role="alert">
          {t("errors.upload_failed")}
        </p>
      ) : null}

      {role === "inline" ? (
        <div
          className="ds-cropper-presets"
          role="radiogroup"
          aria-label={t("cropShape")}
        >
          {INLINE_PRESETS.map((option) => (
            <button
              key={option}
              type="button"
              role="radio"
              aria-checked={preset === option}
              className="ds-cropper-presets__option"
              onClick={() => setPreset(option)}
            >
              {t(`cropPreset.${option}` as "cropPreset.free")}
            </button>
          ))}
        </div>
      ) : null}

      <p className="ds-field__hint">{t("cropHint")}</p>

      {source && crop ? (
        <div
          className="ds-cropper"
          ref={frameRef}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- a local blob URL */}
          <img className="ds-cropper__image" src={source.url} alt="" draggable={false} />
          <div className="ds-cropper__shade" aria-hidden />
          <div
            className="ds-cropper__box"
            role="group"
            aria-label={t("cropTitle")}
            tabIndex={0}
            onKeyDown={onKeyDown}
            onPointerDown={(event) => onPointerDown(event, "move")}
            style={{
              insetInlineStart: `${crop.x * 100}%`,
              insetBlockStart: `${crop.y * 100}%`,
              width: `${crop.width * 100}%`,
              height: `${crop.height * 100}%`,
            }}
          >
            <span
              className="ds-cropper__handle"
              onPointerDown={(event) => onPointerDown(event, "resize")}
              aria-hidden
            />
          </div>
        </div>
      ) : (
        <div className="ds-cropper ds-cropper--loading" aria-busy />
      )}
    </Dialog>
  );
}

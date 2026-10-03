"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { GalleryHorizontal, Image as ImageIcon, Loader2 } from "lucide-react";
import { ImageCropper } from "@/components/editor/image-cropper";
import { useImageUpload } from "@/components/editor/use-image-upload";
import type { ImageRole, ProcessedImage } from "@/lib/media/process-image";

/**
 * The image group in the formatting toolbar.
 *
 * Two actions: the article's cover (the fixed-shape listing thumbnail), and
 * "insert image" for anything placed in the body. There is no separate
 * banner action — a full-width header image is just an inline image cropped
 * with the Banner preset, so the same "insert image" flow produces a normal
 * figure, a banner-style strip, or anything else, all through one dialog
 * instead of a distinct slot with its own button and its own storage.
 *
 * Both actions open the cropper: the cover to its own fixed shape, an inline
 * image to a choice of shapes (including fully free). Compression happens
 * inside the cropper's "apply" step either way.
 */

const ACCEPT = "image/jpeg,image/png,image/webp,image/gif";

export function ImageToolbarGroup({
  onCover,
  onInline,
  hasCover,
}: {
  onCover: (url: string) => void;
  onInline: (url: string) => void;
  hasCover: boolean;
}) {
  const t = useTranslations("create");
  const inputRef = useRef<HTMLInputElement>(null);
  // The role the *next picked file* is for. A ref worked for reading inside
  // event handlers, but the cropper below also needs it as a prop at render
  // time, and reading a ref's value during render is unsafe — React does not
  // treat that read as a dependency, so a render can see a stale value.
  // Tracking it as state (paired with the file, set together) keeps both in
  // sync and makes the read render-safe.
  const pendingRoleRef = useRef<ImageRole>("inline");
  const [pending, setPending] = useState<{ file: File; role: ImageRole } | null>(null);
  const { uploading, error, upload, clearError } = useImageUpload();

  function pick(role: ImageRole) {
    pendingRoleRef.current = role;
    clearError();
    inputRef.current?.click();
  }

  function handleFile(file: File) {
    // Every image now goes through the cropper — the cover to its own fixed
    // shape, an inline image to a choice of shapes — so compression always
    // happens as part of confirming the crop rather than as a separate step.
    setPending({ file, role: pendingRoleRef.current });
  }

  async function handleCropped(role: ImageRole, processed: ProcessedImage) {
    setPending(null);
    const url = await upload(processed);
    if (!url) return;
    if (role === "cover") onCover(url);
    else onInline(url);
  }

  return (
    <>
      <div className="ds-editor__group">
        <ToolButton
          label={hasCover ? t("coverReplace") : t("coverAdd")}
          busy={uploading}
          onClick={() => pick("cover")}
          active={hasCover}
          icon={<GalleryHorizontal size={15} strokeWidth={1.75} />}
        />
        <ToolButton
          label={t("insertImage")}
          busy={uploading}
          onClick={() => pick("inline")}
          icon={<ImageIcon size={15} strokeWidth={1.75} />}
        />
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="ds-sr-only"
        onChange={(event) => {
          const file = event.target.files?.[0];
          // Reset first: picking the same file twice must still fire change.
          event.target.value = "";
          if (file) handleFile(file);
        }}
      />

      {pending ? (
        <ImageCropper
          file={pending.file}
          role={pending.role}
          onCancel={() => setPending(null)}
          onConfirm={(processed) => handleCropped(pending.role, processed)}
        />
      ) : null}

      {error ? (
        <span className="ds-editor__toolbar-error" role="alert">
          {t(`errors.${error}` as "errors.upload_failed")}
        </span>
      ) : null}
    </>
  );
}

function ToolButton({
  label,
  icon,
  onClick,
  busy,
  active,
}: {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  busy?: boolean;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      className="ds-editor__tool"
      onClick={onClick}
      disabled={busy}
      aria-pressed={active}
      aria-label={label}
      title={label}
    >
      {busy ? <Loader2 size={15} strokeWidth={2} className="ds-spin" /> : icon}
    </button>
  );
}

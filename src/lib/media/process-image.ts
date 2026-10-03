/**
 * Client-side image preparation.
 *
 * Images are resized, cropped and re-encoded in the browser before they are
 * uploaded. Doing it here rather than on the server matters for this product
 * specifically: contributors are often on phones, photographing a manuscript
 * or a shrine, and a modern phone camera produces 4–12 MB files. Uploading
 * those raw wastes the contributor's data, fills a self-hosted disk quickly
 * (the deployment is a single Docker volume, not object storage), and makes
 * every reader download far more than the layout can use.
 *
 * Everything here runs on a canvas, so it is browser-only. The server still
 * validates and re-checks whatever arrives — this is an optimisation and a
 * convenience, never a trust boundary.
 */

/** A normalised crop box, expressed as fractions of the source dimensions. */
export type CropRect = {
  /** 0–1, from the left edge. */
  x: number;
  /** 0–1, from the top edge. */
  y: number;
  /** 0–1 of the source width. */
  width: number;
  /** 0–1 of the source height. */
  height: number;
};

export const FULL_CROP: CropRect = { x: 0, y: 0, width: 1, height: 1 };

/**
 * Where the image will be used, which decides how large it needs to be.
 * The cover is the fixed-shape listing thumbnail; an inline image is
 * anything the writer places in the body and can crop to whichever
 * `CropPreset` shape suits it there.
 */
export type ImageRole = "cover" | "inline";

/**
 * Per-role output budgets.
 *
 * The long edge is capped at roughly twice the largest CSS box the role can
 * occupy, which keeps the image crisp on a 2× display without paying for
 * detail no layout will ever show.
 */
const ROLE_LIMITS: Record<ImageRole, { maxEdge: number; quality: number }> = {
  // Article covers render at up to ~64rem wide.
  cover: { maxEdge: 2048, quality: 0.82 },
  // Inline figures can be stretched full-width by the banner preset, so they
  // get the same generous budget a banner used to have.
  inline: { maxEdge: 2400, quality: 0.8 },
};

/**
 * Crop shapes offered for an inline image, so the same "insert image" action
 * can produce a normal figure, a full-width banner-style strip, or anything
 * in between — without a separate banner concept that only ever applied to
 * one image per article. "free" keeps the writer's own framing decision
 * unconstrained to any ratio.
 */
export type CropPreset = "free" | "original" | "square" | "banner" | "wide";

export const CROP_PRESET_ASPECT: Record<CropPreset, number | null> = {
  free: null,
  // "original" still crops (so the writer can trim edges) but starts at the
  // source's own ratio rather than nudging them toward a particular shape.
  original: null,
  square: 1 / 1,
  banner: 4 / 1,
  wide: 16 / 9,
};

/** The cover's own shape — a listing thumbnail, not a writer choice. */
export const COVER_ASPECT = 16 / 10;

export type ProcessedImage = {
  file: File;
  /** Object URL for preview. The caller owns it and must revoke it. */
  previewUrl: string;
  width: number;
  height: number;
};

/** Reads a File into an ImageBitmap, which decodes off the main thread. */
export async function decodeImage(file: File): Promise<ImageBitmap> {
  // createImageBitmap applies EXIF orientation, so a portrait phone photo
  // does not arrive sideways the way a bare <img> decode would leave it.
  return createImageBitmap(file, { imageOrientation: "from-image" });
}

/**
 * Crops, downscales and re-encodes an image.
 *
 * Output is WebP where the browser can produce it — typically 25–35% smaller
 * than equivalent-quality JPEG — falling back to JPEG otherwise. PNG and GIF
 * inputs are re-encoded too: a screenshot pasted as PNG is usually far larger
 * than the same picture as WebP. The one exception is an animated GIF, which
 * a canvas would flatten to a single frame, so it passes through untouched.
 */
export async function processImage(
  file: File,
  role: ImageRole,
  crop: CropRect = FULL_CROP,
): Promise<ProcessedImage> {
  if (file.type === "image/gif") {
    // Flattening an animation to its first frame would silently destroy it.
    const previewUrl = URL.createObjectURL(file);
    const bitmap = await decodeImage(file);
    const result = {
      file,
      previewUrl,
      width: bitmap.width,
      height: bitmap.height,
    };
    bitmap.close();
    return result;
  }

  const bitmap = await decodeImage(file);
  const limits = ROLE_LIMITS[role];

  // Source rectangle in pixels, clamped so rounding can never read outside
  // the bitmap (which would throw on some browsers).
  const sx = Math.round(crop.x * bitmap.width);
  const sy = Math.round(crop.y * bitmap.height);
  const sw = Math.max(1, Math.min(Math.round(crop.width * bitmap.width), bitmap.width - sx));
  const sh = Math.max(1, Math.min(Math.round(crop.height * bitmap.height), bitmap.height - sy));

  // Scale down only. Upscaling a small source adds bytes and no detail.
  const scale = Math.min(1, limits.maxEdge / Math.max(sw, sh));
  const dw = Math.max(1, Math.round(sw * scale));
  const dh = Math.max(1, Math.round(sh * scale));

  const canvas = document.createElement("canvas");
  canvas.width = dw;
  canvas.height = dh;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    throw new Error("canvas_unavailable");
  }
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  // A transparent PNG would otherwise composite onto black once encoded as
  // JPEG/WebP-without-alpha; paint white first so it reads as expected.
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, dw, dh);
  ctx.drawImage(bitmap, sx, sy, sw, sh, 0, 0, dw, dh);
  bitmap.close();

  const type = supportsWebp() ? "image/webp" : "image/jpeg";
  const blob = await canvasToBlob(canvas, type, limits.quality);

  // If re-encoding somehow produced a larger file than the original and no
  // crop or downscale was applied, keep the original — never make it worse.
  const untouched = scale === 1 && crop === FULL_CROP;
  if (untouched && blob.size >= file.size && isWebSafe(file.type)) {
    const previewUrl = URL.createObjectURL(file);
    return { file, previewUrl, width: dw, height: dh };
  }

  const extension = type === "image/webp" ? "webp" : "jpg";
  const processed = new File([blob], `${baseName(file.name)}.${extension}`, { type });
  return {
    file: processed,
    previewUrl: URL.createObjectURL(blob),
    width: dw,
    height: dh,
  };
}

function baseName(name: string): string {
  return (name.split(/[/\\]/).pop() ?? "image").replace(/\.[^.]+$/, "") || "image";
}

function isWebSafe(type: string): boolean {
  return type === "image/jpeg" || type === "image/webp";
}

let webpSupport: boolean | null = null;

/** Canvas WebP encoding is near-universal now, but Safari lagged; verify. */
function supportsWebp(): boolean {
  if (webpSupport !== null) return webpSupport;
  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 1;
  webpSupport = canvas.toDataURL("image/webp").startsWith("data:image/webp");
  return webpSupport;
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("encode_failed"))),
      type,
      quality,
    );
  });
}

/**
 * Centres a crop of the given aspect ratio inside a source of known shape.
 * Used as the starting position when the cropper opens, so the common case
 * needs no adjustment at all.
 */
export function centeredCrop(
  sourceWidth: number,
  sourceHeight: number,
  aspect: number | null,
): CropRect {
  if (!aspect) return FULL_CROP;
  const sourceAspect = sourceWidth / sourceHeight;
  if (sourceAspect > aspect) {
    // Source is wider than the target: full height, inset left and right.
    const width = aspect / sourceAspect;
    return { x: (1 - width) / 2, y: 0, width, height: 1 };
  }
  // Source is taller: full width, inset top and bottom.
  const height = sourceAspect / aspect;
  return { x: 0, y: (1 - height) / 2, width: 1, height };
}

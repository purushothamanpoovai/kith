const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "audio/mpeg",
  "audio/mp4",
  "audio/ogg",
  "audio/wav",
  "audio/webm",
  "video/mp4",
  "video/webm",
  "application/pdf",
] as const;

export type AllowedMimeType = (typeof ALLOWED_MIME_TYPES)[number];

export const MAX_UPLOAD_BYTES = 50 * 1024 * 1024;

const DANGEROUS_EXTENSIONS = new Set([
  "html",
  "htm",
  "js",
  "mjs",
  "php",
  "exe",
  "sh",
  "bat",
  "cmd",
  "svg",
]);

export type UploadValidationError =
  | "file_too_large"
  | "mime_not_allowed"
  | "filename_invalid"
  | "extension_not_allowed";

export type UploadValidationResult =
  | { ok: true; safeName: string; mimeType: AllowedMimeType }
  | { ok: false; error: UploadValidationError };

export function sanitizeUploadFilename(originalName: string): string {
  const base = originalName.split(/[/\\]/).pop() ?? "upload";
  const ascii = base
    .normalize("NFKD")
    .replace(/[^\w.\-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^\.+/, "")
    .slice(0, 80);
  return ascii || "upload";
}

export function validateUpload(input: {
  originalName: string;
  mimeType: string;
  sizeBytes: number;
}): UploadValidationResult {
  if (input.sizeBytes > MAX_UPLOAD_BYTES) {
    return { ok: false, error: "file_too_large" };
  }
  if (!ALLOWED_MIME_TYPES.includes(input.mimeType as AllowedMimeType)) {
    return { ok: false, error: "mime_not_allowed" };
  }
  const safeName = sanitizeUploadFilename(input.originalName);
  const extension = safeName.split(".").pop()?.toLowerCase() ?? "";
  if (!extension || DANGEROUS_EXTENSIONS.has(extension)) {
    return { ok: false, error: "extension_not_allowed" };
  }
  if (safeName.includes("..") || safeName.includes("/") || safeName.includes("\\")) {
    return { ok: false, error: "filename_invalid" };
  }
  return {
    ok: true,
    safeName,
    mimeType: input.mimeType as AllowedMimeType,
  };
}

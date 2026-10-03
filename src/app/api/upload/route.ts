import { NextResponse } from "next/server";
import { mkdir, writeFile } from "node:fs/promises";
import { PermissionAction } from "@/domain/permissions/actions";
import { can } from "@/services/permission-service";
import { getCurrentUser } from "@/services/auth-service";
import { createId } from "@/lib/ids";
import { getEnv } from "@/lib/env";
import { MAX_UPLOAD_BYTES, validateUpload } from "@/lib/media/validate-upload";

/**
 * Image upload for the composer (§media).
 *
 * Only images are accepted here even though the shared validator also allows
 * audio/video/pdf: this endpoint serves article covers, banners and inline
 * figures, and narrowing at the edge means a future change to the shared
 * allowlist cannot silently widen what the composer accepts.
 *
 * The stored filename is generated, never taken from the client. That closes
 * path traversal (`../../etc/passwd`), double-extension tricks
 * (`x.png.php`), and collisions between uploaders in one step — the client's
 * name is only consulted for its extension, which is itself allowlisted.
 */

const ALLOWED_IMAGE_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const EXTENSION_FOR_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "auth_required" }, { status: 401 });
  }
  if (!(await can(user, PermissionAction.MEDIA_UPLOAD))) {
    return NextResponse.json({ error: "not_authorized" }, { status: 403 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "file_required" }, { status: 400 });
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json({ error: "file_too_large" }, { status: 413 });
  }

  const validation = validateUpload({
    originalName: file.name,
    mimeType: file.type,
    sizeBytes: file.size,
  });
  if (!validation.ok) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }
  // Narrower than the shared validator: composer uploads are images only.
  // Note this rejects SVG, which can carry script.
  if (!ALLOWED_IMAGE_MIME.has(file.type)) {
    return NextResponse.json({ error: "mime_not_allowed" }, { status: 400 });
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  // The declared MIME type is client-supplied; verify the actual magic bytes
  // so a script renamed to .png cannot be stored and later served as one.
  if (!looksLikeImage(bytes, file.type)) {
    return NextResponse.json({ error: "mime_not_allowed" }, { status: 400 });
  }

  const extension = EXTENSION_FOR_MIME[file.type] ?? "bin";
  const safeName = `${createId()}.${extension}`;

  // Defence in depth: `safeName` is generated from a hex id and a fixed
  // extension, so it cannot contain a separator — but assert it anyway, so a
  // future change to name generation cannot silently reintroduce traversal.
  //
  // The check is a string test rather than path.resolve/path.join on purpose:
  // the media root comes from an environment variable, and a filesystem call
  // built from a non-literal path makes Turbopack trace the entire project
  // into the server bundle (including `public/`). Joining with a plain "/"
  // keeps the write just as correct without that build-time cost.
  if (!/^[A-Za-z0-9]+\.[a-z]{3,4}$/.test(safeName)) {
    return NextResponse.json({ error: "filename_invalid" }, { status: 400 });
  }

  const mediaRoot = getEnv().mediaRoot.replace(/\/+$/, "");
  const destination = `${mediaRoot}/${safeName}`;

  try {
    await mkdir(mediaRoot, { recursive: true });
    await writeFile(destination, bytes);
  } catch {
    return NextResponse.json({ error: "write_failed" }, { status: 500 });
  }

  return NextResponse.json({ url: `/media/${safeName}` });
}

/** Minimal magic-byte check for the four image types accepted above. */
function looksLikeImage(bytes: Buffer, mimeType: string): boolean {
  if (bytes.length < 12) return false;
  switch (mimeType) {
    case "image/jpeg":
      return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
    case "image/png":
      return (
        bytes[0] === 0x89 &&
        bytes[1] === 0x50 &&
        bytes[2] === 0x4e &&
        bytes[3] === 0x47
      );
    case "image/gif":
      return bytes.subarray(0, 6).toString("ascii").startsWith("GIF8");
    case "image/webp":
      return (
        bytes.subarray(0, 4).toString("ascii") === "RIFF" &&
        bytes.subarray(8, 12).toString("ascii") === "WEBP"
      );
    default:
      return false;
  }
}

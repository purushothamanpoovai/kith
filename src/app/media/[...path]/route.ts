import { readFile, stat } from "node:fs/promises";
import { NextResponse } from "next/server";
import { getEnv } from "@/lib/env";

/**
 * Serves uploaded media in local/dev environments (§media).
 *
 * `/api/upload` writes accepted files to `MEDIA_ROOT` on disk and hands the
 * writer back a `/media/<file>` URL to store on the content record. In
 * production that URL is meant to be served by nginx (see `nginx/nginx.conf`,
 * which aliases `/media/` straight to the same disk path) so uploads never
 * touch the Node process again. There was no equivalent for `next dev` or any
 * deployment without nginx in front, so every uploaded cover, banner and
 * inline image 404'd — the composer's "broken image" previews were this
 * route missing, not a rendering bug.
 *
 * This handler is the fallback that makes the app correct on its own. It
 * intentionally mirrors nginx's behaviour (a plain, cacheable file read) so
 * having it present changes nothing when nginx *is* in front — nginx's own
 * `location /media/` block matches first and this route is simply never
 * reached in that deployment.
 *
 * The requested path is untrusted, unlike the upload route's own generated
 * filenames, so it gets the stricter checks: reject traversal, reject any
 * segment count other than exactly one (uploads are always written flat,
 * directly under MEDIA_ROOT), and only serve extensions this app itself
 * produces or accepts.
 */

const CONTENT_TYPE_FOR_EXTENSION: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  mp3: "audio/mpeg",
  m4a: "audio/mp4",
  ogg: "audio/ogg",
  wav: "audio/wav",
  weba: "audio/webm",
  mp4: "video/mp4",
  webm: "video/webm",
  pdf: "application/pdf",
};

/** Matches exactly the shapes `/api/upload` and `sanitizeUploadFilename` produce. */
const SAFE_FILENAME = /^[A-Za-z0-9][A-Za-z0-9._-]{0,120}\.[a-z0-9]{2,5}$/;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path: segments } = await params;

  // Uploads are always written flat, one file directly under MEDIA_ROOT —
  // a nested path can only be a traversal attempt or a request for something
  // that was never served here.
  if (segments.length !== 1) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const filename = segments[0];
  if (
    !SAFE_FILENAME.test(filename) ||
    filename.includes("..") ||
    filename.includes("/") ||
    filename.includes("\\")
  ) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const extension = filename.split(".").pop()?.toLowerCase() ?? "";
  const contentType = CONTENT_TYPE_FOR_EXTENSION[extension];
  if (!contentType) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const mediaRoot = getEnv().mediaRoot.replace(/\/+$/, "");
  const filePath = `${mediaRoot}/${filename}`;

  // Defence in depth against the resolved path ever leaving mediaRoot, even
  // though the filename check above should already make that impossible.
  if (!filePath.startsWith(mediaRoot)) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  try {
    const info = await stat(filePath);
    if (!info.isFile()) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    const bytes = await readFile(filePath);
    return new NextResponse(new Uint8Array(bytes), {
      headers: {
        "Content-Type": contentType,
        "Content-Length": String(info.size),
        // Uploaded filenames are content-addressed (a random id), so the
        // same URL never changes contents — safe to cache for a long time.
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
}

"use client";

import { useCallback, useState } from "react";
import type { ProcessedImage } from "@/lib/media/process-image";

/**
 * The single upload path for every image in the composer.
 *
 * Cover and inline figures both go through here so compression, error
 * handling and the endpoint contract exist in one place rather than being
 * re-implemented per call site.
 */

export type UploadState = {
  uploading: boolean;
  error: string | null;
};

export function useImageUpload() {
  const [state, setState] = useState<UploadState>({ uploading: false, error: null });

  const upload = useCallback(
    async (processed: ProcessedImage): Promise<string | null> => {
      setState({ uploading: true, error: null });
      try {
        const body = new FormData();
        body.append("file", processed.file);
        const response = await fetch("/api/upload", { method: "POST", body });
        if (!response.ok) {
          const data = (await response.json().catch(() => null)) as
            | { error?: string }
            | null;
          // Surface the server's reason where it has one — "file too large"
          // and "not authorised" need different responses from the writer.
          setState({ uploading: false, error: data?.error ?? "upload_failed" });
          return null;
        }
        const data = (await response.json()) as { url?: string };
        setState({ uploading: false, error: data.url ? null : "upload_failed" });
        return data.url ?? null;
      } catch {
        setState({ uploading: false, error: "upload_failed" });
        return null;
      } finally {
        // The preview blob has served its purpose once the bytes are sent.
        URL.revokeObjectURL(processed.previewUrl);
      }
    },
    [],
  );

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  return { ...state, upload, clearError };
}

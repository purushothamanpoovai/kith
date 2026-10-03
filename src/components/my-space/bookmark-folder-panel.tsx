"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Folder, FolderPlus, Pencil, Trash2 } from "lucide-react";
import {
  createBookmarkFolderAction,
  deleteBookmarkFolderAction,
  renameBookmarkFolderAction,
  setBookmarkFolderAction,
} from "@/app/actions/community-actions";
import { Button, IconButton } from "@/components/ui/button";

type FolderRow = { id: string; name: string; bookmarkCount: number };
type BookmarkItem = { contentId: string; folderId: string | null; card: React.ReactNode };

/**
 * A reader's own private groupings of saved content (§ low-liability curated
 * reader, Phase 3). Never shared or visible to anyone but the signed-in
 * owner — there is no "public folders" concept here.
 *
 * `ContentCard` is an async server component, so it cannot be rendered from
 * inside this client component directly — the caller renders each card
 * server-side and hands the finished node in via `bookmarks[].card`.
 */
export function BookmarkFolderPanel({
  folders: initialFolders,
  bookmarks,
}: {
  folders: FolderRow[];
  bookmarks: BookmarkItem[];
}) {
  const t = useTranslations("bookmarkFolders");
  const [pending, startTransition] = useTransition();
  const [folders, setFolders] = useState(initialFolders);
  const [activeFolder, setActiveFolder] = useState<string | "all" | "none">("all");
  const [creating, setCreating] = useState(false);
  const [draftName, setDraftName] = useState("");

  const visible =
    activeFolder === "all"
      ? bookmarks
      : activeFolder === "none"
        ? bookmarks.filter((b) => !b.folderId)
        : bookmarks.filter((b) => b.folderId === activeFolder);

  function submitCreate() {
    const name = draftName.trim();
    if (!name) return;
    startTransition(async () => {
      const result = await createBookmarkFolderAction(name);
      if (result.ok && result.folder) {
        setFolders((prev) => [...prev, { id: result.folder.id, name: result.folder.name, bookmarkCount: 0 }]);
      }
      setDraftName("");
      setCreating(false);
    });
  }

  function rename(folderId: string, currentName: string) {
    const name = window.prompt(t("renameFolder"), currentName);
    if (!name || !name.trim()) return;
    startTransition(async () => {
      await renameBookmarkFolderAction(folderId, name);
      setFolders((prev) =>
        prev.map((f) => (f.id === folderId ? { ...f, name: name.trim() } : f)),
      );
    });
  }

  function remove(folderId: string) {
    startTransition(async () => {
      await deleteBookmarkFolderAction(folderId);
      setFolders((prev) => prev.filter((f) => f.id !== folderId));
      if (activeFolder === folderId) setActiveFolder("all");
    });
  }

  function moveToFolder(contentId: string, folderId: string | null) {
    startTransition(async () => {
      await setBookmarkFolderAction(contentId, folderId);
    });
  }

  return (
    <div className="ds-bookmark-folders">
      <div className="ds-bookmark-folders__tabs" role="tablist">
        <Button
          size="sm"
          variant={activeFolder === "all" ? "primary" : "secondary"}
          onClick={() => setActiveFolder("all")}
        >
          {t("title")}
        </Button>
        <Button
          size="sm"
          variant={activeFolder === "none" ? "primary" : "secondary"}
          onClick={() => setActiveFolder("none")}
        >
          {t("noFolder")}
        </Button>
        {folders.map((folder) => (
          <span key={folder.id} className="ds-bookmark-folders__tab">
            <Button
              size="sm"
              variant={activeFolder === folder.id ? "primary" : "secondary"}
              onClick={() => setActiveFolder(folder.id)}
            >
              <Folder size={13} strokeWidth={1.75} aria-hidden />
              {folder.name}
            </Button>
            <IconButton label={t("renameFolder")} size="sm" onClick={() => rename(folder.id, folder.name)}>
              <Pencil size={12} strokeWidth={1.75} />
            </IconButton>
            <IconButton label={t("deleteFolder")} size="sm" onClick={() => remove(folder.id)}>
              <Trash2 size={12} strokeWidth={1.75} />
            </IconButton>
          </span>
        ))}

        {creating ? (
          <span className="ds-bookmark-folders__tab">
            <input
              autoFocus
              className="ds-input"
              value={draftName}
              placeholder={t("folderNamePlaceholder")}
              onChange={(e) => setDraftName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submitCreate()}
            />
            <Button size="sm" variant="primary" loading={pending} onClick={submitCreate}>
              {t("createFolder")}
            </Button>
          </span>
        ) : (
          <IconButton label={t("createFolder")} size="sm" onClick={() => setCreating(true)}>
            <FolderPlus size={14} strokeWidth={1.75} />
          </IconButton>
        )}
      </div>

      <div className="ds-grid">
        {visible.map(({ contentId, folderId, card }) => (
          <div key={contentId} className="ds-bookmark-folders__item">
            {card}
            <select
              className="ds-select ds-bookmark-folders__select"
              value={folderId ?? ""}
              onChange={(e) => moveToFolder(contentId, e.target.value || null)}
            >
              <option value="">{t("noFolder")}</option>
              {folders.map((folder) => (
                <option key={folder.id} value={folder.id}>
                  {folder.name}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>
    </div>
  );
}

"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { savePrivateNoteAction } from "@/app/actions/community-actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/field";

/**
 * Replaces the public CommentThread slot on a content page (§ low-liability
 * curated reader, Phase 3). Single-user read/write only — nothing here is
 * ever rendered to, or fetched for, anyone but the signed-in author of the
 * note, so there is no thread, no reply affordance, no other reader's name.
 */
export function PrivateNoteEditor({
  contentId,
  initialBody,
  signedIn,
  anchorId,
}: {
  contentId: string;
  initialBody: string;
  signedIn: boolean;
  anchorId?: string;
}) {
  const t = useTranslations("privateNotes");
  const [pending, startTransition] = useTransition();
  const [draft, setDraft] = useState(initialBody);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  function onSubmit(formData: FormData) {
    const body = String(formData.get("body") ?? "");
    startTransition(async () => {
      await savePrivateNoteAction(contentId, body);
      setSavedAt(Date.now());
    });
  }

  if (!signedIn) {
    return (
      <section className="ds-discussion" aria-label={t("title")} id={anchorId}>
        <header className="ds-discussion__head">
          <h3 className="ds-kicker ds-caps ds-discussion__title">{t("title")}</h3>
        </header>
        <p className="ds-discussion__signin">{t("signInToWrite")}</p>
      </section>
    );
  }

  return (
    <section className="ds-discussion" aria-label={t("title")} id={anchorId}>
      <header className="ds-discussion__head">
        <h3 className="ds-kicker ds-caps ds-discussion__title">{t("title")}</h3>
        <p className="ds-metadata">{t("lede")}</p>
      </header>

      <form className="ds-compose__box" action={onSubmit}>
        <label htmlFor={`note-${contentId}`} className="ds-sr-only">
          {t("placeholder")}
        </label>
        <Textarea
          id={`note-${contentId}`}
          name="body"
          className="ds-compose__field"
          placeholder={t("placeholder")}
          rows={3}
          value={draft}
          onChange={(event) => {
            setDraft(event.target.value);
            setSavedAt(null);
          }}
        />
        <div className="ds-compose__actions">
          {savedAt ? <span className="ds-metadata">{t("saved")}</span> : null}
          <Button type="submit" variant="primary" size="sm" loading={pending}>
            {pending ? t("saving") : t("save")}
          </Button>
        </div>
      </form>
    </section>
  );
}

"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Eye, X } from "lucide-react";
import { Field } from "@/components/ui/field";
import { Button, IconButton } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { RichTextEditor } from "@/components/editor/rich-text-editor";
import { ArticlePreview } from "@/components/editor/article-preview";
import { createArticleAction } from "@/app/actions/content-actions";
import { pickLocalized } from "@/lib/localized";

export type PublishingOrganization = {
  organizationId: string;
  organizationName: Record<string, string>;
  role: string;
};

/**
 * The article composer (§publishing).
 *
 * A writing surface, not a settings form. The cover is set from the
 * formatting toolbar rather than a right-hand rail, so choosing it feels like
 * part of writing rather than filling in a form field, and it shows as a
 * compact confirmation row (thumbnail, view, remove) rather than a large
 * preview the writer only needs to glance at once.
 *
 * Every other picture — a full-width header image, a photo partway through
 * the piece, a square inset — is the same "insert image" action, placed
 * wherever the caret is and cropped to whichever shape suits it there (see
 * the crop preset picker in image-cropper.tsx). There is no separate banner
 * concept: a full-width header image is just an inline image cropped with
 * the Banner preset at the top of the piece, which is simpler to reason
 * about than a second slot with its own button and its own storage, and it
 * actually appears wherever the writer puts it rather than always at a
 * position the article template imposes.
 *
 * The region, religion and language a piece belongs to are not shown at all —
 * they are derived from the author's profile on the server — unless the
 * writer chooses to publish as an organization, in which case the piece
 * inherits that organization's audience instead.
 *
 * Tags are not a separate field either: typing `#word` anywhere in the body
 * turns it into a pill as soon as it is closed by a space (see the hashtag
 * plugin in rich-text-editor.tsx), and the composer reads the current set of
 * tags back out of the body on every change. Writing the tag where it's
 * relevant is faster than breaking off to a side panel to redeclare it.
 *
 * The background preset is a dropdown in the formatting toolbar rather than
 * its own sidebar widget, for the same reason: it is one property of how the
 * piece looks, set from the same bar as text colour and size, not a decision
 * important enough to earn a permanent slice of the page.
 */
export function ArticleComposer({
  organizations = [],
  locale = "en",
  authorName = "",
}: {
  /** Organizations the signed-in writer may publish on behalf of. */
  organizations?: PublishingOrganization[];
  locale?: string;
  /** Shown in the preview's byline. */
  authorName?: string;
}) {
  const t = useTranslations("create");
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [bodyHtml, setBodyHtml] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [cover, setCover] = useState<string | null>(null);
  const [background, setBackground] = useState("none");
  // "" means "publish as myself" — the default, and the only option when the
  // writer belongs to no organization that can publish.
  const [organizationId, setOrganizationId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [coverPreviewOpen, setCoverPreviewOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  useEffect(() => {
    if (!previewOpen) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setPreviewOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [previewOpen]);

  function submit(publish: boolean) {
    setError(null);
    startTransition(async () => {
      const result = await createArticleAction({
        title,
        summary,
        bodyHtml,
        tags,
        coverImage: cover,
        backgroundPreset: background,
        publish,
        organizationId: organizationId || null,
      });
      if (!result.ok) {
        setError(t(`errors.${result.error}`));
        return;
      }
      router.push(`/articles/${result.slug}` as `/${string}`);
      router.refresh();
    });
  }

  return (
    <div className="ds-composer">
      <div className="ds-composer__main">
        <Field id="article-title" label={t("titleLabel")} labelHidden>
          <input
            id="article-title"
            className="ds-input ds-composer__title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder={t("titlePlaceholder")}
            dir="auto"
            maxLength={200}
            required
          />
        </Field>

        {cover ? (
          <CoverRow
            src={cover}
            label={t("coverTitle")}
            viewLabel={t("coverPreview")}
            removeLabel={t("coverRemove")}
            onView={() => setCoverPreviewOpen(true)}
            onRemove={() => setCover(null)}
          />
        ) : null}

        <Field id="article-summary" label={t("summaryLabel")} labelHidden>
          <textarea
            id="article-summary"
            className="ds-textarea ds-composer__summary"
            value={summary}
            onChange={(event) => setSummary(event.target.value)}
            placeholder={t("summaryPlaceholder")}
            title={t("summaryHint")}
            dir="auto"
            rows={1}
            maxLength={400}
          />
        </Field>

        <RichTextEditor
          onChangeHtml={setBodyHtml}
          onTagsChange={setTags}
          placeholder={t("bodyPlaceholder")}
          images={{
            onCover: setCover,
            hasCover: Boolean(cover),
          }}
          background={{ value: background, onChange: setBackground }}
        />

        <p className="ds-field__hint">
          {tags.length > 0 ? t("tagsFound", { tags: tags.join(", ") }) : t("tagsHint")}
        </p>
      </div>

      {cover ? (
        <Dialog
          open={coverPreviewOpen}
          onClose={() => setCoverPreviewOpen(false)}
          title={t("coverTitle")}
          closeLabel={t("cancel")}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- local /media mount */}
          <img className="ds-composer__media-preview" src={cover} alt="" />
        </Dialog>
      ) : null}

      <footer className="ds-composer__actions">
        {error ? (
          <p className="ds-field__message ds-field__message--error" role="alert">
            {error}
          </p>
        ) : null}
        <div className="ds-composer__buttons">
          <Button
            type="button"
            variant="secondary"
            onClick={() => submit(false)}
            disabled={pending || !title.trim()}
          >
            {t("saveDraft")}
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={() => setPreviewOpen(true)}
            disabled={pending || !title.trim()}
          >
            {t("previewAndPublish")}
          </Button>
        </div>
      </footer>

      {previewOpen ? (
        <div className="ds-preview-overlay" role="dialog" aria-modal="true" aria-label={t("previewTitle")}>
          <header className="ds-preview-overlay__bar">
            <span className="ds-preview-overlay__label">{t("previewTitle")}</span>
            <div className="ds-preview-overlay__actions">
              <Button type="button" variant="ghost" onClick={() => setPreviewOpen(false)}>
                {t("previewBack")}
              </Button>
              <Button
                type="button"
                variant="primary"
                onClick={() => submit(true)}
                loading={pending}
                disabled={pending}
              >
                {t("publish")}
              </Button>
            </div>
          </header>
          {error ? (
            <p className="ds-field__message ds-field__message--error" role="alert">
              {error}
            </p>
          ) : null}
          {organizations.length > 0 ? (
            <div className="ds-preview-overlay__publish-as">
              <label className="ds-field__hint" htmlFor="publish-as-select">
                {t("publishingContext")}
              </label>
              <select
                id="publish-as-select"
                className="ds-select"
                value={organizationId}
                onChange={(event) => setOrganizationId(event.target.value)}
              >
                <option value="">{t("publishingAsSelf")}</option>
                {organizations.map((org) => (
                  <option key={org.organizationId} value={org.organizationId}>
                    {pickLocalized(org.organizationName, locale)}
                  </option>
                ))}
              </select>
            </div>
          ) : null}
          <div className="ds-preview-overlay__body">
            <ArticlePreview
              title={title || t("titlePlaceholder")}
              summary={summary}
              bodyHtml={bodyHtml}
              coverImage={cover}
              backgroundPreset={background}
              authorName={authorName}
              locale={locale}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}

/**
 * A one-line confirmation that a cover has been chosen: a thumbnail, its
 * name, and a way to look at it full-size or take it back off. The full
 * image itself only appears on request (in a dialog) — a cover can be a
 * couple of hundred pixels tall at full width, which is too much of the
 * writing page to spend on something the writer only needs to glance at once.
 */
function CoverRow({
  src,
  label,
  viewLabel,
  removeLabel,
  onView,
  onRemove,
}: {
  src: string;
  label: string;
  viewLabel: string;
  removeLabel: string;
  onView: () => void;
  onRemove: () => void;
}) {
  return (
    <div className="ds-composer__media-row">
      {/* eslint-disable-next-line @next/next/no-img-element -- local /media mount */}
      <img className="ds-composer__media-thumb" src={src} alt="" />
      <span className="ds-composer__media-label">{label}</span>
      <IconButton label={viewLabel} size="sm" onClick={onView}>
        <Eye size={15} strokeWidth={1.75} />
      </IconButton>
      <IconButton label={removeLabel} size="sm" onClick={onRemove}>
        <X size={15} strokeWidth={1.75} />
      </IconButton>
    </div>
  );
}

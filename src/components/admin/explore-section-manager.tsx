"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { updateExploreSectionAction } from "@/app/actions/explore-section-actions";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import type { ExploreSectionRecord } from "@/repositories/explore-section-repository";

/**
 * Explore section configuration (§23 admin). One inline editor per section —
 * a flat list rather than a modal, matching the organization manage console.
 * `key`, `scopeType` and `href` are structural and stay read-only here: they
 * are what the Explore page dispatches on, so an admin renaming a key would
 * silently detach a band from its content.
 */
export function ExploreSectionManager({
  sections,
  locale,
}: {
  sections: ExploreSectionRecord[];
  locale: string;
}) {
  return (
    <ul className="ds-stack">
      {sections.map((section) => (
        <li key={section.id}>
          <ExploreSectionRow section={section} locale={locale} />
        </li>
      ))}
    </ul>
  );
}

function ExploreSectionRow({
  section,
  locale,
}: {
  section: ExploreSectionRecord;
  locale: string;
}) {
  const t = useTranslations("exploreAdmin");
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [label, setLabel] = useState(section.label?.[locale] ?? "");
  const [imageUrl, setImageUrl] = useState(section.imageUrl ?? "");
  const [icon, setIcon] = useState(section.icon ?? "");
  const [sortOrder, setSortOrder] = useState(String(section.sortOrder));
  const [active, setActive] = useState(section.active);

  function save(next?: { active?: boolean }) {
    setSaved(false);
    setError(null);
    const parsedOrder = Number.parseInt(sortOrder, 10);
    if (!Number.isInteger(parsedOrder) || parsedOrder < 0) {
      setError(t("sortOrderInvalid"));
      return;
    }
    const nextActive = next?.active ?? active;
    startTransition(async () => {
      const result = await updateExploreSectionAction({
        id: section.id,
        label,
        imageUrl: imageUrl.trim() || null,
        icon: icon.trim() || null,
        sortOrder: parsedOrder,
        active: nextActive,
      });
      if (!result.ok) {
        setError(result.error === "image_invalid" ? t("imageInvalid") : t("saveFailed"));
        return;
      }
      setActive(nextActive);
      setSaved(true);
    });
  }

  return (
    <form
      className="ds-card ds-card--pad ds-form"
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
    >
      <div className="ds-section-head__text">
        {/* A section added after this build has no built-in name, and a
            missing message key throws — so fall back to the raw key. */}
        <h3 className="ds-heading-3">
          {t.has(`keys.${section.key}` as "keys.religions")
            ? t(`keys.${section.key}` as "keys.religions")
            : section.key}
        </h3>
        <p className="ds-hint">
          {section.href}
          {active ? "" : ` · ${t("hidden")}`}
        </p>
      </div>

      <div className="ds-field-row">
        <Field
          id={`explore-label-${section.id}`}
          label={t("labelField")}
          hint={t("labelHint")}
          optional
          optionalLabel={t("optional")}
        >
          <Input
            id={`explore-label-${section.id}`}
            value={label}
            dir="auto"
            onChange={(e) => setLabel(e.target.value)}
          />
        </Field>
        <Field
          id={`explore-order-${section.id}`}
          label={t("sortOrderField")}
        >
          <Input
            id={`explore-order-${section.id}`}
            type="number"
            min={0}
            inputMode="numeric"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
          />
        </Field>
      </div>

      <div className="ds-field-row">
        <Field
          id={`explore-image-${section.id}`}
          label={t("imageField")}
          hint={t("imageHint")}
          optional
          optionalLabel={t("optional")}
        >
          <Input
            id={`explore-image-${section.id}`}
            value={imageUrl}
            placeholder="/media/…"
            onChange={(e) => setImageUrl(e.target.value)}
          />
        </Field>
        <Field
          id={`explore-icon-${section.id}`}
          label={t("iconField")}
          hint={t("iconHint")}
          optional
          optionalLabel={t("optional")}
        >
          <Input
            id={`explore-icon-${section.id}`}
            value={icon}
            onChange={(e) => setIcon(e.target.value)}
          />
        </Field>
      </div>

      {error ? (
        <p className="ds-field__message ds-field__message--error" role="alert">
          {error}
        </p>
      ) : null}
      {saved ? (
        <p className="ds-field__message ds-field__message--success" role="status">
          {t("saved")}
        </p>
      ) : null}

      <div className="ds-row ds-row--tight">
        <Button type="submit" variant="primary" size="sm" loading={pending}>
          {t("save")}
        </Button>
        <Button
          type="button"
          size="sm"
          disabled={pending}
          onClick={() => save({ active: !active })}
        >
          {active ? t("hide") : t("show")}
        </Button>
      </div>
    </form>
  );
}

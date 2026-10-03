import { getTranslations } from "next-intl/server";
import { CalendarClock, LibraryBig } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import type { ContentStatus } from "@/generated/prisma/client";
import type { StudioItem } from "@/services/studio-service";

const STATUS_TONE: Record<ContentStatus, BadgeTone> = {
  draft: "neutral",
  pending_review: "warning",
  published: "success",
  hidden: "neutral",
  archived: "neutral",
  rejected: "danger",
  removed: "danger",
};

/**
 * Studio's unified content table (§ Studio tab, decision 2). One row shape
 * for articles, posts, and events — the whole point is that authoring across
 * kinds and organizations reads as a single list, not three separate ones.
 * Filtering happens via the chip rail (URL params, rendered by the page),
 * not here; this component only renders whatever rows it was handed.
 */
export async function StudioContentTable({
  items,
  locale,
}: {
  items: StudioItem[];
  locale: string;
}) {
  const t = await getTranslations("mySpace.studio");
  const tStatus = await getTranslations("mySpace.studio.status");
  const tContentTypes = await getTranslations("content.types");

  if (items.length === 0) {
    return (
      <EmptyState
        title={t("emptyContentTitle")}
        body={t("emptyContentBody")}
        mark={<LibraryBig size={26} strokeWidth={1.25} />}
        actions={
          <Link className="ds-text-link" href="/create">
            {t("createAction")}
          </Link>
        }
      />
    );
  }

  const formatter = new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <ul className="ds-stack">
      {items.map((item) => (
        <li key={`${item.kind}-${item.id}`} className="ds-card ds-card--pad ds-manage-row">
          <div>
            <p className="ds-manage-row__title">
              <Link href={item.href}>{item.title}</Link>
            </p>
            <p className="ds-hint">
              {item.kind === "event" ? t("kindEvent") : tContentTypes(item.contentType)}
              {item.organizationName ? ` · ${item.organizationName}` : ""}
              {" · "}
              <CalendarClock size={12} strokeWidth={1.75} aria-hidden style={{ verticalAlign: "-1px" }} />{" "}
              {formatter.format(item.updatedAt)}
            </p>
          </div>
          <Badge tone={STATUS_TONE[item.status]}>{tStatus(item.status)}</Badge>
        </li>
      ))}
    </ul>
  );
}

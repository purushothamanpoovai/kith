import { getTranslations } from "next-intl/server";
import { Container } from "@/components/ui/container";
import {
  CardSkeleton,
  Skeleton,
  SkeletonGroup,
} from "@/components/ui/skeleton";

/**
 * The route-level loading state (P5 feedback, §34).
 *
 * Replaces a single line of pulsing "Loading…" text, which told the reader
 * nothing about what was coming and made the page jump when content landed.
 * The skeleton mirrors the masthead-plus-grid geometry that most routes
 * share, so the layout holds still, and the whole group is announced once
 * rather than as a stream of empty bars.
 */
export default async function LocaleLoading() {
  const t = await getTranslations("states");

  return (
    <Container>
      <SkeletonGroup label={t("loadingLabel")}>
        <div className="ds-page-mast">
          <Skeleton variant="text" width="7rem" />
          <Skeleton variant="title" width="min(24rem, 70%)" height="2.2rem" />
          <Skeleton variant="text" width="min(36rem, 90%)" />
        </div>
        <div className="ds-grid">
          {Array.from({ length: 6 }, (_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </SkeletonGroup>
    </Container>
  );
}

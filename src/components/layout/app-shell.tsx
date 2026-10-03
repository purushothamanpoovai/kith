import type { ReactNode } from "react";
import type { AuthUser } from "@/domain/auth/types";
import { getTranslations } from "next-intl/server";
import { AmbientBackground } from "@/components/graphics/ambient-background";
import { SiteHeader } from "@/components/layout/site-header";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Container } from "@/components/ui/container";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { PlayerProvider } from "@/components/media/player-provider";
import { MiniPlayer } from "@/components/media/mini-player";
import { TimezoneSync } from "@/components/locality/timezone-sync";

/**
 * The application shell.
 *
 * The document scrolls — there is no locked 100dvh frame with nested scroll
 * panes any more. That change is what lets long articles read normally, lets
 * the mobile address bar collapse, and stops content being clipped at the
 * fold on every route.
 */
export async function AppShell({
  user,
  children,
}: {
  user: AuthUser | null;
  children: ReactNode;
}) {
  const t = await getTranslations("nav");

  return (
    <ThemeProvider>
      <TimezoneSync />
      <PlayerProvider>
        <AmbientBackground />
        <div className="ds-shell">
          <a className="ds-skip-link" href="#main">
            {t("skip")}
          </a>
          <SiteHeader user={user} />
          <main id="main" className="ds-main">
            <Container>{children}</Container>
          </main>
        </div>
        <MiniPlayer />
        <MobileNav />
      </PlayerProvider>
    </ThemeProvider>
  );
}

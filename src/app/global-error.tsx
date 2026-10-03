"use client";

/**
 * The last-resort error boundary.
 *
 * Only renders when the root layout itself fails — at which point the locale
 * layout never mounted, so there is no `<html>`, no stylesheet, no loaded
 * translation catalogue and no design system to lean on. Everything here is
 * therefore self-contained and inline, and the copy is English-only: reaching
 * for `useTranslations` here would be a second thing to fail at the exact
 * moment the app has already proven it cannot render.
 */
export default function GlobalError({ reset }: { reset: () => void }) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100dvh",
          display: "grid",
          placeItems: "center",
          padding: "1.5rem",
          background: "#14120f",
          color: "#f2eee5",
          fontFamily:
            'ui-sans-serif, system-ui, -apple-system, "Segoe UI", "Noto Sans", sans-serif',
        }}
      >
        <main style={{ maxWidth: "32rem", textAlign: "center" }}>
          <h1 style={{ margin: "0 0 0.75rem", fontSize: "1.5rem", fontWeight: 600 }}>
            Something went wrong
          </h1>
          <p
            style={{
              margin: "0 0 1.5rem",
              lineHeight: 1.6,
              color: "#bdb5a7",
            }}
          >
            This page could not be loaded. Nothing you did caused it.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              minHeight: "2.25rem",
              padding: "0 1.25rem",
              border: "1px solid #e08b62",
              borderRadius: "0.5rem",
              background: "#e08b62",
              color: "#1a0f08",
              fontSize: "0.875rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}

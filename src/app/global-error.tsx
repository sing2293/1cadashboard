"use client";

import { ErrorView } from "@1ca/ui/components/route-states";
import { KitProviders } from "@1ca/ui/providers";
import { DEFAULT_THEME_CHOICE, ThemeScript, htmlThemeProps } from "@1ca/ui/theme";
import { geist } from "./fonts";
import "./globals.css";

// The root layout itself failed, so this replaces it and brings its own
// <html>, <body>, styles and font. The theme comes from the browser's
// ca-theme cookie (ThemeScript, then KitProviders), as on a static layout.
// Errors below the root layout land in error.tsx instead. Error files can't
// export metadata, hence the <title>.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html
      lang="en"
      {...htmlThemeProps(DEFAULT_THEME_CHOICE, { className: geist.variable })}
    >
      <head>
        <ThemeScript />
        <title>Something went wrong · Sales Dashboard · 1CleanAir</title>
      </head>
      <body>
        <KitProviders>
          <ErrorView error={error} reset={reset} appId="sales" />
        </KitProviders>
      </body>
    </html>
  );
}

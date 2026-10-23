import type { Metadata } from "next";
import { ThemedClerkProvider } from "@1ca/ui/clerk";
import { KitProviders } from "@1ca/ui/providers";
import { ThemeScript } from "@1ca/ui/theme";
import { getThemeChoice, htmlThemeProps } from "@1ca/ui/theme/server";
import { geist } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  // The registry name (@1ca/ui/config/apps); each page sets its own title.
  title: {
    default: "Sales Dashboard · 1CleanAir",
    template: "%s · Sales Dashboard · 1CleanAir",
  },
  description:
    "Cross-brand analytics for 1CleanAir, Home Depot, and Enviro Duct",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const theme = await getThemeChoice();

  return (
    <html lang="en" {...htmlThemeProps(theme, { className: geist.variable })}>
      <head>
        <ThemeScript />
      </head>
      <body>
        <ThemedClerkProvider initialTheme={theme}>
          <KitProviders initialTheme={theme}>{children}</KitProviders>
        </ThemedClerkProvider>
      </body>
    </html>
  );
}

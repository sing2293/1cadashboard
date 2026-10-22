import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

export const metadata: Metadata = {
  title: "ServiceMonster Dashboard",
  description:
    "Cross-brand analytics for 1CleanAir, Home Depot, and Enviro Duct",
};

// Mirrors the CSS vars in globals.css so Clerk's UI matches the dark theme.
const clerkAppearance = {
  variables: {
    colorPrimary: "#6366f1",
    colorPrimaryForeground: "#ffffff",
    colorBackground: "#131932",
    colorForeground: "#e6e8f2",
    colorMutedForeground: "#8b90b3",
    colorInput: "#1a2142",
    colorInputForeground: "#e6e8f2",
    colorNeutral: "#e6e8f2",
    colorBorder: "#1f2747",
    borderRadius: "0.5rem",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark h-full antialiased">
      <body className="min-h-full flex flex-col">
        <ClerkProvider appearance={clerkAppearance}>{children}</ClerkProvider>
      </body>
    </html>
  );
}

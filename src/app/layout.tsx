import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ServiceMonster Dashboard",
  description:
    "Cross-brand analytics for 1CleanAir, Home Depot, and Enviro Duct",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}

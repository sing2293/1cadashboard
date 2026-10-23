import { Geist } from "next/font/google";

// One instance for the root layout and global-error.tsx, which replaces the
// layout when it fails. Its variable class goes on <html>; globals.css reads
// --font-geist into --ca-font.
export const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });

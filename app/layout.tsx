import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: "See Me Travel",
    template: "%s | See Me Travel",
  },
  description: "Build a globe of everywhere you have been, and share it with one link.",
  openGraph: {
    type: "website",
    siteName: "See Me Travel",
  },
};

export const viewport: Viewport = {
  themeColor: "#070a12",
  colorScheme: "dark",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="min-h-[100dvh] bg-bg font-sans text-text antialiased">{children}</body>
    </html>
  );
}

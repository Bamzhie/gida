import type { Metadata } from "next";
import type { ReactNode } from "react";
import localFont from "next/font/local";
import { SiteChrome } from "@/components/layout/site-chrome";
import { Toaster } from "sonner";
import { siteUrl } from "@/lib/site";
import "./globals.css";

const heading = localFont({
  src: "./fonts/Bricolage-Grotesque-Variable.ttf",
  weight: "200 800",
  variable: "--font-heading",
});

const body = localFont({
  src: "./fonts/Inter-Variable.ttf",
  weight: "100 900",
  variable: "--font-sans",
});

export const metadata: Metadata = {
  metadataBase: siteUrl,
  title: "Gida - A home in Nigeria, found the honest way",
  description:
    "Gida is a Lagos-first property marketplace. Search Lagos homes, compare the full cost of moving in, and contact the advertiser directly.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${heading.variable} ${body.variable} min-h-screen bg-background font-sans text-foreground antialiased`}
      >
        <SiteChrome>{children}</SiteChrome>
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}

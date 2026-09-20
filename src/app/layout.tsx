import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Bricolage_Grotesque, Inter } from "next/font/google";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { Toaster } from "sonner";
import "./globals.css";

const heading = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-heading",
});

const body = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Gida - A home in Nigeria, found the honest way",
  description:
    "Gida is a property marketplace built for Nigeria. Right now that means real, verified listings across Lagos, with every fee shown before you inspect.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${heading.variable} ${body.variable} min-h-screen bg-background font-sans text-foreground antialiased`}
      >
        <Header />
        <main className="min-h-[calc(100vh-5rem)]">{children}</main>
        <Footer />
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}

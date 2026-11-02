"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";

export function SiteChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? "";
  const isAdmin = pathname === "/admin" || pathname.startsWith("/admin/");

  return (
    <>
      {!isAdmin && <Header />}
      <a
        href="#main-content"
        className="sr-only z-[100] rounded-md bg-background px-4 py-3 text-foreground focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:ring-2 focus:ring-ring"
      >
        Skip to content
      </a>
      <main
        id="main-content"
        tabIndex={-1}
        className={`outline-none ${isAdmin ? "min-h-dvh" : "min-h-[calc(100vh-5rem)]"}`}
      >
        {children}
      </main>
      {!isAdmin && <Footer />}
    </>
  );
}

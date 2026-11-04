import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowUpRight, Building2, LogIn, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AdminNavigation } from "@/components/admin/admin-navigation";
import { SignOutButton } from "@/components/layout/sign-out-button";
import { getCurrentUser } from "@/lib/session";

export const metadata: Metadata = {
  title: "Admin",
  description: "Review listings, reports and verification for the Gida marketplace.",
};

export const dynamic = "force-dynamic";

/**
 * Admin shell. A signed-out visitor gets a sign-in prompt and a signed-in
 * non-admin gets a plain 403 panel — no redirect, so a mistaken link does not
 * bounce someone around. The API enforces the role independently; this is only
 * the surface.
 */
export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <div className="min-h-dvh bg-background px-4 py-10 sm:px-6 sm:py-16">
        <div className="mx-auto max-w-lg">
          <Link href="/" className="mb-12 inline-flex items-center gap-2 font-heading text-lg font-semibold">
            <Building2 className="size-5" /> Gida
          </Link>
          <div className="border-t border-border pt-8">
            <ShieldAlert className="mb-5 size-9 text-accent" aria-hidden="true" />
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Admin workspace</p>
            <h1 className="font-heading text-3xl font-semibold tracking-tight">Sign in to review Gida</h1>
            <p className="mt-3 max-w-md leading-6 text-muted-foreground">
              This workspace is for the team reviewing listings, reports, and account access.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button asChild>
                <Link href={`/login?next=${encodeURIComponent("/admin/listings")}`}>
                  <LogIn className="size-4" /> Admin sign in
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (user.role !== "ADMIN") {
    return (
      <div className="min-h-dvh bg-background px-4 py-10 sm:px-6 sm:py-16">
        <div className="mx-auto max-w-lg">
          <Link href="/" className="mb-12 inline-flex items-center gap-2 font-heading text-lg font-semibold">
            <Building2 className="size-5" /> Gida
          </Link>
          <div className="border-t border-border pt-8">
            <ShieldAlert className="mb-5 size-9 text-destructive" aria-hidden="true" />
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">403 · Restricted area</p>
            <h1 className="font-heading text-3xl font-semibold tracking-tight">Admin access required</h1>
            <p className="mt-3 leading-6 text-muted-foreground">
              <span className="font-medium text-foreground">{user.email}</span> is signed in, but does not have reviewer access.
            </p>
            <Button asChild variant="outline" className="mt-7">
              <Link href="/">Return to Gida <ArrowUpRight className="size-4" /></Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/85">
        <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
          <div className="flex min-h-[4.75rem] flex-wrap items-center justify-between gap-x-5 gap-y-3 py-3">
            <div className="flex min-w-0 items-center gap-3">
              <Link href="/admin" aria-label="Gida admin overview" className="inline-flex shrink-0 items-center gap-2 font-heading text-lg font-semibold tracking-tight">
                <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground">
                  <Building2 className="size-5" aria-hidden="true" />
                </span>
                <span>Gida</span>
              </Link>
              <span className="hidden h-6 w-px bg-border sm:block" aria-hidden="true" />
              <p className="hidden text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground sm:block">Trust &amp; safety</p>
            </div>
            <div className="ml-auto flex items-center gap-3 sm:gap-5">
              <Link href="/listings" target="_blank" rel="noopener noreferrer" aria-label="Open marketplace in a new tab" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <span className="hidden sm:inline">Marketplace</span>
                <ArrowUpRight className="size-4" aria-hidden="true" />
              </Link>
              <div className="flex min-w-0 items-center gap-2.5 border-l border-border pl-3 sm:pl-5">
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-secondary text-xs font-semibold text-secondary-foreground" aria-hidden="true">
                  {user.name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "A"}
                </span>
                <span className="hidden min-w-0 sm:block">
                  <span className="block max-w-48 truncate text-sm font-medium leading-5">{user.name}</span>
                  <span className="block max-w-48 truncate text-xs leading-4 text-muted-foreground">{user.email}</span>
                </span>
              </div>
              <SignOutButton
                size="sm"
                className="h-9 shrink-0 rounded-xl px-2.5 sm:px-3"
                label="Sign out"
              />
            </div>
          </div>
          <div className="border-t border-border/70 py-2">
            <AdminNavigation />
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-[1440px] px-4 py-8 sm:px-6 sm:py-10 lg:px-8">{children}</div>
    </div>
  );
}

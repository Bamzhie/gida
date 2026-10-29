"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, Heart, LayoutDashboard, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SignOutButton } from "@/components/layout/sign-out-button";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import type { AuthUser } from "@/lib/api-types";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/listings", label: "Listings" },
  { href: "/map", label: "Map" },
  { href: "/agents", label: "Agents" },
  { href: "/how-it-works", label: "How it works" },
];

type SessionState = { status: "loading" | "signed-out" | "signed-in"; user: AuthUser | null };

async function readSession(signal: AbortSignal): Promise<AuthUser | null> {
  const me = await fetch("/api/auth/me", { signal, cache: "no-store" });
  if (me.ok) return (await me.json()) as AuthUser;
  if (me.status !== 401) return null;

  const refreshed = await fetch("/api/auth/refresh", { method: "POST", signal });
  if (!refreshed.ok) return null;

  const retry = await fetch("/api/auth/me", { signal, cache: "no-store" });
  return retry.ok ? ((await retry.json()) as AuthUser) : null;
}

export default function Header() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [session, setSession] = useState<SessionState>({ status: "loading", user: null });

  const isHome = pathname === "/";
  // Only the home page has a hero image behind the header, so only there
  // do we start transparent and switch to a solid bar once scrolled past it.
  const transparent = isHome && !scrolled && !mobileMenuOpen;

  useEffect(() => {
    if (!isHome) return;
    function onScroll() {
      setScrolled(window.scrollY > 64);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [isHome]);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();

    async function load() {
      try {
        const user = await readSession(controller.signal);
        if (!active) return;
        setSession(user ? { status: "signed-in", user } : { status: "signed-out", user: null });
      } catch {
        if (!active) return;
        setSession({ status: "signed-out", user: null });
      }
    }

    function onChange() {
      void load();
    }

    void load();
    window.addEventListener("gida:auth-changed", onChange);
    return () => {
      active = false;
      controller.abort();
      window.removeEventListener("gida:auth-changed", onChange);
    };
  }, []);

  const signedIn = session.status === "signed-in" && session.user !== null;
  const signInClass = cn("rounded-full", transparent && "text-white hover:bg-white/15 hover:text-white");

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full transition-colors duration-300",
        transparent
          ? "bg-transparent"
          : "bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/70 border-b border-border"
      )}
    >
      <div className="container mx-auto flex h-20 items-center justify-between px-4">
        <Link
          href="/"
          className={cn(
            "flex items-center gap-2 font-heading font-semibold text-xl transition-colors",
            transparent ? "text-white" : "text-foreground"
          )}
        >
          <Building2 className="h-6 w-6" />
          <span>Gida</span>
        </Link>

        {/* Desktop pill nav */}
        <nav
          aria-label="Primary navigation"
          className={cn(
            "hidden md:flex items-center gap-1 rounded-full border px-1.5 py-1.5 transition-colors",
            transparent ? "border-white/25 bg-white/10 backdrop-blur-md" : "border-border bg-card"
          )}
        >
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={pathname === link.href || (link.href !== "/" && pathname.startsWith(`${link.href}/`)) ? "page" : undefined}
              className={cn(
                "px-4 py-1.5 rounded-full text-sm font-medium transition-colors",
                pathname === link.href || (link.href !== "/" && pathname.startsWith(`${link.href}/`))
                  ? transparent
                    ? "bg-white text-neutral-900"
                    : "bg-primary text-primary-foreground"
                  : transparent
                    ? "text-white/85 hover:text-white"
                    : "text-muted-foreground hover:text-foreground"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Desktop actions */}
        <div className="hidden md:flex items-center gap-2">
          <Button variant="ghost" size="icon" className={signInClass} asChild>
            <Link href="/favorites" aria-label="Saved properties">
              <Heart className="h-5 w-5" />
            </Link>
          </Button>
          {signedIn ? (
            <>
              <Button variant="ghost" className={signInClass} asChild>
                <Link href="/dashboard">
                  <LayoutDashboard className="h-4 w-4" />
                  Dashboard
                </Link>
              </Button>
              <SignOutButton className={signInClass} />
            </>
          ) : session.status === "signed-out" ? (
            <Button variant="ghost" className={signInClass} asChild>
              <Link href="/login">Sign in</Link>
            </Button>
          ) : null}
          <Button
            className={cn(
              "rounded-full",
              transparent && "bg-white text-neutral-900 hover:bg-white/90"
            )}
            asChild
          >
            <Link href="/list-your-property">List your property</Link>
          </Button>
        </div>

        {/* Mobile menu button */}
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "md:hidden rounded-full",
            transparent && "text-white hover:bg-white/15 hover:text-white"
          )}
          aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={mobileMenuOpen}
          aria-controls="mobile-navigation"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </Button>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div id="mobile-navigation" aria-label="Mobile navigation" className="md:hidden border-t border-border bg-background">
          <div className="container mx-auto px-4 py-4 space-y-3">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                aria-current={pathname === link.href || (link.href !== "/" && pathname.startsWith(`${link.href}/`)) ? "page" : undefined}
                className="block py-2 text-sm font-medium text-foreground"
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/favorites"
              aria-current={pathname === "/favorites" ? "page" : undefined}
              className="flex items-center gap-2 py-2 text-sm font-medium text-foreground"
              onClick={() => setMobileMenuOpen(false)}
            >
              <Heart className="h-4 w-4" />
              Saved properties
            </Link>
            {signedIn && (
              <Link
                href="/dashboard"
                className="flex items-center gap-2 py-2 text-sm font-medium text-foreground"
                onClick={() => setMobileMenuOpen(false)}
              >
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </Link>
            )}
            <div className="flex gap-2 pt-2">
              {signedIn ? (
                <SignOutButton className="flex-1 rounded-full" variant="outline" />
              ) : (
                <Button variant="outline" className="flex-1 rounded-full" asChild>
                  <Link href="/login">Sign in</Link>
                </Button>
              )}
              <Button className="flex-1 rounded-full" asChild>
                <Link href="/list-your-property">List your property</Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

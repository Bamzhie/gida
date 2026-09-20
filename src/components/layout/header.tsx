"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, Heart, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/listings", label: "Listings" },
  { href: "/agents", label: "Agents" },
];

export default function Header() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

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
          className={cn(
            "hidden md:flex items-center gap-1 rounded-full border px-1.5 py-1.5 transition-colors",
            transparent ? "border-white/25 bg-white/10 backdrop-blur-md" : "border-border bg-card"
          )}
        >
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "px-4 py-1.5 rounded-full text-sm font-medium transition-colors",
                pathname === link.href
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
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "rounded-full",
              transparent && "text-white hover:bg-white/15 hover:text-white"
            )}
            asChild
          >
            <Link href="/favorites">
              <Heart className="h-5 w-5" />
            </Link>
          </Button>
          <Button
            variant="ghost"
            className={cn(
              "rounded-full",
              transparent && "text-white hover:bg-white/15 hover:text-white"
            )}
            asChild
          >
            <Link href="/login">Sign in</Link>
          </Button>
          <Button
            className={cn(
              "rounded-full",
              transparent && "bg-white text-neutral-900 hover:bg-white/90"
            )}
            asChild
          >
            <Link href="/register">List a property</Link>
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
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </Button>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-background">
          <div className="container mx-auto px-4 py-4 space-y-3">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block py-2 text-sm font-medium text-foreground"
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1 rounded-full" asChild>
                <Link href="/login">Sign in</Link>
              </Button>
              <Button className="flex-1 rounded-full" asChild>
                <Link href="/register">List a property</Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

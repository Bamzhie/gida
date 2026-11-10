"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, Heart, Inbox, LayoutDashboard, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Role } from "@/lib/api-types";

const linksByRole = {
  AGENT: [
    { href: "/dashboard/agent", label: "Overview", Icon: LayoutDashboard },
    { href: "/dashboard/agent/listings", label: "Listings", Icon: Building2 },
    { href: "/dashboard/agent/enquiries", label: "Enquiries", Icon: Inbox },
    { href: "/dashboard/agent/profile", label: "Profile", Icon: UserRound },
  ],
  USER: [
    { href: "/dashboard/buyer", label: "Overview", Icon: LayoutDashboard },
    { href: "/favorites", label: "Saved properties", Icon: Heart },
    { href: "/requests", label: "Property requests", Icon: Building2 },
  ],
} as const;

export function DashboardNavigation({ role }: { role: Extract<Role, "USER" | "AGENT"> }) {
  const pathname = usePathname();
  const links = linksByRole[role];

  return (
    <nav aria-label="Dashboard navigation" className="flex gap-1 overflow-x-auto border-b border-border px-2 sm:px-4">
      {links.map(({ href, label, Icon }) => {
        const active = pathname === href || (href !== "/dashboard/agent" && href !== "/dashboard/buyer" && pathname.startsWith(href + "/"));
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "inline-flex min-h-12 shrink-0 items-center gap-2 border-b-2 px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              active
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:border-border hover:text-foreground"
            )}
          >
            <Icon className="size-4" aria-hidden="true" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

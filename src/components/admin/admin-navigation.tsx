"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ClipboardCheck, Flag, UsersRound } from "lucide-react";
import { cn } from "@/lib/utils";

const SECTIONS = [
  { href: "/admin/listings", label: "Review queue", Icon: ClipboardCheck },
  { href: "/admin/reports", label: "Reports", Icon: Flag },
  { href: "/admin/users", label: "Users", Icon: UsersRound },
];

export function AdminNavigation() {
  const pathname = usePathname() ?? "";

  return (
    <nav aria-label="Admin sections" className="-mx-1 flex gap-1 overflow-x-auto pb-1">
      {SECTIONS.map(({ href, label, Icon }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "inline-flex shrink-0 items-center gap-2 rounded-full px-3.5 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              active
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            )}
          >
            <Icon aria-hidden="true" className="size-4" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

import type { ReactNode } from "react";
import type { Role } from "@/lib/api-types";
import { DashboardNavigation } from "@/components/dashboard/dashboard-navigation";

export function DashboardShell({ role, children }: {
  role: Extract<Role, "USER" | "AGENT">;
  children: ReactNode;
}) {
  const audience = role === "AGENT" ? "Agent workspace" : "Buyer & renter workspace";

  return (
    <div className="min-h-[calc(100vh-5rem)] bg-secondary/20">
      <div className="container mx-auto px-4 pb-10 pt-7 sm:px-6 lg:px-8">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-primary">Gida workspace</p>
            <h1 className="mt-1 font-heading text-2xl font-semibold tracking-tight">{audience}</h1>
          </div>
          <p className="text-sm text-muted-foreground">Manage your Gida activity in one place.</p>
        </div>
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <DashboardNavigation role={role} />
          <div className="p-4 sm:p-6 lg:p-8">{children}</div>
        </div>
      </div>
    </div>
  );
}

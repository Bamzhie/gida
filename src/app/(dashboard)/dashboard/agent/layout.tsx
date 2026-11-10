import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { getCurrentUser } from "@/lib/session";

export default async function AgentDashboardLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();
  if (user && user.role !== "AGENT") {
    redirect(user.role === "ADMIN" ? "/admin" : "/dashboard/buyer");
  }

  return <DashboardShell role="AGENT">{children}</DashboardShell>;
}

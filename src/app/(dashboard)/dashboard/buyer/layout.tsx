import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { getCurrentUser } from "@/lib/session";

export default async function BuyerDashboardLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();
  if (user && user.role !== "USER") {
    redirect(user.role === "ADMIN" ? "/admin" : "/dashboard/agent");
  }

  return <DashboardShell role="USER">{children}</DashboardShell>;
}

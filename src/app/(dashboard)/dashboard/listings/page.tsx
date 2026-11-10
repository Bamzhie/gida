import { redirect } from "next/navigation";
import { dashboardQuerySuffix, type DashboardSearchParams } from "@/lib/dashboard-routes";

export default async function LegacyMyListingsPage({ searchParams }: { searchParams: DashboardSearchParams }) {
  redirect("/dashboard/agent/listings" + await dashboardQuerySuffix(searchParams));
}

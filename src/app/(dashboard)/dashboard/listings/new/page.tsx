import { redirect } from "next/navigation";
import { dashboardQuerySuffix, type DashboardSearchParams } from "@/lib/dashboard-routes";

export default async function LegacyNewListingPage({ searchParams }: { searchParams: DashboardSearchParams }) {
  redirect("/dashboard/agent/listings/new" + await dashboardQuerySuffix(searchParams));
}

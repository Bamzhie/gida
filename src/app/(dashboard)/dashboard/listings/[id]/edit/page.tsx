import { redirect } from "next/navigation";
import { dashboardQuerySuffix, type DashboardSearchParams } from "@/lib/dashboard-routes";

export default async function LegacyEditListingPage({ params, searchParams }: {
  params: Promise<{ id: string }>;
  searchParams: DashboardSearchParams;
}) {
  const { id } = await params;
  const suffix = await dashboardQuerySuffix(searchParams);
  redirect("/dashboard/agent/listings/" + encodeURIComponent(id) + "/edit" + suffix);
}

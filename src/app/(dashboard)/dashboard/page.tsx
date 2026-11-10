import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) redirect("/login?next=%2Fdashboard");
  if (user.role === "AGENT") redirect("/dashboard/agent");
  if (user.role === "USER") redirect("/dashboard/buyer");
  redirect("/admin");
}

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { UserRound } from "lucide-react";
import { AgentProfileForm } from "@/components/dashboard/agent-profile-form";
import { ChangePasswordForm } from "@/components/dashboard/change-password-form";
import { Card, CardContent } from "@/components/ui/card";
import { apiGetAuthed } from "@/lib/api";
import type { AccountProfileDto } from "@/lib/api-types";
import { getCurrentUser } from "@/lib/session";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Agent profile",
  description: "Manage your advertiser profile and account security.",
};

export default async function AgentProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=%2Fdashboard%2Fagent%2Fprofile");
  if (user.role !== "AGENT") redirect(user.role === "ADMIN" ? "/admin" : "/dashboard/buyer");
  const profile = await apiGetAuthed<AccountProfileDto>("/me/profile");

  return (
    <div className="mx-auto max-w-4xl space-y-7">
      <div>
        <div className="mb-2 flex items-center gap-2 text-sm font-medium text-primary">
          <UserRound className="size-4" aria-hidden="true" /> Account settings
        </div>
        <h2 className="font-heading text-xl font-semibold">Your profile</h2>
        <p className="mt-1 text-sm text-muted-foreground">Keep your advertiser contact details and public profile current.</p>
      </div>
      <Card className="rounded-2xl">
        <CardContent className="pt-6">
          <h3 className="mb-5 font-heading text-lg font-semibold">Contact and about</h3>
          <AgentProfileForm profile={profile} />
        </CardContent>
      </Card>
      <Card className="rounded-2xl">
        <CardContent className="pt-6">
          <h3 className="font-heading text-lg font-semibold">Password</h3>
          <p className="mb-5 mt-1 text-sm text-muted-foreground">For your security, all active sessions will be signed out after a password change.</p>
          <ChangePasswordForm />
        </CardContent>
      </Card>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { AccountProfileDto, ProblemDetail } from "@/lib/api-types";

function problemMessage(problem: ProblemDetail | null): string {
  if (problem?.errors) {
    const first = Object.values(problem.errors)[0];
    if (first) return first;
  }
  return problem?.detail ?? "We couldn't save your profile. Check the details and try again.";
}

export function AgentProfileForm({ profile }: { profile: AccountProfileDto }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = new FormData(form);
    setSaving(true);
    let response: Response;
    try {
      response = await fetch("/api/dashboard/profile", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: values.get("name"),
          phone: values.get("phone"),
          agencyName: values.get("agencyName"),
          bio: values.get("bio"),
        }),
      });
    } catch {
      setSaving(false);
      toast.error("We couldn't reach the server. Try again.");
      return;
    }
    setSaving(false);
    if (response.status === 401) {
      router.push("/login?next=%2Fdashboard%2Fagent%2Fprofile");
      return;
    }
    if (!response.ok) {
      const problem = await response.json().catch(() => null) as ProblemDetail | null;
      toast.error(problemMessage(problem));
      return;
    }
    toast.success("Profile saved.");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="profile-name">Full name</Label>
          <Input id="profile-name" name="name" autoComplete="name" maxLength={120} defaultValue={profile.name} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="profile-email">Account email</Label>
          <Input id="profile-email" type="email" value={profile.email} disabled readOnly />
          <p className="text-xs text-muted-foreground">Email changes require a separate verification flow.</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="profile-phone">Contact phone</Label>
          <Input id="profile-phone" name="phone" type="tel" autoComplete="tel" maxLength={40} defaultValue={profile.phone ?? ""} />
          <p className="text-xs text-muted-foreground">Used on your advertiser profile and listing contact details.</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="profile-agency">Agency or business name</Label>
          <Input id="profile-agency" name="agencyName" maxLength={160} defaultValue={profile.agencyName ?? ""} />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="profile-bio">About you or your agency</Label>
        <Textarea id="profile-bio" name="bio" rows={5} maxLength={2000} defaultValue={profile.bio ?? ""} />
        <p className="text-xs text-muted-foreground">This appears on your advertiser profile.</p>
      </div>
      <div className="flex justify-end">
        <Button type="submit" disabled={saving} aria-busy={saving} className="rounded-xl">
          {saving ? "Saving…" : "Save profile"}
        </Button>
      </div>
    </form>
  );
}

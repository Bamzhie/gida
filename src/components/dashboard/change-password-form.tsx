"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ProblemDetail } from "@/lib/api-types";

export function ChangePasswordForm() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = new FormData(form);
    const currentPassword = String(values.get("currentPassword") ?? "");
    const newPassword = String(values.get("newPassword") ?? "");
    const confirmPassword = String(values.get("confirmPassword") ?? "");
    if (newPassword !== confirmPassword) {
      toast.error("The new passwords don't match.");
      return;
    }

    setSaving(true);
    let response: Response;
    try {
      response = await fetch("/api/dashboard/password", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
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
      toast.error(problem?.detail ?? "We couldn't change your password. Try again.");
      return;
    }
    toast.success("Password changed. Sign in again with your new password.");
    router.replace("/login");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="current-password">Current password</Label>
        <Input id="current-password" name="currentPassword" type="password" autoComplete="current-password" required />
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="new-password">New password</Label>
          <Input id="new-password" name="newPassword" type="password" autoComplete="new-password" minLength={8} maxLength={100} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm-password">Confirm new password</Label>
          <Input id="confirm-password" name="confirmPassword" type="password" autoComplete="new-password" minLength={8} maxLength={100} required />
        </div>
      </div>
      <p className="text-xs text-muted-foreground">Changing your password signs out all active sessions.</p>
      <div className="flex justify-end">
        <Button type="submit" disabled={saving} aria-busy={saving} className="rounded-xl">
          {saving ? "Updating…" : "Change password"}
        </Button>
      </div>
    </form>
  );
}

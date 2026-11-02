"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { ProblemDetail } from "@/lib/api-types";

type UserActionsProps = {
  userId: string;
  status: "ACTIVE" | "SUSPENDED";
  /** True when this row is the signed-in admin, who cannot suspend themselves. */
  isSelf: boolean;
};

/**
 * Suspend or reinstate an account. Suspension revokes refresh tokens, so the
 * account loses access within the access-token TTL; the API rejects
 * self-suspension with cannot_suspend_self regardless of what the UI offers.
 */
export function UserActions({ userId, status, isSelf }: UserActionsProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [asking, setAsking] = useState(false);
  const [reason, setReason] = useState("");

  async function run(action: "suspend" | "reinstate", withReason?: string) {
    setBusy(true);
    const response = await fetch(`/api/admin/users/${userId}/${action}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(withReason ? { reason: withReason } : {}),
    });
    setBusy(false);
    if (!response.ok) {
      const problem = (await response.json().catch(() => null)) as ProblemDetail | null;
      toast.error(problem?.detail ?? "That account did not update.");
      return;
    }
    setAsking(false);
    setReason("");
    toast.success(action === "suspend" ? "Account suspended." : "Account reinstated.");
    router.refresh();
  }

  if (isSelf) {
    return <span className="text-xs text-muted-foreground">This is you</span>;
  }

  if (status === "SUSPENDED") {
    return (
      <Button type="button" size="sm" variant="outline" onClick={() => run("reinstate")} disabled={busy} className="rounded-xl">
        {busy ? "Saving…" : "Reinstate"}
      </Button>
    );
  }

  if (!asking) {
    return (
      <Button type="button" size="sm" variant="outline" onClick={() => setAsking(true)} className="rounded-xl">
        Suspend
      </Button>
    );
  }

  return (
    <div className="space-y-2">
      <Textarea
        aria-label="Suspension reason"
        rows={2}
        maxLength={1000}
        value={reason}
        onChange={(event) => setReason(event.target.value)}
        placeholder="Why is this account being suspended?"
        className="text-xs"
      />
      <div className="flex flex-wrap gap-1.5">
        <Button
          type="button"
          size="sm"
          onClick={() => run("suspend", reason.trim())}
          disabled={busy || !reason.trim()}
          className="rounded-xl"
        >
          {busy ? "Saving…" : "Confirm"}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => setAsking(false)} className="rounded-xl">
          Cancel
        </Button>
      </div>
    </div>
  );
}

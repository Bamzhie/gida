"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Lifecycle, ProblemDetail } from "@/lib/api-types";

const REASON_MAX = 1000;

type ReviewActionsProps = {
  listingId: string;
  lifecycle: Lifecycle;
};

type Action = "approve" | "reject" | "request-corrections" | "suspend" | "reinstate" | "flag-stale";

/** Actions that need a written reason before they can run. */
const NEEDS_REASON: Action[] = ["reject", "request-corrections", "suspend"];

/**
 * Moderation controls for one listing. Which actions are offered depends on the
 * lifecycle, mirroring the API's transition rules — the API is still the
 * authority and returns invalid_lifecycle_transition if this drifts.
 */
export function ReviewActions({ listingId, lifecycle }: ReviewActionsProps) {
  const router = useRouter();
  const [busy, setBusy] = useState<Action | null>(null);
  const [confirmAction, setConfirmAction] = useState<Action | null>(null);
  const [openReason, setOpenReason] = useState<Action | null>(null);
  const [reason, setReason] = useState("");

  const actionable = ["SUBMITTED", "UNDER_REVIEW", "PUBLISHED", "PAUSED", "EXPIRED", "SUSPENDED"].includes(lifecycle);

  async function run(action: Action, withReason?: string) {
    setBusy(action);
    const response = await fetch(`/api/admin/listings/${listingId}/${action}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(withReason ? { reason: withReason } : {}),
    });
    setBusy(null);
    if (!response.ok) {
      const problem = (await response.json().catch(() => null)) as ProblemDetail | null;
      toast.error(problem?.detail ?? "That action did not go through.");
      return;
    }
    setOpenReason(null);
    setConfirmAction(null);
    setReason("");
    toast.success(DONE[action]);
    router.refresh();
  }

  function start(action: Action) {
    if (NEEDS_REASON.includes(action)) {
      setOpenReason(action);
      setConfirmAction(null);
      setReason("");
      return;
    }
    setConfirmAction(action);
  }

  if (!actionable) {
    return (
      <p className="text-sm text-muted-foreground">
        This listing is {lifecycle.toLowerCase().replace(/_/g, " ")} — there is no moderation decision to make.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {(lifecycle === "SUBMITTED" || lifecycle === "UNDER_REVIEW") && (
          <>
            <Button type="button" size="sm" onClick={() => start("approve")} disabled={busy !== null} className="rounded-xl">
              Approve and publish
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={() => start("request-corrections")} disabled={busy !== null} className="rounded-xl">
              Request corrections
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={() => start("reject")} disabled={busy !== null} className="rounded-xl">
              Reject
            </Button>
          </>
        )}
        {(lifecycle === "PUBLISHED" || lifecycle === "PAUSED" || lifecycle === "EXPIRED") && (
          <Button type="button" size="sm" variant="outline" onClick={() => start("suspend")} disabled={busy !== null} className="rounded-xl">
            Suspend listing
          </Button>
        )}
        {lifecycle === "PUBLISHED" && (
          <Button type="button" size="sm" variant="ghost" onClick={() => start("flag-stale")} disabled={busy !== null} className="rounded-xl">
            Flag as stale
          </Button>
        )}
        {lifecycle === "SUSPENDED" && (
          <Button type="button" size="sm" onClick={() => start("reinstate")} disabled={busy !== null} className="rounded-xl">
            Reinstate to paused
          </Button>
        )}
      </div>

      {confirmAction && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border p-3" role="group" aria-label="Confirm moderation action">
          <span className="mr-1 text-sm">{CONFIRM[confirmAction]}</span>
          <Button type="button" size="sm" onClick={() => run(confirmAction)} disabled={busy !== null} className="rounded-xl">
            {busy === confirmAction ? "Saving…" : "Confirm"}
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={() => setConfirmAction(null)} className="rounded-xl">
            Cancel
          </Button>
        </div>
      )}

      {openReason && (
        <div className="rounded-xl border border-border p-4">
          <Label htmlFor="moderation-reason">
            {openReason === "reject" && "Why is this listing rejected?"}
            {openReason === "request-corrections" && "What should the advertiser correct?"}
            {openReason === "suspend" && "Why is this listing suspended?"}
          </Label>
          <p className="mb-2 mt-1 text-xs text-muted-foreground">
            The advertiser sees this note on their dashboard, so write it for them.
          </p>
          <Textarea
            id="moderation-reason"
            rows={3}
            maxLength={REASON_MAX}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Be specific: what is wrong and what would fix it."
          />
          <p className="mt-1 text-right text-xs text-muted-foreground">
            {reason.length}/{REASON_MAX}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              onClick={() => run(openReason, reason.trim())}
              disabled={busy !== null || !reason.trim()}
              className="rounded-xl"
            >
              {busy === openReason ? "Saving…" : "Confirm"}
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setOpenReason(null)} className="rounded-xl">
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

const DONE: Record<Action, string> = {
  approve: "Approved and published.",
  reject: "Rejected. The advertiser can correct and resubmit.",
  "request-corrections": "Sent back to the advertiser as a draft.",
  suspend: "Listing suspended.",
  reinstate: "Listing reinstated to paused.",
  "flag-stale": "Flagged as stale and recorded in the audit trail.",
};

const CONFIRM: Record<Action, string> = {
  approve: "Approve and publish this listing?",
  reject: "Reject this listing?",
  "request-corrections": "Send this listing back for corrections?",
  suspend: "Suspend this listing?",
  reinstate: "Reinstate this listing to paused?",
  "flag-stale": "Record this listing as stale?",
};

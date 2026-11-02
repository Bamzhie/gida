"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ProblemDetail } from "@/lib/api-types";

type ReportActionsProps = {
  reportId: string;
  status: "OPEN" | "RESOLVED" | "DISMISSED";
};

/**
 * Resolve or dismiss a report. Both outcomes are audited by the API
 * (RESOLVE_REPORT / DISMISS_REPORT), so the note here becomes part of the
 * permanent record rather than a throwaway comment.
 */
export function ReportActions({ reportId, status }: ReportActionsProps) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [note, setNote] = useState("");

  if (status !== "OPEN") {
    return <span className="text-xs text-muted-foreground">Closed</span>;
  }

  async function resolve(outcome: "RESOLVED" | "DISMISSED") {
    setBusy(outcome);
    const response = await fetch(`/api/admin/reports/${reportId}/resolve`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ outcome, note }),
    });
    setBusy(null);
    if (!response.ok) {
      const problem = (await response.json().catch(() => null)) as ProblemDetail | null;
      toast.error(problem?.detail ?? "That report did not update.");
      return;
    }
    toast.success(outcome === "RESOLVED" ? "Report resolved." : "Report dismissed.");
    setNote("");
    router.refresh();
  }

  return (
    <div className="space-y-2">
      <Input
        aria-label="Resolution note"
        value={note}
        onChange={(event) => setNote(event.target.value)}
        placeholder="Note for the audit trail (optional)"
        className="h-8 text-xs"
      />
      <div className="flex flex-wrap gap-1.5">
        <Button type="button" size="sm" onClick={() => resolve("RESOLVED")} disabled={busy !== null} className="rounded-xl">
          {busy === "RESOLVED" ? "Saving…" : "Resolve"}
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={() => resolve("DISMISSED")} disabled={busy !== null} className="rounded-xl">
          {busy === "DISMISSED" ? "Saving…" : "Dismiss"}
        </Button>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { ProblemDetail, ReportReason } from "@/lib/api-types";

const REASONS: { value: ReportReason; label: string }[] = [
  { value: "FRAUD", label: "Looks like a scam or fraud" },
  { value: "WRONG_PRICE", label: "The price is wrong or misleading" },
  { value: "UNAVAILABLE", label: "The property is no longer available" },
  { value: "DUPLICATE", label: "The same property is listed twice" },
  { value: "OFFENSIVE", label: "Offensive or inappropriate content" },
  { value: "OTHER", label: "Something else" },
];

const DETAILS_MAX = 2000;

type ReportListingDialogProps = {
  listingId: string;
  listingTitle: string;
  /** False when the visitor is signed out; the dialog then offers a sign-in link. */
  signedIn: boolean;
  /** Where to return after signing in. */
  returnPath: string;
};

/**
 * Report a listing. Rendered inline rather than as a modal so it needs no
 * dialog primitive and stays keyboard-reachable. Signed-out visitors get a
 * sign-in link instead of a form, because reporting requires an account.
 */
export function ReportListingDialog({ listingId, listingTitle, signedIn, returnPath }: ReportListingDialogProps) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<ReportReason | "">("");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
      >
        <Flag className="h-3.5 w-3.5" /> Report this listing
      </button>
    );
  }

  if (!signedIn) {
    return (
      <div className="rounded-xl border border-border bg-secondary/40 p-4 text-sm">
        <p className="mb-3 text-muted-foreground">Sign in to report this listing.</p>
        <div className="flex flex-wrap items-center gap-2">
          <Button asChild size="sm" className="rounded-xl">
            <Link href={`/login?next=${encodeURIComponent(returnPath)}`}>Sign in</Link>
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)} className="rounded-xl">
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="rounded-xl border border-accent/40 bg-accent/10 p-4 text-sm">
        <p className="font-medium">Thanks — our team will review this listing.</p>
        <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)} className="mt-2 rounded-xl">
          Close
        </Button>
      </div>
    );
  }

  async function submit() {
    if (!reason) {
      setError("Choose a reason for the report.");
      return;
    }
    setError(null);
    setSubmitting(true);
    const response = await fetch(`/api/listings/${listingId}/reports`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ reason, details }),
    });
    setSubmitting(false);
    if (!response.ok) {
      const problem = (await response.json().catch(() => null)) as ProblemDetail | null;
      const code = problem?.type.split("/").pop() ?? "";
      if (code === "duplicate_report") {
        setError("You have already reported this listing. Our team is reviewing it.");
        return;
      }
      setError(problem?.detail ?? "Something went wrong. Try again.");
      return;
    }
    setDone(true);
  }

  return (
    <div className="rounded-xl border border-border p-4">
      <p className="mb-1 font-medium">Report &ldquo;{listingTitle}&rdquo;</p>
      <p className="mb-4 text-xs text-muted-foreground">
        Reports go to the Gida review team. We do not tell the advertiser who reported them.
      </p>
      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor={`report-reason-${listingId}`}>Reason</Label>
          <Select value={reason} onValueChange={(value) => setReason(value as ReportReason)}>
            <SelectTrigger id={`report-reason-${listingId}`}>
              <SelectValue placeholder="Choose a reason" />
            </SelectTrigger>
            <SelectContent>
              {REASONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`report-details-${listingId}`}>What&apos;s wrong? (optional)</Label>
          <Textarea
            id={`report-details-${listingId}`}
            value={details}
            maxLength={DETAILS_MAX}
            rows={3}
            onChange={(event) => setDetails(event.target.value)}
            placeholder="Anything the reviewer should know."
          />
          <p className="text-right text-xs text-muted-foreground">
            {details.length}/{DETAILS_MAX}
          </p>
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" size="sm" onClick={submit} disabled={submitting} className="rounded-xl">
            {submitting ? "Sending…" : "Submit report"}
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)} className="rounded-xl">
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BadgeCheck, Copy, Eye, PauseCircle, Pencil, PlayCircle, RefreshCw, Send, Tag } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { ListingRenewedDto, ListingType, Lifecycle } from "@/lib/api-types";
import { listingProblemMessage } from "@/lib/listing-problems";
import { formatDate } from "@/lib/utils";

type ListingRowActionsProps = {
  listingId: string;
  lifecycle: Lifecycle;
  listingType: ListingType;
  showDetails?: boolean;
  showEdit?: boolean;
};

type Action = "submit" | "resume" | "pause" | "confirm";

/**
 * Row actions for the my-listings table. Transitions refresh the server table
 * on success (the established listing-card pattern); Spring's problem codes
 * surface as toasts.
 *
 * Submitting is not publishing: a draft or rejected listing goes to the review
 * queue and only an admin can make it live, so no action here ever claims a
 * listing is public when it is not.
 */
export function ListingRowActions({ listingId, lifecycle, listingType, showDetails = true, showEdit = true }: ListingRowActionsProps) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  function requireSignIn(status: number): boolean {
    if (status !== 401) return false;
    toast.error("Sign in to manage your listings.");
    router.push("/login?next=" + encodeURIComponent("/dashboard/agent/listings"));
    return true;
  }

  async function transition(action: Action) {
    setBusy(action);
    const response = await fetch(`/api/dashboard/listings/${listingId}/${action}`, { method: "POST" });
    setBusy(null);
    if (requireSignIn(response.status)) return;
    if (!response.ok) {
      toast.error(listingProblemMessage(await response.json().catch(() => null)));
      return;
    }
    if (action === "submit") {
      toast.success("Submitted for review. We'll publish it once it's checked.");
    } else if (action === "confirm") {
      const confirmed = (await response.json().catch(() => null)) as { confirmedAt?: string } | null;
      toast.success(
        confirmed?.confirmedAt
          ? `Confirmed available as of ${formatDate(confirmed.confirmedAt)}.`
          : "Confirmed available."
      );
    } else if (action === "resume") {
      toast.success("The listing is live again.");
    } else {
      toast.success("The listing is paused.");
    }
    router.refresh();
  }

  async function markAvailability(availability: "RENTED" | "SOLD") {
    setBusy("availability");
    const response = await fetch(`/api/dashboard/listings/${listingId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ availability }),
    });
    setBusy(null);
    if (requireSignIn(response.status)) return;
    if (!response.ok) {
      toast.error(listingProblemMessage(await response.json().catch(() => null)));
      return;
    }
    toast.success(availability === "SOLD" ? "Marked as sold." : "Marked as rented.");
    router.refresh();
  }

  async function renew() {
    setBusy("renew");
    const response = await fetch(`/api/dashboard/listings/${listingId}/renew`, { method: "POST" });
    setBusy(null);
    if (requireSignIn(response.status)) return;
    if (!response.ok) {
      toast.error(listingProblemMessage(await response.json().catch(() => null)));
      return;
    }
    const renewed = (await response.json()) as ListingRenewedDto;
    toast.success(`Renewed until ${formatDate(renewed.expiresAt)}.`);
    router.refresh();
  }

  async function duplicate() {
    setBusy("duplicate");
    const response = await fetch(`/api/dashboard/listings/${listingId}/duplicate`, { method: "POST" });
    setBusy(null);
    if (requireSignIn(response.status)) return;
    if (!response.ok) {
      toast.error(listingProblemMessage(await response.json().catch(() => null)));
      return;
    }
    await response.json();
    toast.success("Copy created as a new draft.");
    router.refresh();
  }

  const editable = lifecycle === "DRAFT" || lifecycle === "REJECTED" || lifecycle === "SUBMITTED" || lifecycle === "UNDER_REVIEW";
  const canSubmit = lifecycle === "DRAFT" || lifecycle === "REJECTED";
  const inReview = lifecycle === "SUBMITTED" || lifecycle === "UNDER_REVIEW";

  return (
    <div className="flex flex-wrap items-center justify-end gap-1.5">
      {showDetails && (
        <Button type="button" variant="ghost" size="sm" asChild className="rounded-xl">
          <Link href={"/dashboard/agent/listings/" + listingId}>
            <Eye /> Details
          </Link>
        </Button>
      )}
      {canSubmit && (
        <Button type="button" size="sm" onClick={() => transition("submit")} disabled={busy !== null} className="rounded-xl">
          <Send /> Submit for review
        </Button>
      )}
      {editable && showEdit && (
        <Button type="button" variant="outline" size="sm" asChild className="rounded-xl">
          <Link href={"/dashboard/agent/listings/" + listingId + "/edit"}>
            <Pencil /> Edit
          </Link>
        </Button>
      )}

      {inReview && <span className="text-xs text-muted-foreground">Awaiting review</span>}

      {lifecycle === "PUBLISHED" && (
        <>
          <Button type="button" variant="outline" size="sm" onClick={() => transition("confirm")} disabled={busy !== null} className="rounded-xl">
            <BadgeCheck /> Confirm available
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => transition("pause")} disabled={busy !== null} className="rounded-xl">
            <PauseCircle /> Pause
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={renew} disabled={busy !== null} className="rounded-xl">
            <RefreshCw /> Renew
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => markAvailability(listingType === "SALE" ? "SOLD" : "RENTED")}
            disabled={busy !== null}
            className="rounded-xl"
          >
            <Tag /> {listingType === "SALE" ? "Mark sold" : "Mark rented"}
          </Button>
        </>
      )}

      {lifecycle === "PAUSED" && (
        <Button type="button" size="sm" onClick={() => transition("resume")} disabled={busy !== null} className="rounded-xl">
          <PlayCircle /> Resume
        </Button>
      )}

      {lifecycle === "SUSPENDED" && (
        <span className="text-xs text-muted-foreground">Suspended — contact support</span>
      )}

      {(lifecycle === "PUBLISHED" || lifecycle === "PAUSED" || lifecycle === "EXPIRED") && (
        <Button type="button" variant="ghost" size="sm" onClick={duplicate} disabled={busy !== null} className="rounded-xl">
          <Copy /> Duplicate
        </Button>
      )}
    </div>
  );
}

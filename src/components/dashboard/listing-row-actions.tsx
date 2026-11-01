"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Copy, PauseCircle, Pencil, PlayCircle, RefreshCw, Tag } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { ListingRenewedDto, ListingType, Lifecycle } from "@/lib/api-types";
import { listingProblemMessage } from "@/lib/listing-problems";
import { formatDate } from "@/lib/utils";

type ListingRowActionsProps = {
  listingId: string;
  lifecycle: Lifecycle;
  listingType: ListingType;
};

/**
 * Row actions for the my-listings table. Transitions refresh the server table
 * on success (the established listing-card pattern); Spring's problem codes
 * surface as toasts. Publish covers both DRAFT and PAUSED — the API treats it
 * as the resume action for paused rows.
 */
export function ListingRowActions({ listingId, lifecycle, listingType }: ListingRowActionsProps) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  function requireSignIn(status: number): boolean {
    if (status !== 401) return false;
    toast.error("Sign in to manage your listings.");
    router.push(`/login?next=${encodeURIComponent("/dashboard/listings")}`);
    return true;
  }

  async function transition(action: "publish" | "pause") {
    setBusy(action);
    const response = await fetch(`/api/dashboard/listings/${listingId}/${action}`, { method: "POST" });
    setBusy(null);
    if (requireSignIn(response.status)) return;
    if (!response.ok) {
      toast.error(listingProblemMessage(await response.json().catch(() => null)));
      return;
    }
    toast.success(action === "publish" ? "The listing is live." : "The listing is paused.");
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

  return (
    <div className="flex flex-wrap items-center justify-end gap-1.5">
      {lifecycle === "DRAFT" && (
        <Button type="button" size="sm" onClick={() => transition("publish")} disabled={busy !== null} className="rounded-xl">
          <PlayCircle /> Publish
        </Button>
      )}
      {lifecycle === "PAUSED" && (
        <Button type="button" size="sm" onClick={() => transition("publish")} disabled={busy !== null} className="rounded-xl">
          <PlayCircle /> Resume
        </Button>
      )}
      {lifecycle === "PUBLISHED" && (
        <>
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
      {lifecycle === "DRAFT" && (
        <Button type="button" variant="outline" size="sm" asChild className="rounded-xl">
          <Link href={`/dashboard/listings/${listingId}/edit`}>
            <Pencil /> Edit
          </Link>
        </Button>
      )}
      <Button type="button" variant="ghost" size="sm" onClick={duplicate} disabled={busy !== null} className="rounded-xl">
        <Copy /> Duplicate
      </Button>
    </div>
  );
}

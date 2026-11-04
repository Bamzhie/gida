"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Copy, Heart, Share2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

type Props = { listingId: string; title: string; saved: boolean };

export function ListingSummaryActions({ listingId, title, saved }: Props) {
  const router = useRouter();
  const shareDialog = useRef<HTMLDialogElement>(null);
  const [favorite, setFavorite] = useState(saved);
  const [shareUrl, setShareUrl] = useState("");

  async function toggleFavorite() {
    const next = !favorite;
    setFavorite(next);
    try {
      const response = await fetch(`/api/favorites/${listingId}`, { method: next ? "PUT" : "DELETE" });
      if (response.status === 401) {
        setFavorite(!next);
        toast("Sign in to save this property");
        return;
      }
      if (!response.ok) {
        setFavorite(!next);
        toast.error(next ? "Could not save this property." : "Could not remove this property.");
        return;
      }
      toast.success(next ? "Property saved." : "Removed from saved properties.");
      router.refresh();
    } catch {
      setFavorite(!next);
      toast.error("Could not update saved properties. Check your connection and try again.");
    }
  }

  function openShareDialog() {
    setShareUrl(window.location.href);
    shareDialog.current?.showModal();
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Listing link copied.");
      shareDialog.current?.close();
    } catch {
      toast.error("The listing link could not be copied.");
    }
  }

  return (
    <div className="flex shrink-0 items-center gap-1" role="group" aria-label="Property actions">
      <Button type="button" variant="ghost" size="icon" onClick={openShareDialog} aria-label="Share this property" className="size-12 rounded-full text-foreground hover:text-primary">
        <Share2 className="size-7" />
      </Button>
      <Button type="button" variant="ghost" size="icon" onClick={toggleFavorite} aria-pressed={favorite} aria-label={favorite ? "Remove from saved properties" : "Save this property"} className="size-12 rounded-full text-foreground hover:text-primary">
        <Heart className={favorite ? "size-7 fill-accent text-accent" : "size-7"} />
      </Button>
      <dialog
        ref={shareDialog}
        aria-labelledby="share-property-title"
        aria-describedby="share-property-description"
        onClick={(event) => {
          if (event.target === event.currentTarget) shareDialog.current?.close();
        }}
        className="fixed inset-0 m-auto w-[min(92vw,28rem)] max-w-none rounded-2xl border border-border bg-card p-0 text-card-foreground shadow-2xl backdrop:bg-foreground/45"
      >
        <div className="relative p-6 sm:p-7">
          <Button type="button" variant="ghost" size="icon" onClick={() => shareDialog.current?.close()} aria-label="Close share dialog" className="absolute right-4 top-4 size-9 rounded-full text-muted-foreground">
            <X className="size-4" />
          </Button>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">Gida · Property</p>
          <h2 id="share-property-title" className="mt-2 pr-8 font-heading text-2xl font-semibold">Share this property</h2>
          <p id="share-property-description" className="mt-2 text-sm leading-6 text-muted-foreground">
            Copy a link to {title} and share it anywhere.
          </p>
          <div className="mt-5 flex min-w-0 items-center rounded-xl border border-border bg-background px-3 py-3 text-sm text-muted-foreground">
            <span className="truncate">{shareUrl}</span>
          </div>
          <div className="mt-5">
            <Button type="button" onClick={copyLink} className="w-full rounded-xl">
              <Copy /> Copy link
            </Button>
          </div>
        </div>
      </dialog>
    </div>
  );
}

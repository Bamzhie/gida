"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Heart } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ListingCard } from "@/components/marketplace/listing-card";
import { clearFavorites, getFavoriteIds } from "@/lib/preview-storage";
import { toCardModel, type ListingCardModel } from "@/lib/listing-view";
import type { ListingSummaryDto, PageResponse } from "@/lib/api-types";

export default function FavoritesPage() {
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [listings, setListings] = useState<ListingCardModel[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [reload, setReload] = useState(0);

  useEffect(() => {
    const sync = () => setFavoriteIds(getFavoriteIds());
    const timer = window.setTimeout(() => {
      sync();
      setHydrated(true);
    }, 0);
    window.addEventListener("gida:favorites-changed", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("gida:favorites-changed", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (favoriteIds.length === 0) {
      const timer = window.setTimeout(() => {
        setListings([]);
        setStatus("ready");
      }, 0);
      return () => window.clearTimeout(timer);
    }

    const controller = new AbortController();
    async function load() {
      setStatus("loading");
      try {
        const params = new URLSearchParams({ ids: favoriteIds.slice(0, 50).join(","), size: "50" });
        const response = await fetch(`/api/listings?${params.toString()}`, {
          signal: controller.signal,
          cache: "no-store",
        });
        if (!response.ok) throw new Error("Favorites could not be loaded");
        const page = (await response.json()) as PageResponse<ListingSummaryDto>;
        const byId = new Map(page.items.map((item) => [item.id, toCardModel(item)]));
        setListings(
          favoriteIds
            .map((id) => byId.get(id))
            .filter((item): item is ListingCardModel => item !== undefined)
        );
        setStatus("ready");
      } catch {
        if (!controller.signal.aborted) setStatus("error");
      }
    }
    void load();
    return () => controller.abort();
  }, [favoriteIds, hydrated, reload]);

  if (!hydrated) {
    return <div className="container mx-auto flex justify-center px-4 py-20 text-sm text-muted-foreground">Loading saved properties…</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-semibold">Saved properties</h1>
          <p className="mt-1 text-muted-foreground">Saved homes are kept in this browser.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" asChild><Link href="/listings">Explore listings</Link></Button>
          {favoriteIds.length > 0 && (
            <Button
              variant="ghost"
              onClick={() => {
                clearFavorites();
                setFavoriteIds([]);
              }}
            >
              Clear saved properties
            </Button>
          )}
        </div>
      </div>

      {status === "error" && (
        <Card className="mx-auto max-w-lg text-center">
          <CardContent className="pt-10 pb-10">
            <h2 className="text-lg font-semibold">Saved properties could not be loaded</h2>
            <p className="mt-2 text-sm text-muted-foreground">The marketplace service could not be reached.</p>
            <Button className="mt-5" onClick={() => setReload((value) => value + 1)}>Try again</Button>
          </CardContent>
        </Card>
      )}

      {status !== "error" && favoriteIds.length === 0 && (
        <Card className="mx-auto max-w-lg text-center">
          <CardContent className="pt-10 pb-10">
            <Heart className="mx-auto mb-4 h-10 w-10 text-muted-foreground" />
            <h2 className="text-lg font-semibold">No saved properties yet</h2>
            <p className="mt-2 text-sm text-muted-foreground">Tap the heart on any listing to keep it here.</p>
            <Button className="mt-5" asChild><Link href="/listings">Browse properties</Link></Button>
          </CardContent>
        </Card>
      )}

      {status !== "error" && favoriteIds.length > 0 && listings.length > 0 && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {listings.map((listing) => <ListingCard key={listing.id} listing={listing} />)}
        </div>
      )}

      {status !== "error" && favoriteIds.length > 0 && status === "loading" && listings.length === 0 && (
        <p className="text-sm text-muted-foreground">Loading saved properties…</p>
      )}

      {status !== "error" && favoriteIds.length > 0 && status === "ready" && listings.length === 0 && (
        <p className="text-sm text-muted-foreground">Some saved listings are no longer available.</p>
      )}
    </div>
  );
}

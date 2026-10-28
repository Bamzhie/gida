"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Heart } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getFavoriteIds, saveFavorite, clearFavorites } from "@/lib/preview-storage";
import { PREVIEW_PROPERTIES } from "@/lib/preview-data";
import { ListingCard } from "@/components/marketplace/listing-card";

export default function FavoritesPage() {
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const favorites = useMemo(
    () => favoriteIds.map((id) => PREVIEW_PROPERTIES.find((property) => property.id === id)).filter((property) => property !== undefined),
    [favoriteIds]
  );

  useEffect(() => {
    const load = () => {
      setFavoriteIds(getFavoriteIds());
      setHydrated(true);
    };
    if (typeof window !== "undefined") {
      const timer = window.setTimeout(load, 0);
      return () => window.clearTimeout(timer);
    }
  }, []);

  if (!hydrated) return <div className="container mx-auto flex justify-center px-4 py-20 text-sm text-muted-foreground">Loading saved properties…</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div><h1 className="font-heading text-3xl font-semibold">Saved properties</h1><p className="mt-1 text-muted-foreground">Your preview favorites are stored in this browser.</p></div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" asChild><Link href="/listings">Explore listings</Link></Button>
          {favorites.length > 0 && <Button variant="ghost" onClick={() => { clearFavorites(); setFavoriteIds([]); }}>Clear saved properties</Button>}
        </div>
      </div>
      {favorites.length === 0 ? (
        <Card className="mx-auto max-w-lg text-center"><CardContent className="pt-10 pb-10"><Heart className="mx-auto mb-4 h-10 w-10 text-muted-foreground" /><h2 className="text-lg font-semibold">No saved properties yet</h2><p className="mt-2 text-sm text-muted-foreground">Tap the heart on any preview listing to keep it here.</p><Button className="mt-5" asChild><Link href="/listings">Browse properties</Link></Button></CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {favorites.map((property) => (
            <ListingCard key={property.id} property={property} favorite onFavorite={() => setFavoriteIds(saveFavorite(property.id))} />
          ))}
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Heart, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getFavoriteIds, saveFavorite, clearPreviewData } from "@/lib/preview-storage";
import { PREVIEW_PROPERTIES } from "@/lib/preview-data";
import { formatPrice } from "@/lib/utils";

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
        <div><h1 className="text-3xl font-bold">Saved properties</h1><p className="mt-1 text-muted-foreground">Your preview favorites are stored in this browser.</p></div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" asChild><Link href="/listings">Explore listings</Link></Button>
          {favorites.length > 0 && <Button variant="ghost" onClick={() => { clearPreviewData(); setFavoriteIds([]); }}>Clear preview data</Button>}
        </div>
      </div>
      {favorites.length === 0 ? (
        <Card className="mx-auto max-w-lg text-center"><CardContent className="pt-10 pb-10"><Heart className="mx-auto mb-4 h-10 w-10 text-muted-foreground" /><h2 className="text-lg font-semibold">No saved properties yet</h2><p className="mt-2 text-sm text-muted-foreground">Tap the heart on any preview listing to keep it here.</p><Button className="mt-5" asChild><Link href="/listings">Browse properties</Link></Button></CardContent></Card>
      ) : (
        <div className="space-y-3">
          {favorites.map((property) => (
            <Card key={property.id}><CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center"><div className="flex h-24 w-full shrink-0 items-center justify-center rounded-xl bg-secondary sm:w-36"><span className="text-sm text-muted-foreground">Preview image</span></div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h2 className="font-semibold">{property.title}</h2><Badge variant="secondary">For {property.listingType === "SALE" ? "Sale" : "Rent"}</Badge></div><p className="mt-1 text-sm text-muted-foreground">{property.address}, {property.city}</p><p className="mt-2 font-bold text-primary">{formatPrice(property.price)}</p></div><div className="flex gap-2"><Button asChild><Link href={`/listings/${property.id}`}>View</Link></Button><Button variant="ghost" size="icon" aria-label={`Remove ${property.title} from favorites`} onClick={() => setFavoriteIds(saveFavorite(property.id))}><X className="h-4 w-4" /></Button></div></CardContent></Card>
          ))}
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Bath, Bed, Heart, MapPin, Maximize } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PropertyArtwork } from "@/components/marketplace/property-artwork";
import { formatArea, listingPriceLabel, type ListingCardModel } from "@/lib/listing-view";
import { getFavoriteIds, saveFavorite } from "@/lib/preview-storage";
import { formatDate, formatListingStatus } from "@/lib/utils";

export function ListingCard({ listing }: { listing: ListingCardModel }) {
  const [favorite, setFavorite] = useState(false);

  useEffect(() => {
    const sync = () => setFavorite(getFavoriteIds().includes(listing.id));
    sync();
    window.addEventListener("gida:favorites-changed", sync);
    return () => window.removeEventListener("gida:favorites-changed", sync);
  }, [listing.id]);

  function toggleFavorite() {
    const next = saveFavorite(listing.id);
    setFavorite(next.includes(listing.id));
    window.dispatchEvent(new Event("gida:favorites-changed"));
  }

  const location = [listing.addressLine, listing.area, listing.state].filter(Boolean).join(", ");
  const size = formatArea(listing.sizeSqm);

  return (
    <Card className="group relative overflow-hidden transition-shadow hover:shadow-lg">
      <Link href={`/listings/${listing.id}`} aria-label={`View ${listing.title}`} className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
        <div className="relative h-48 overflow-hidden bg-secondary">
          {listing.primaryImage ? (
            <Image
              src={listing.primaryImage.url}
              alt={listing.title}
              fill
              sizes="(min-width: 1280px) 30vw, (min-width: 768px) 45vw, 100vw"
              className="object-cover"
            />
          ) : (
            <PropertyArtwork propertyType={listing.propertyType} className="absolute inset-0 h-full w-full" />
          )}
          <Badge className="absolute left-3 top-3" variant={listing.listingType === "SALE" ? "default" : "secondary"}>
            For {listing.listingType === "SALE" ? "Sale" : "Rent"}
          </Badge>
          <Badge
            className="absolute left-3 top-12"
            variant={listing.availability === "AVAILABLE" ? "success" : listing.availability === "PENDING" ? "warning" : "outline"}
          >
            {formatListingStatus(listing.availability)}
          </Badge>
        </div>
      </Link>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label={favorite ? `Remove ${listing.title} from favorites` : `Save ${listing.title}`}
        aria-pressed={favorite}
        onClick={toggleFavorite}
        className="absolute right-3 top-3 rounded-full bg-background/85 backdrop-blur-sm hover:bg-background"
      >
        <Heart className={`h-4 w-4 ${favorite ? "fill-accent text-accent" : ""}`} />
      </Button>
      <CardContent className="pt-4">
        <Link href={`/listings/${listing.id}`} className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
          <div className="mb-1 flex items-center justify-between gap-2">
            <span className="text-lg font-bold text-primary">{listingPriceLabel(listing)}</span>
            <Badge variant="outline">{listing.propertyType}</Badge>
          </div>
          <h3 className="line-clamp-1 font-heading text-base font-semibold">{listing.title}</h3>
          <p className="mt-2 flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span className="line-clamp-1">{location || listing.state || "Lagos"}</span>
          </p>
          <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
            {listing.bedrooms !== null && <span className="flex items-center gap-1"><Bed className="h-3.5 w-3.5" />{listing.bedrooms} beds</span>}
            {listing.bathrooms !== null && <span className="flex items-center gap-1"><Bath className="h-3.5 w-3.5" />{listing.bathrooms} baths</span>}
            {size && <span className="flex items-center gap-1"><Maximize className="h-3.5 w-3.5" />{size}</span>}
          </div>
        </Link>
        <p className="mt-3 text-xs text-muted-foreground">
          {listing.confirmedAt ? `Confirmed ${formatDate(listing.confirmedAt)}` : "Awaiting confirmation"}
          {listing.hasDisclosedFees ? " · Some fees disclosed" : ""}
        </p>
      </CardContent>
    </Card>
  );
}

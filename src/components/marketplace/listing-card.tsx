"use client";

/* eslint-disable @next/next/no-img-element -- Listing photos can be hosted by advertiser-selected external media providers. */

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bath, Bed, Heart, House, Mail, MapPin, Maximize, Phone } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PropertyArtwork } from "@/components/marketplace/property-artwork";
import { formatArea, listingPriceLabel, type ListingCardModel } from "@/lib/listing-view";
import { resolveMediaUrl } from "@/lib/media";
import { formatDate, formatListingStatus } from "@/lib/utils";
import { PROPERTY_TYPE_OPTIONS } from "@/lib/vocabulary";

type Props = { listing: ListingCardModel; saved: boolean; mediaOrigin: string };

export function ListingCard({ listing, saved, mediaOrigin }: Props) {
  const router = useRouter();
  const [favorite, setFavorite] = useState(saved);

  async function toggleFavorite() {
    const next = !favorite;
    setFavorite(next);
    const response = await fetch(`/api/favorites/${listing.id}`, { method: next ? "PUT" : "DELETE" });

    if (response.status === 401) {
      setFavorite(!next);
      toast("Sign in to save properties.", {
        action: {
          label: "Sign in",
          onClick: () => {
            const returnPath = `${window.location.pathname}${window.location.search}${window.location.hash}`;
            router.push(`/login?next=${encodeURIComponent(returnPath)}`);
          },
        },
      });
      return;
    }
    if (!response.ok) {
      setFavorite(!next);
      const code = await response.json().then((body) => body?.type ?? "").catch(() => "");
      toast.error(
        code.endsWith("/listing_not_found")
          ? "This property is no longer available."
          : next ? "Could not save this property." : "Could not remove this property."
      );
      return;
    }
    toast.success(next ? "Property saved." : "Removed from saved properties.");
    router.refresh();
  }

  const location = [listing.addressLine, listing.area, listing.state].filter(Boolean).join(", ");
  const size = formatArea(listing.sizeSqm);
  const propertyTypeLabel = PROPERTY_TYPE_OPTIONS.find(({ value }) => value === listing.propertyType)?.label ?? listing.propertyType;
  const agencyLabel = listing.advertiser.agencyName?.trim() || listing.advertiser.name.trim() || "Gida advertiser";
  const agencyMark = agencyLabel.split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "G";
  const primaryImageUrl = listing.primaryImage
    ? resolveMediaUrl(mediaOrigin, listing.primaryImage.url)
    : null;
  const callHref = listing.advertiser.phone?.trim()
    ? `tel:${listing.advertiser.phone.trim().replace(/[^\d+]/g, "")}`
    : null;

  return (
    <Card className="group relative overflow-hidden transition-shadow hover:shadow-lg">
      <Link href={`/listings/${listing.id}`} aria-label={`View ${listing.title}`} className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
        <div className="relative aspect-[1.55/1] w-full overflow-hidden bg-secondary">
          {primaryImageUrl ? (
            <img
              src={primaryImageUrl}
              alt={listing.title}
              loading="lazy"
              decoding="async"
              className="absolute inset-0 h-full w-full object-cover"
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
      <div className="bg-secondary/70 px-4 py-2.5">
        <p className="text-xl font-bold leading-tight text-primary">{listingPriceLabel(listing)}</p>
      </div>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <Link href={`/listings/${listing.id}`} className="min-w-0 flex-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
              <h3 className="line-clamp-2 font-heading text-base font-semibold leading-5">{listing.title}</h3>
              <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span className="line-clamp-1">{location || listing.state || "Lagos"}</span>
              </p>
          </Link>
          <Link
            href={`/agents/${listing.advertiser.id}`}
            target="_blank"
            rel="noreferrer"
            aria-label={`Open ${agencyLabel} advertiser profile in a new tab`}
            title={agencyLabel}
            className="grid size-11 shrink-0 place-items-center rounded-sm bg-primary px-1 text-xs font-semibold text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {agencyMark}
          </Link>
        </div>
        <Link href={`/listings/${listing.id}`} className="mt-4 block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-y border-border/80 py-3 text-sm">
            <span className="flex items-center gap-1.5 font-medium">
              <House className="size-4 shrink-0" aria-hidden="true" />
              {propertyTypeLabel}
            </span>
            {listing.bedrooms !== null && (
              <>
                <span className="h-5 w-px bg-border" aria-hidden="true" />
                <span className="flex items-center gap-1.5">
                  <Bed className="size-4 shrink-0" aria-hidden="true" />
                  {listing.bedrooms}
                </span>
              </>
            )}
            {listing.bathrooms !== null && (
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Bath className="size-4 shrink-0" aria-hidden="true" />
                {listing.bathrooms}
              </span>
            )}
            {size && (
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Maximize className="size-4 shrink-0" aria-hidden="true" />
                {size}
              </span>
            )}
          </div>
        </Link>
        <div className="mt-3 flex flex-wrap gap-x-2 gap-y-1 text-xs text-muted-foreground">
          <span>{listing.confirmedAt ? `Confirmed ${formatDate(listing.confirmedAt)}` : "Awaiting confirmation"}</span>
          {listing.hasDisclosedFees && <span>· Some fees disclosed</span>}
        </div>
        <div className="mt-3 flex items-center gap-3 border-t border-border pt-2">
          {callHref && (
            <a href={callHref} className="inline-flex min-h-10 flex-1 items-center gap-2 rounded-lg px-1 text-sm font-semibold text-primary transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <Phone className="size-4" aria-hidden="true" />
              Call
            </a>
          )}
          <Link
            href={`/listings/${listing.id}#contact-advertiser`}
            className="inline-flex min-h-10 flex-1 items-center gap-2 rounded-lg px-1 text-sm font-semibold text-primary transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Mail className="size-4" aria-hidden="true" />
            Contact
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

import Image from "next/image";
import Link from "next/link";
import { Bath, Bed, Heart, MapPin, Maximize } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PropertyArtwork } from "@/components/marketplace/property-artwork";
import type { PreviewProperty } from "@/lib/preview-data";
import { formatDate, formatListingStatus, formatPrice, formatPricePeriod } from "@/lib/utils";

type ListingCardProps = {
  property: PreviewProperty;
  favorite?: boolean;
  onFavorite?: () => void;
};

export function ListingCard({ property, favorite = false, onFavorite }: ListingCardProps) {
  const hasDisclosedFees = Object.values(property.costs).some((amount) => amount !== undefined);

  return (
    <Card className="group relative overflow-hidden transition-shadow hover:shadow-lg">
      <Link href={`/listings/${property.id}`} aria-label={`View ${property.title}`} className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
        <div className="relative h-48 overflow-hidden bg-secondary">
          {property.images[0] ? (
            <Image
              src={property.images[0].url}
              alt={property.title}
              fill
              sizes="(min-width: 1280px) 30vw, (min-width: 768px) 45vw, 100vw"
              className="object-cover"
            />
          ) : <PropertyArtwork propertyType={property.propertyType} className="absolute inset-0 h-full w-full" />}
          <Badge className="absolute left-3 top-3" variant={property.listingType === "SALE" ? "default" : "secondary"}>For {property.listingType === "SALE" ? "Sale" : "Rent"}</Badge>
          <Badge className={`absolute ${onFavorite ? "left-3 top-12" : "right-3 top-3"}`} variant={property.status === "AVAILABLE" ? "success" : property.status === "PENDING" ? "warning" : "outline"}>{formatListingStatus(property.status)}</Badge>
        </div>
      </Link>
      {onFavorite && <Button type="button" variant="ghost" size="icon" aria-label={favorite ? `Remove ${property.title} from favorites` : `Save ${property.title}`} aria-pressed={favorite} onClick={onFavorite} className="absolute right-3 top-3 rounded-full bg-background/85 backdrop-blur-sm hover:bg-background"><Heart className={`h-4 w-4 ${favorite ? "fill-accent text-accent" : ""}`} /></Button>}
      <CardContent className="pt-4">
        <Link href={`/listings/${property.id}`} className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
          <div className="mb-1 flex items-center justify-between gap-2"><span className="text-lg font-bold text-primary">{formatPrice(property.price)} <span className="text-xs font-medium text-muted-foreground">{formatPricePeriod(property)}</span></span><Badge variant="outline">{property.propertyType}</Badge></div>
          <h3 className="line-clamp-1 font-heading text-base font-semibold">{property.title}</h3>
          <p className="mt-2 flex items-center gap-1 text-sm text-muted-foreground"><MapPin className="h-4 w-4 shrink-0" aria-hidden="true" /><span className="line-clamp-1">{property.address}, {property.city}</span></p>
          <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">{property.bedrooms !== null && <span className="flex items-center gap-1"><Bed className="h-3.5 w-3.5" />{property.bedrooms} beds</span>}{property.bathrooms !== null && <span className="flex items-center gap-1"><Bath className="h-3.5 w-3.5" />{property.bathrooms} baths</span>}{property.sqft && <span className="flex items-center gap-1"><Maximize className="h-3.5 w-3.5" />{property.sqft} sqft</span>}</div>
        </Link>
        <p className="mt-3 text-xs text-muted-foreground">Confirmed {formatDate(property.confirmedAt)}{hasDisclosedFees ? " · Some fees disclosed" : ""}</p>
      </CardContent>
    </Card>
  );
}

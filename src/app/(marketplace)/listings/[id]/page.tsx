import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Bed, Bath, Building2, CalendarDays, Car, Check, MapPin, ShieldCheck } from "lucide-react";
import { getPreviewProperty } from "@/lib/preview-listings";
import { formatDate, formatListingStatus, formatPrice, formatPricePeriod } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ListingActions } from "@/components/marketplace/listing-actions";
import { PropertyArtwork } from "@/components/marketplace/property-artwork";
import { ListingCard } from "@/components/marketplace/listing-card";
import { PREVIEW_PROPERTIES } from "@/lib/preview-data";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const property = getPreviewProperty(id);
  if (!property) return { title: "Property not found" };
  return {
    title: property.title,
    description: property.description,
    alternates: { canonical: `/listings/${property.id}` },
  };
}

function CostRow({ label, amount }: { label: string; amount?: number }) {
  if (amount === undefined) return null;
  return <div className="flex items-center justify-between border-b border-border py-2.5 text-sm"><span className="text-muted-foreground">{label}</span><span className="font-medium">{formatPrice(amount)}</span></div>;
}

export default async function ListingDetailPage({ params }: Props) {
  const { id } = await params;
  const property = getPreviewProperty(id);
  if (!property) notFound();

  const costRows = [
    ["Price", property.price],
    ["Agency fee", property.costs.agencyFee],
    ["Legal fee", property.costs.legalFee],
    ["Caution / deposit", property.costs.caution],
    ["Service charge", property.costs.serviceCharge],
    ["Other disclosed costs", property.costs.other],
  ] as const;
  const total = costRows.reduce((sum, [, amount]) => sum + (amount ?? 0), 0);
  const inSameArea = PREVIEW_PROPERTIES.filter((candidate) => candidate.id !== property.id && candidate.city === property.city)
    .sort((a, b) => Math.abs(a.price - property.price) - Math.abs(b.price - property.price));
  const similarProperties = (inSameArea.length > 0 ? inSameArea : PREVIEW_PROPERTIES.filter((candidate) => candidate.id !== property.id && candidate.listingType === property.listingType && candidate.propertyType === property.propertyType)
    .sort((a, b) => Math.abs(a.price - property.price) - Math.abs(b.price - property.price))).slice(0, 3);

  return (
    <div className="container mx-auto px-4 py-8">
      <Link href={`/listings?city=${encodeURIComponent(property.city)}`} className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground">← Back to {property.city} listings</Link>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="mb-2 text-sm text-muted-foreground">Preview listing</p>
          <h1 className="font-heading text-3xl font-semibold">{property.title}</h1>
          <p className="mt-2 flex items-center gap-1 text-sm text-muted-foreground"><MapPin className="h-4 w-4" />{property.address}, {property.city}, {property.state}</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-primary">{formatPrice(property.price)}</p>
          <p className="text-sm text-muted-foreground">{formatPricePeriod(property)}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
        <div className="space-y-6">
          <Card className="overflow-hidden">
            <div className="relative h-72 overflow-hidden bg-secondary sm:h-96">
              {property.images[0] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={property.images[0].url} alt={property.title} className="h-full w-full object-cover" />
              ) : (
                <PropertyArtwork propertyType={property.propertyType} className="absolute inset-0 h-full w-full" />
              )}
            </div>
            <CardContent className="pt-5">
              <div className="flex flex-wrap gap-2">
                <Badge variant={property.listingType === "SALE" ? "default" : "secondary"}>For {property.listingType === "SALE" ? "Sale" : "Rent"}</Badge>
                <Badge variant="outline">{property.propertyType}</Badge>
                <Badge variant={property.status === "AVAILABLE" ? "success" : property.status === "PENDING" ? "warning" : "outline"}>{formatListingStatus(property.status)}</Badge>
              </div>
              <p className="mt-5 text-base leading-7 text-muted-foreground">{property.description}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <h2 className="mb-5 text-xl font-semibold">Property details</h2>
              <div className="grid grid-cols-2 gap-5 sm:grid-cols-4">
                {property.bedrooms !== null && <div><Bed className="mb-2 h-5 w-5 text-accent" /><p className="text-sm text-muted-foreground">Bedrooms</p><p className="font-semibold">{property.bedrooms}</p></div>}
                {property.bathrooms !== null && <div><Bath className="mb-2 h-5 w-5 text-accent" /><p className="text-sm text-muted-foreground">Bathrooms</p><p className="font-semibold">{property.bathrooms}</p></div>}
                {property.sqft && <div><Building2 className="mb-2 h-5 w-5 text-accent" /><p className="text-sm text-muted-foreground">Size</p><p className="font-semibold">{property.sqft} sqft</p></div>}
                {property.parking > 0 && <div><Car className="mb-2 h-5 w-5 text-accent" /><p className="text-sm text-muted-foreground">Parking</p><p className="font-semibold">{property.parking} space{property.parking === 1 ? "" : "s"}</p></div>}
              </div>
              {property.lotSize && <p className="mt-5 text-sm text-muted-foreground">Lot size: <span className="font-medium text-foreground">{property.lotSize}</span></p>}
              <div className="mt-6 border-t border-border pt-5">
                <h3 className="mb-3 font-semibold">Amenities</h3>
                <div className="flex flex-wrap gap-2">{property.amenities.map((amenity) => <Badge key={amenity} variant="secondary">{amenity}</Badge>)}</div>
                <p className="mt-3 text-sm text-muted-foreground">Furnishing: {property.furnished ? "Furnished" : "Unfurnished"}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardContent className="pt-6">
              <h2 className="mb-3 text-lg font-semibold">Advertiser</h2>
              <p className="font-medium">{property.agentName}</p>
              <ListingActions
                propertyId={property.id}
                propertyTitle={property.title}
                agentName={property.agentName}
                agentPhone={property.agentPhone}
              />
              <p className="mt-3 text-center text-xs text-muted-foreground">Contact actions are available as a local preview.</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <h2 className="mb-1 text-lg font-semibold">Cost breakdown</h2>
              <p className="mb-4 text-xs text-muted-foreground">Only disclosed figures are shown.</p>
              {costRows.map(([label, amount]) => <CostRow key={label} label={label} amount={amount} />)}
              <div className="mt-3 flex items-center justify-between border-t-2 border-foreground pt-3 font-semibold"><span>Disclosed subtotal</span><span>{formatPrice(total)}</span></div>
              <p className="mt-2 text-xs text-muted-foreground">This subtotal includes only the amounts disclosed above. It may not represent the full move-in cost.</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <h2 className="mb-3 text-lg font-semibold">Listing information</h2>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-muted-foreground" />Illustrative update date: {formatDate(property.updatedAt)}</div>
                <div className="flex items-center gap-2"><Check className="h-4 w-4 text-accent" />Illustrative last-confirmed date: {formatDate(property.confirmedAt)}</div>
                <div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-accent" />Preview verification example</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      {similarProperties.length > 0 && <section className="mt-12" aria-labelledby="similar-homes-heading"><div className="mb-5"><h2 id="similar-homes-heading" className="font-heading text-2xl font-semibold">More homes to consider</h2><p className="mt-1 text-sm text-muted-foreground">{inSameArea.length > 0 ? `Other homes in ${property.city}` : "Similar homes from the preview"}</p></div><div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">{similarProperties.map((candidate) => <ListingCard key={candidate.id} property={candidate} />)}</div></section>}
    </div>
  );
}

import type { Metadata } from "next";
import { cache } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Bath, Bed, Building2, CalendarDays, Car, Check, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ListingActions } from "@/components/marketplace/listing-actions";
import { PropertyArtwork } from "@/components/marketplace/property-artwork";
import { ListingCard } from "@/components/marketplace/listing-card";
import { PropertyGallery } from "@/components/marketplace/property-gallery";
import { ReportListingDialog } from "@/components/marketplace/report-listing-dialog";
import { VerificationBadges } from "@/components/marketplace/verification-badges";
import { getAmenityLabels, getListing, getSimilarListings } from "@/lib/listings";
import { getFavoriteIdSet } from "@/lib/favorites";
import { getVerificationSummary } from "@/lib/verification";
import { getCurrentUser } from "@/lib/session";
import { API_ORIGIN } from "@/lib/api-base";
import { COST_LABELS, disclosedTotal, formatArea, toCardModel, toDetailModel } from "@/lib/listing-view";
import { formatDate, formatListingStatus, formatPrice, formatPricePeriod } from "@/lib/utils";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

const getListingCached = cache(getListing);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const listing = await getListingCached(id);
  if (!listing) return { title: "Property not found" };
  return {
    title: listing.title,
    description: listing.description,
    alternates: { canonical: `/listings/${listing.id}` },
  };
}

function CostRow({ label, amount, hint }: { label: string; amount: number; hint?: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border py-2.5 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">
        {formatPrice(amount)}
        {hint && <span className="ml-1 text-xs font-normal text-muted-foreground">{hint}</span>}
      </span>
    </div>
  );
}

export default async function ListingDetailPage({ params }: Props) {
  const { id } = await params;
  const dto = await getListingCached(id);
  if (!dto) notFound();

  const listing = toDetailModel(dto);
  const [amenityLabels, similarDtos, favorites, verification, viewer] = await Promise.all([
    getAmenityLabels(),
    getSimilarListings(id, 3).catch(() => []),
    getFavoriteIdSet(),
    getVerificationSummary(id),
    getCurrentUser(),
  ]);
  const similar = similarDtos.map(toCardModel);

  const isRent = listing.listingType === "RENT";
  const period = formatPricePeriod(listing);
  const recurringCosts = listing.costs.filter((cost) => cost.type === "SERVICE_CHARGE");
  const oneTimeCosts = listing.costs.filter((cost) => cost.type !== "SERVICE_CHARGE");

  const place = [listing.addressLine, listing.area, listing.state].filter(Boolean).join(", ");
  const area = listing.area ?? listing.state;
  const size = formatArea(listing.sizeSqm);
  const lotSize = formatArea(listing.lotSizeSqm);

  return (
    <div className="container mx-auto px-4 py-8">
      <Link href={area ? `/listings?q=${encodeURIComponent(area)}` : "/listings"} className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground">
        ← Back to listings
      </Link>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-3xl font-semibold">{listing.title}</h1>
          <p className="mt-2 flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            {place || "Lagos"}
          </p>
          <VerificationBadges summary={verification} className="mt-3 flex flex-wrap items-center gap-2" />
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-primary">{formatPrice(listing.price)}</p>
          <p className="text-sm text-muted-foreground">{period}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
        <div className="space-y-6">
          <Card className="overflow-hidden">
            {listing.media.length > 0 ? (
              <PropertyGallery media={listing.media} title={listing.title} mediaOrigin={API_ORIGIN} />
            ) : (
              <div className="relative h-72 overflow-hidden bg-secondary sm:h-96">
                <PropertyArtwork propertyType={listing.propertyType} className="absolute inset-0 h-full w-full" />
              </div>
            )}
            <CardContent className="pt-5">
              <div className="flex flex-wrap gap-2">
                <Badge variant={listing.listingType === "SALE" ? "default" : "secondary"}>
                  For {listing.listingType === "SALE" ? "Sale" : "Rent"}
                </Badge>
                <Badge variant="outline">{listing.propertyType}</Badge>
                <Badge variant={listing.availability === "AVAILABLE" ? "success" : listing.availability === "PENDING" ? "warning" : "outline"}>
                  {formatListingStatus(listing.availability)}
                </Badge>
              </div>
              <p className="mt-5 text-base leading-7 text-muted-foreground">{listing.description}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <h2 className="mb-5 text-xl font-semibold">Property details</h2>
              <div className="grid grid-cols-2 gap-5 sm:grid-cols-4">
                {listing.bedrooms !== null && (
                  <div><Bed className="mb-2 h-5 w-5 text-accent" /><p className="text-sm text-muted-foreground">Bedrooms</p><p className="font-semibold">{listing.bedrooms}</p></div>
                )}
                {listing.bathrooms !== null && (
                  <div><Bath className="mb-2 h-5 w-5 text-accent" /><p className="text-sm text-muted-foreground">Bathrooms</p><p className="font-semibold">{listing.bathrooms}</p></div>
                )}
                {size && (
                  <div><Building2 className="mb-2 h-5 w-5 text-accent" /><p className="text-sm text-muted-foreground">Size</p><p className="font-semibold">{size}</p></div>
                )}
                {listing.parking > 0 && (
                  <div><Car className="mb-2 h-5 w-5 text-accent" /><p className="text-sm text-muted-foreground">Parking</p><p className="font-semibold">{listing.parking} space{listing.parking === 1 ? "" : "s"}</p></div>
                )}
              </div>
              {lotSize && (
                <p className="mt-5 text-sm text-muted-foreground">Lot size: <span className="font-medium text-foreground">{lotSize}</span></p>
              )}
              {listing.yearBuilt !== null && (
                <p className="mt-2 text-sm text-muted-foreground">Year built: <span className="font-medium text-foreground">{listing.yearBuilt}</span></p>
              )}
              <div className="mt-6 border-t border-border pt-5">
                <h3 className="mb-3 font-semibold">Amenities</h3>
                {listing.amenities.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {listing.amenities.map((slug) => (
                      <Badge key={slug} variant="secondary">{amenityLabels[slug] ?? slug}</Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">The advertiser has not listed amenities for this property.</p>
                )}
                <p className="mt-3 text-sm text-muted-foreground">Furnishing: {listing.furnished ? "Furnished" : "Unfurnished"}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardContent className="pt-6">
              <h2 className="mb-1 text-lg font-semibold">Advertiser</h2>
              <p className="font-medium">{listing.advertiser.name}</p>
              {listing.advertiser.agencyName && (
                <p className="text-sm text-muted-foreground">{listing.advertiser.agencyName}</p>
              )}
              <div className="mt-4">
                <ListingActions
                  key={`${listing.id}-${favorites.has(id) ? "s" : "u"}`}
                  propertyId={listing.id}
                  propertyTitle={listing.title}
                  agentName={listing.advertiser.name}
                  agentPhone={listing.advertiser.phone ?? undefined}
                  saved={favorites.has(id)}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <h2 className="mb-1 text-lg font-semibold">Cost breakdown</h2>
              <p className="mb-4 text-xs text-muted-foreground">Only figures the advertiser disclosed are shown.</p>
              {isRent ? (
                <>
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Recurring</p>
                  <CostRow label="Rent" amount={listing.price} hint={period} />
                  {recurringCosts.map((cost) => (
                    <CostRow key={cost.type} label={COST_LABELS[cost.type]} amount={cost.amount} />
                  ))}
                </>
              ) : (
                <CostRow label="Asking price" amount={listing.price} />
              )}
              {oneTimeCosts.length > 0 && (
                <>
                  <p className="mb-1 mt-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">One-time</p>
                  {oneTimeCosts.map((cost) => (
                    <CostRow key={cost.type} label={COST_LABELS[cost.type]} amount={cost.amount} />
                  ))}
                </>
              )}
              <div className="mt-3 flex items-center justify-between border-t-2 border-foreground pt-3 font-semibold">
                <span>{isRent ? "First period, as disclosed" : "Total disclosed"}</span>
                <span>{formatPrice(disclosedTotal(listing))}</span>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Includes only the amounts shown above. A caution or deposit is normally refundable, and this total may not cover every move-in cost.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <h2 className="mb-3 text-lg font-semibold">Listing information</h2>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-muted-foreground" />
                  Published {formatDate(listing.publishedAt ?? listing.createdAt)}
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-accent" />
                  {listing.confirmedAt ? `Last confirmed ${formatDate(listing.confirmedAt)}` : "Not yet confirmed by the advertiser"}
                </div>
                {listing.expiresAt && (
                  <div className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-muted-foreground" />
                    Listed until {formatDate(listing.expiresAt)}
                  </div>
                )}
                <div className="border-t border-border pt-3">
                  <ReportListingDialog
                    listingId={listing.id}
                    listingTitle={listing.title}
                    signedIn={viewer !== null}
                    returnPath={`/listings/${listing.id}`}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {similar.length > 0 && (
        <section className="mt-12" aria-labelledby="similar-homes-heading">
          <div className="mb-5">
            <h2 id="similar-homes-heading" className="font-heading text-2xl font-semibold">More homes to consider</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {area ? `Other homes in ${area}` : "Other homes on Gida"}
            </p>
          </div>
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {similar.map((candidate) => (
              <ListingCard
                key={`${candidate.id}-${favorites.has(candidate.id) ? "s" : "u"}`}
                listing={candidate}
                saved={favorites.has(candidate.id)}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

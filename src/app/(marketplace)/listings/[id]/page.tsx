import type { Metadata } from "next";
import { cache } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Bath, Bed, Building2, CalendarDays, Check, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ListingActions } from "@/components/marketplace/listing-actions";
import { ListingSummaryActions } from "@/components/marketplace/listing-summary-actions";
import { initialsOf } from "@/lib/advertisers";
import { PropertyArtwork } from "@/components/marketplace/property-artwork";
import { ListingCard } from "@/components/marketplace/listing-card";
import { PropertyGallery } from "@/components/marketplace/property-gallery";
import { ReportListingDialog } from "@/components/marketplace/report-listing-dialog";
import { VerificationBadges } from "@/components/marketplace/verification-badges";
import { getAmenityLabels, getListing, getSimilarListings, searchListings } from "@/lib/listings";
import { getFavoriteIdSet } from "@/lib/favorites";
import { getVerificationSummary } from "@/lib/verification";
import { getCurrentUser } from "@/lib/session";
import { API_ORIGIN } from "@/lib/api-base";
import { COST_LABELS, disclosedTotal, formatArea, toCardModel, toDetailModel } from "@/lib/listing-view";
import { formatDate, formatListingStatus, formatPrice, formatPricePeriod } from "@/lib/utils";
import { PROPERTY_TYPE_OPTIONS } from "@/lib/vocabulary";
import { ListingLocationMap } from "@/components/marketplace/listing-location-map";

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
  const [amenityLabels, similarDtos, advertiserListingsPage, favorites, verification, viewer] = await Promise.all([
    getAmenityLabels(),
    getSimilarListings(id, 3).catch(() => []),
    searchListings({ advertiser: listing.advertiser.id, size: 4 }).catch(() => null),
    getFavoriteIdSet(),
    getVerificationSummary(id),
    getCurrentUser(),
  ]);
  const similar = similarDtos.map(toCardModel);
  const advertiserListings = (advertiserListingsPage?.items ?? [])
    .filter((candidate) => candidate.id !== listing.id)
    .slice(0, 3)
    .map(toCardModel);
  const otherAdvertiserCount = Math.max((advertiserListingsPage?.total ?? 0) - 1, 0);

  const isRent = listing.listingType === "RENT";
  const period = formatPricePeriod(listing);
  const recurringCosts = listing.costs.filter((cost) => cost.type === "SERVICE_CHARGE");
  const oneTimeCosts = listing.costs.filter((cost) => cost.type !== "SERVICE_CHARGE");

  const place = [listing.addressLine, listing.area, listing.state].filter(Boolean).join(", ");
  const area = listing.area ?? listing.state;
  const size = formatArea(listing.sizeSqm);
  const lotSize = formatArea(listing.lotSizeSqm);
  const propertyTypeLabel = PROPERTY_TYPE_OPTIONS.find(({ value }) => value === listing.propertyType)?.label ?? listing.propertyType;
  const keyFeatures = [
    listing.bedrooms !== null ? `${listing.bedrooms} bedroom${listing.bedrooms === 1 ? "" : "s"}` : null,
    listing.bathrooms !== null ? `${listing.bathrooms} bathroom${listing.bathrooms === 1 ? "" : "s"}` : null,
    size,
    listing.parking > 0 ? `${listing.parking} parking space${listing.parking === 1 ? "" : "s"}` : null,
    listing.furnished ? "Furnished" : null,
    ...listing.amenities.map((slug) => amenityLabels[slug] ?? slug),
  ].filter((feature): feature is string => Boolean(feature));
  const mapHref = listing.latitude !== null && listing.longitude !== null
    ? `https://www.openstreetmap.org/?mlat=${listing.latitude}&mlon=${listing.longitude}#map=16/${listing.latitude}/${listing.longitude}`
    : null;

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8 sm:py-10">
      <Link href={area ? `/listings?q=${encodeURIComponent(area)}` : "/listings"} className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground">
        ← Back to listings
      </Link>
      <div className="grid items-start gap-7 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-8">
        <main className="min-w-0 space-y-7">
          <Card className="overflow-hidden rounded-2xl border-0 shadow-sm">
            {listing.media.length > 0 ? (
              <PropertyGallery media={listing.media} title={listing.title} mediaOrigin={API_ORIGIN} />
            ) : (
              <div className="relative h-72 overflow-hidden bg-secondary sm:h-96">
                <PropertyArtwork propertyType={listing.propertyType} className="absolute inset-0 h-full w-full" />
              </div>
            )}
          </Card>

          <header className="border-b border-border pb-6">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              {listing.category === "NEW_HOMES" && <Badge variant="success" className="uppercase tracking-wide">New home</Badge>}
              {listing.category !== "NEW_HOMES" && <Badge variant="secondary">For {listing.listingType === "SALE" ? "sale" : "rent"}</Badge>}
              <Button type="button" size="sm" asChild className="h-7 rounded-full px-3 text-xs font-semibold uppercase tracking-wide">
                <a href="#contact-advertiser"><CalendarDays /> Book viewing</a>
              </Button>
            </div>
            <div className="flex items-start justify-between gap-3">
              <h1 className="flex min-w-0 items-start gap-2 font-heading text-2xl font-semibold leading-tight sm:text-3xl">
                <MapPin className="mt-1 size-5 shrink-0 text-accent" />{place || listing.title}
              </h1>
              <ListingSummaryActions listingId={listing.id} title={listing.title} saved={favorites.has(id)} />
            </div>
            <p className="mt-4 text-2xl font-bold text-primary sm:text-3xl">{formatPrice(listing.price)}</p>
            {isRent && <p className="text-sm text-muted-foreground">{period}</p>}
            {otherAdvertiserCount > 0 && (
              <div className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 border-t border-border pt-3 text-sm">
                <Building2 className="size-4 shrink-0 text-primary" />
                <Link href={`/agents/${listing.advertiser.id}`} className="font-medium text-primary hover:underline">
                  {otherAdvertiserCount} other propert{otherAdvertiserCount === 1 ? "y" : "ies"} from {listing.advertiser.agencyName || listing.advertiser.name}
                </Link>
              </div>
            )}
            <p className="mt-3 text-sm text-muted-foreground">
              Added on {new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(listing.publishedAt ?? listing.createdAt))}
            </p>
          </header>

          <section aria-labelledby="listing-facts-heading" className="border-b border-border pb-5">
            <h2 id="listing-facts-heading" className="sr-only">At a glance</h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="flex items-center gap-3 border-r border-border pr-3">
                <Building2 className="size-5 shrink-0 text-accent" />
                <div><p className="text-xs text-muted-foreground">Property type</p><p className="font-semibold">{propertyTypeLabel}</p></div>
              </div>
              {listing.bedrooms !== null && <div className="flex items-center gap-3"><Bed className="size-5 shrink-0 text-accent" /><div><p className="text-xs text-muted-foreground">Bedrooms</p><p className="font-semibold">{listing.bedrooms}</p></div></div>}
              {listing.bathrooms !== null && <div className="flex items-center gap-3"><Bath className="size-5 shrink-0 text-accent" /><div><p className="text-xs text-muted-foreground">Bathrooms</p><p className="font-semibold">{listing.bathrooms}</p></div></div>}
              {size && <div className="flex items-center gap-3"><Building2 className="size-5 shrink-0 text-accent" /><div><p className="text-xs text-muted-foreground">Floor area</p><p className="font-semibold">{size}</p></div></div>}
            </div>
          </section>

          <VerificationBadges summary={verification} className="flex flex-wrap items-center gap-2" />

          <section aria-labelledby="key-features-heading" className="border-b border-border pb-7">
            <h2 id="key-features-heading" className="mb-4 font-heading text-2xl font-semibold">Key features</h2>
            {keyFeatures.length > 0 ? (
              <ul className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
                {keyFeatures.map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-sm leading-6">
                    <Check className="mt-1 size-4 shrink-0 text-accent" />{feature}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No key features have been provided for this property yet.</p>
            )}
          </section>

          <section aria-labelledby="description-heading" className="border-b border-border pb-7">
            <h2 id="description-heading" className="mb-3 font-heading text-2xl font-semibold">Description</h2>
            <p className="whitespace-pre-line text-base leading-7 text-muted-foreground">{listing.description}</p>
          </section>

          <section aria-labelledby="property-details-heading" className="border-b border-border pb-7">
            <h2 id="property-details-heading" className="mb-4 font-heading text-2xl font-semibold">Property details</h2>
            <dl className="grid gap-x-8 sm:grid-cols-2">
              <div className="flex justify-between gap-3 border-b border-border py-3 text-sm"><dt className="text-muted-foreground">Property type</dt><dd className="font-medium">{propertyTypeLabel}</dd></div>
              <div className="flex justify-between gap-3 border-b border-border py-3 text-sm"><dt className="text-muted-foreground">Listing type</dt><dd className="font-medium">For {listing.listingType === "SALE" ? "sale" : "rent"}</dd></div>
              <div className="flex justify-between gap-3 border-b border-border py-3 text-sm"><dt className="text-muted-foreground">Availability</dt><dd className="font-medium">{formatListingStatus(listing.availability)}</dd></div>
              <div className="flex justify-between gap-3 border-b border-border py-3 text-sm"><dt className="text-muted-foreground">Furnishing</dt><dd className="font-medium">{listing.furnished ? "Furnished" : "Unfurnished"}</dd></div>
              {listing.parking > 0 && <div className="flex justify-between gap-3 border-b border-border py-3 text-sm"><dt className="text-muted-foreground">Parking</dt><dd className="font-medium">{listing.parking} space{listing.parking === 1 ? "" : "s"}</dd></div>}
              {lotSize && <div className="flex justify-between gap-3 border-b border-border py-3 text-sm"><dt className="text-muted-foreground">Lot size</dt><dd className="font-medium">{lotSize}</dd></div>}
              {listing.yearBuilt !== null && <div className="flex justify-between gap-3 border-b border-border py-3 text-sm"><dt className="text-muted-foreground">Year built</dt><dd className="font-medium">{listing.yearBuilt}</dd></div>}
            </dl>
            <h3 className="mb-3 mt-6 font-semibold">Amenities</h3>
            {listing.amenities.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {listing.amenities.map((slug) => <Badge key={slug} variant="secondary">{amenityLabels[slug] ?? slug}</Badge>)}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">The advertiser has not listed amenities for this property.</p>
            )}
          </section>

          <section aria-labelledby="costs-heading" className="border-b border-border pb-7">
              <h2 id="costs-heading" className="mb-1 font-heading text-2xl font-semibold">Price and disclosed costs</h2>
              <p className="mb-4 text-sm text-muted-foreground">Only costs the advertiser has shared are included.</p>
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
          </section>

          <section aria-labelledby="location-heading" className="border-b border-border pb-7">
            <h2 id="location-heading" className="mb-2 font-heading text-2xl font-semibold">Location</h2>
            <p className="mb-4 text-sm text-muted-foreground">{place || "Lagos"}</p>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <p className="flex items-center gap-2 text-sm font-medium"><MapPin className="size-4 text-accent" /> Approximate location</p>
              {mapHref && <Button variant="outline" size="sm" asChild><a href={mapHref} target="_blank" rel="noreferrer">Open map</a></Button>}
            </div>
            {listing.latitude !== null && listing.longitude !== null ? (
              <ListingLocationMap latitude={listing.latitude} longitude={listing.longitude} label={place || "Approximate property location"} />
            ) : (
              <div className="flex h-52 items-center justify-center rounded-xl border border-border bg-secondary/40 px-6 text-center text-sm text-muted-foreground">
                The advertiser has not provided map coordinates for this property.
              </div>
            )}
            <p className="mt-2 text-xs text-muted-foreground">The marker shows an approximate location and may not indicate the exact address.</p>
          </section>

          <Card>
            <CardContent className="pt-6">
              <h2 className="mb-3 font-heading text-xl font-semibold">Listing information</h2>
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
        </main>

        <aside className="lg:sticky lg:top-24">
          <Card className="overflow-hidden rounded-2xl shadow-md">
            <CardContent className="p-5 sm:p-6">
              <div className="mb-5 flex items-center gap-3">
                <Link
                  href={`/agents/${listing.advertiser.id}`}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`Open ${listing.advertiser.agencyName || listing.advertiser.name} advertiser profile in a new tab`}
                  className="grid size-12 shrink-0 place-items-center rounded-xl bg-primary text-sm font-bold text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {initialsOf(listing.advertiser.agencyName || listing.advertiser.name)}
                </Link>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Listed by</p>
                  <Link href={`/agents/${listing.advertiser.id}`} target="_blank" rel="noreferrer" className="block truncate font-semibold hover:underline">
                    {listing.advertiser.agencyName || listing.advertiser.name}
                  </Link>
                  {listing.advertiser.agencyName && <p className="truncate text-sm text-muted-foreground">{listing.advertiser.name}</p>}
                </div>
              </div>
              <ListingActions
                propertyId={listing.id}
                propertyTitle={listing.title}
                agentName={listing.advertiser.name}
                agentPhone={listing.advertiser.phone ?? undefined}
              />
            </CardContent>
          </Card>
        </aside>
      </div>

      {advertiserListings.length > 0 && (
        <section className="mt-12" aria-labelledby="advertiser-listings-heading">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <h2 id="advertiser-listings-heading" className="font-heading text-2xl font-semibold">More homes from this advertiser</h2>
              <p className="mt-1 text-sm text-muted-foreground">Other properties listed by {listing.advertiser.agencyName || listing.advertiser.name}</p>
            </div>
            <Link href={`/agents/${listing.advertiser.id}`} className="shrink-0 text-sm font-semibold text-primary hover:underline">View profile</Link>
          </div>
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {advertiserListings.map((candidate) => (
              <ListingCard key={`${candidate.id}-${favorites.has(candidate.id) ? "s" : "u"}`} listing={candidate} saved={favorites.has(candidate.id)} />
            ))}
          </div>
        </section>
      )}

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

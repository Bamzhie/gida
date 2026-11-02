import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AdminPageHeading } from "@/components/admin/page-heading";
import { PropertyGallery } from "@/components/marketplace/property-gallery";
import { ReviewActions } from "@/components/admin/review-actions";
import { VerificationEditor } from "@/components/admin/verification-editor";
import { getAdminListingDetail, getVerifications } from "@/lib/admin";
import { adminListingIdFromSlug, isListingUuid } from "@/lib/admin-listing-url";
import { API_ORIGIN } from "@/lib/api-base";
import { getListing } from "@/lib/listings";
import { COST_LABELS } from "@/lib/listing-view";
import { formatDate, formatListingStatus, formatPrice, formatPricePeriod } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Review listing",
  description: "Moderate a single listing.",
};

type Props = { params: Promise<{ id: string }> };

export default async function AdminListingDetailPage({ params }: Props) {
  const { id: routeId } = await params;
  const id = adminListingIdFromSlug(routeId) ?? (isListingUuid(routeId) ? routeId : null);
  const detail = id ? await getAdminListingDetail(id) : null;
  if (!detail) notFound();

  const { listing, lifecycle, actions } = detail;
  const listingType = listing.pricePeriod ? "RENT" : "SALE";
  const period = formatPricePeriod({ listingType, pricePeriod: listing.pricePeriod });
  const [verifications, advertiserVerifications, publicListing] = await Promise.all([
    getVerifications("LISTING", listing.id),
    getVerifications("ADVERTISER", listing.advertiser.id),
    lifecycle === "PUBLISHED" ? getListing(listing.id).catch(() => null) : Promise.resolve(null),
  ]);

  return (
    <div className="space-y-6">
      <Link href="/admin/listings" className="inline-flex text-sm text-muted-foreground hover:text-foreground">
        ← Back to the queue
      </Link>

      <AdminPageHeading
        eyebrow="Listing review"
        title={listing.title}
        description={[listing.addressLine, listing.area, listing.state].filter(Boolean).join(", ") || "No location given"}
        action={
          <div className="flex flex-col items-start gap-2 sm:items-end">
            <Badge variant="warning">{lifecycle.replace(/_/g, " ").toLowerCase()}</Badge>
            <div className="sm:text-right">
              <p className="text-xl font-bold text-primary">{formatPrice(listing.price)}</p>
              <p className="text-sm text-muted-foreground">{period}</p>
            </div>
            {publicListing ? (
              <Button asChild size="sm" variant="outline">
                <Link href={`/listings/${listing.id}`} target="_blank" rel="noopener noreferrer">
                  View public listing <ArrowUpRight aria-hidden="true" />
                </Link>
              </Button>
            ) : (
              <Button type="button" size="sm" variant="outline" disabled>
                {lifecycle === "PUBLISHED" ? "Not publicly available" : "Not public yet"}
              </Button>
            )}
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.45fr)_minmax(19rem,0.8fr)] lg:items-start">
        <div className="space-y-6">
          <Card className="rounded-2xl">
            <CardContent className="pt-6">
              <h3 className="mb-3 font-heading text-lg font-semibold">Listing content</h3>
              <p className="whitespace-pre-line text-sm leading-6 text-muted-foreground">{listing.description}</p>
              <dl className="mt-5 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
                <Fact label="Type" value={listing.propertyType} />
                <Fact label="Category" value={listing.category.replace(/_/g, " ").toLowerCase()} />
                <Fact label="For" value={listingType === "RENT" ? "Rent" : "Sale"} />
                <Fact label="Bedrooms" value={listing.bedrooms?.toString() ?? "—"} />
                <Fact label="Bathrooms" value={listing.bathrooms?.toString() ?? "—"} />
                <Fact label="Size" value={listing.sizeSqm ? `${listing.sizeSqm} m²` : "—"} />
                <Fact label="Lot size" value={listing.lotSizeSqm ? `${listing.lotSizeSqm} m²` : "—"} />
                <Fact label="Year built" value={listing.yearBuilt?.toString() ?? "—"} />
                <Fact label="Furnished" value={listing.furnished ? "Yes" : "No"} />
                <Fact label="Parking" value={listing.parking?.toString() ?? "—"} />
                <Fact label="Availability" value={formatListingStatus(listing.availability)} />
              </dl>
              {listing.amenities.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {listing.amenities.map((slug) => (
                    <Badge key={slug} variant="secondary">{slug}</Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-2xl">
            <CardContent className="pt-6">
              <h3 className="mb-3 font-heading text-lg font-semibold">Media ({listing.media.length})</h3>
              {listing.media.length === 0 ? (
                <p className="text-sm text-muted-foreground">No photos, videos, or floor plans uploaded.</p>
              ) : (
                <PropertyGallery media={listing.media} title={listing.title} mediaOrigin={API_ORIGIN} />
              )}
            </CardContent>
          </Card>

          <Card className="rounded-2xl">
            <CardContent className="pt-6">
              <h3 className="mb-1 font-heading text-lg font-semibold">Verification</h3>
              <p className="mb-4 text-sm text-muted-foreground">
                Listing checks cover property, location, price, availability and media freshness. Only saved VERIFIED checks become public badges.
              </p>
              <VerificationEditor
                subjectType="LISTING"
                subjectId={listing.id}
                rows={verifications}
                otherSubjectRows={advertiserVerifications}
              />
            </CardContent>
          </Card>

          <Card className="rounded-2xl">
            <CardContent className="pt-6">
              <h3 className="mb-1 font-heading text-lg font-semibold">Advertiser verification</h3>
              <p className="mb-4 text-sm text-muted-foreground">
                Identity, business, regulatory and authority checks apply to this advertiser across their listings.
              </p>
              <VerificationEditor
                subjectType="ADVERTISER"
                subjectId={listing.advertiser.id}
                rows={advertiserVerifications}
                otherSubjectRows={verifications}
              />
            </CardContent>
          </Card>
        </div>

        <aside className="order-first space-y-4 lg:order-last lg:sticky lg:top-6">
          <Card className="rounded-2xl border-primary/20 shadow-sm">
            <CardContent className="pt-6">
              <p className="mb-1 text-xs font-semibold uppercase tracking-[0.12em] text-accent">Decision</p>
              <h3 className="mb-4 font-heading text-lg font-semibold">Review this listing</h3>
              <ReviewActions listingId={listing.id} lifecycle={lifecycle} />
            </CardContent>
          </Card>

          <Card className="rounded-2xl">
            <CardContent className="pt-6">
              <h3 className="mb-2 font-heading text-lg font-semibold">Advertiser</h3>
              <p className="font-medium">{listing.advertiser.name}</p>
              {listing.advertiser.agencyName && (
                <p className="text-sm text-muted-foreground">{listing.advertiser.agencyName}</p>
              )}
              {listing.advertiser.phone && (
                <p className="mt-1 text-sm text-muted-foreground">{listing.advertiser.phone}</p>
              )}
              <Link
                href={`/admin/users?q=${encodeURIComponent(listing.advertiser.name)}`}
                className="mt-3 inline-block text-sm text-primary hover:underline"
              >
                Find this account
              </Link>
            </CardContent>
          </Card>

          <Card className="rounded-2xl">
            <CardContent className="pt-6">
              <h3 className="mb-3 font-heading text-lg font-semibold">Costs as disclosed</h3>
              {listing.costs.length === 0 ? (
                <p className="text-sm text-muted-foreground">The advertiser disclosed no extra fees.</p>
              ) : (
                <ul className="space-y-1.5 text-sm">
                  {listing.costs.map((cost) => (
                    <li key={cost.type} className="flex justify-between gap-3">
                      <span className="text-muted-foreground">{COST_LABELS[cost.type]}</span>
                      <span className="font-medium">{formatPrice(cost.amount)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-2xl">
            <CardContent className="pt-6">
              <h3 className="mb-4 font-heading text-lg font-semibold">Action history</h3>
              {actions.length === 0 ? (
                <p className="text-sm text-muted-foreground">No moderation actions recorded yet.</p>
              ) : (
                <ol className="space-y-4 text-sm">
                  {actions.map((action) => (
                    <li key={action.id} className="relative border-l border-border pb-1 pl-4 last:pb-0">
                      <span className="absolute -left-[4.5px] top-1 size-2 rounded-full bg-accent" aria-hidden="true" />
                      <p className="font-medium">{action.action.replace(/_/g, " ").toLowerCase()}</p>
                      <p className="text-xs text-muted-foreground">
                        {action.actorName ?? action.actorId} · {formatDate(action.createdAt)}
                      </p>
                      {action.reason && <p className="mt-1 text-muted-foreground">{action.reason}</p>}
                    </li>
                  ))}
                </ol>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-2xl">
            <CardContent className="pt-6">
              <h3 className="mb-2 font-heading text-lg font-semibold">Dates</h3>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>Created {formatDate(listing.createdAt)}</li>
                <li>Updated {formatDate(listing.updatedAt)}</li>
                {listing.publishedAt && <li>Published {formatDate(listing.publishedAt)}</li>}
                {listing.confirmedAt && <li>Last confirmed {formatDate(listing.confirmedAt)}</li>}
                {listing.expiresAt && <li>Expires {formatDate(listing.expiresAt)}</li>}
              </ul>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}

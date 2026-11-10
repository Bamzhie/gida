import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Pencil } from "lucide-react";
import { ApiError, apiGetAuthed } from "@/lib/api";
import { API_ORIGIN } from "@/lib/api-base";
import { ListingRowActions } from "@/components/dashboard/listing-row-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ImageLightbox } from "@/components/ui/image-lightbox";
import type { Lifecycle, OwnerListingDetailDto } from "@/lib/api-types";
import { resolveMediaUrl } from "@/lib/media";
import { getAmenityLabels } from "@/lib/listings";
import { getCurrentUser } from "@/lib/session";
import { formatDate, formatListingStatus, formatPrice, formatPricePeriod } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Listing details",
  description: "Review and manage one of your private Gida listings.",
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const LIFECYCLE: Record<Lifecycle, { label: string; variant: "secondary" | "success" | "warning" }> = {
  DRAFT: { label: "Draft", variant: "secondary" },
  SUBMITTED: { label: "In review", variant: "warning" },
  UNDER_REVIEW: { label: "In review", variant: "warning" },
  PUBLISHED: { label: "Live", variant: "success" },
  PAUSED: { label: "Paused", variant: "warning" },
  EXPIRED: { label: "Expired", variant: "secondary" },
  REJECTED: { label: "Needs changes", variant: "warning" },
  SUSPENDED: { label: "Suspended", variant: "secondary" },
};

const COST_LABELS: Record<string, string> = {
  AGENCY_FEE: "Agency fee",
  LEGAL_FEE: "Legal fee",
  SERVICE_CHARGE: "Service charge",
  CAUTION: "Caution fee",
  OTHER: "Other cost",
};

export default async function AgentListingDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=" + encodeURIComponent("/dashboard/agent/listings/" + id));
  if (user.role !== "AGENT") redirect(user.role === "ADMIN" ? "/admin" : "/dashboard/buyer");
  if (!UUID.test(id)) notFound();

  let ownerDetail: OwnerListingDetailDto;
  try {
    ownerDetail = await apiGetAuthed<OwnerListingDetailDto>("/me/listings/" + id);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }
  const listing = ownerDetail.listing;
  const status = LIFECYCLE[ownerDetail.lifecycle] ?? LIFECYCLE.DRAFT;
  const period = formatPricePeriod({ listingType: listing.listingType, pricePeriod: listing.pricePeriod });
  const amenityLabels = await getAmenityLabels();
  const imageMedia = listing.media.filter((media) =>
    media.kind === "PHOTO" || (media.kind === "FLOOR_PLAN" && !media.url.toLowerCase().endsWith(".pdf"))
  );
  const lightboxImages = imageMedia.map((media, index) => ({
    src: resolveMediaUrl(API_ORIGIN, media.url),
    alt: media.caption ?? `${listing.title}, image ${index + 1}`,
  }));
  const canEdit = ["DRAFT", "REJECTED", "SUBMITTED", "UNDER_REVIEW"].includes(ownerDetail.lifecycle);

  return (
    <div>
      <Link href="/dashboard/agent/listings" className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden="true" /> My listings
      </Link>
      <div className="mb-7 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <Badge variant={status.variant}>{status.label}</Badge>
            {ownerDetail.reviewNote && <Badge variant="outline">Review note available</Badge>}
          </div>
          <h2 className="font-heading text-2xl font-semibold">{listing.title}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{listing.area ?? "Location not set"}{listing.state ? ", " + listing.state : ""}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {canEdit && (
            <Button asChild variant="outline" className="rounded-xl">
              <Link href={"/dashboard/agent/listings/" + id + "/edit"}><Pencil aria-hidden="true" /> Edit details</Link>
            </Button>
          )}
          <ListingRowActions listingId={id} lifecycle={ownerDetail.lifecycle} listingType={listing.listingType} showDetails={false} showEdit={false} />
        </div>
      </div>

      <Card className="overflow-hidden rounded-2xl">
        <CardContent className="p-0">
          {ownerDetail.reviewNote && (
            <section aria-labelledby="review-feedback-heading" className="border-b border-amber-300/70 bg-amber-50/50 p-6 dark:bg-amber-950/20">
              <h3 id="review-feedback-heading" className="font-heading text-lg font-semibold">Review feedback</h3>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{ownerDetail.reviewNote}</p>
            </section>
          )}

          <div className="grid xl:grid-cols-[minmax(0,1.25fr)_minmax(20rem,0.75fr)]">
            <div className="divide-y divide-border border-b border-border xl:border-b-0 xl:border-r">
              <section aria-labelledby="media-heading" className="p-6">
                <h3 id="media-heading" className="font-heading text-lg font-semibold">Photos, video and floor plans</h3>
                {listing.media.length > 0 ? (
                  <div className="mt-4 grid gap-2 sm:grid-cols-2">
                    {listing.media.map((media, index) => (
                      <div key={media.url + index} className="flex min-h-40 items-center justify-center overflow-hidden rounded-xl bg-secondary/40">
                        {media.kind === "PHOTO" || (media.kind === "FLOOR_PLAN" && !media.url.toLowerCase().endsWith(".pdf")) ? (
                          <ImageLightbox
                            src={resolveMediaUrl(API_ORIGIN, media.url)}
                            alt={media.caption ?? `${listing.title}, image ${index + 1}`}
                            images={lightboxImages}
                            index={Math.max(0, imageMedia.findIndex((image) => image.url === media.url))}
                            buttonClassName="h-full w-full"
                            imageClassName="h-full max-h-[28rem] min-h-40 w-full object-cover"
                          />
                        ) : (
                          <a href={resolveMediaUrl(API_ORIGIN, media.url)} target="_blank" rel="noreferrer" className="p-6 text-sm font-medium text-primary hover:underline">
                            {media.kind === "VIDEO" ? "Open listing video" : "Open floor plan"}
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-4 flex min-h-40 items-center justify-center rounded-xl bg-secondary/30 px-6 text-sm text-muted-foreground">No listing media attached.</div>
                )}
              </section>

              <section aria-labelledby="description-heading" className="p-6">
                <h3 id="description-heading" className="font-heading text-lg font-semibold">Description</h3>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-muted-foreground">{listing.description || "No description added."}</p>
              </section>
            </div>

            <div className="divide-y divide-border">
              <section aria-labelledby="price-costs-heading" className="p-6">
                <h3 id="price-costs-heading" className="font-heading text-lg font-semibold">Price and costs</h3>
                <p className="mt-4 text-sm text-muted-foreground">{listing.listingType === "SALE" ? "Asking price" : "Basic rent"}</p>
                <p className="mt-1 font-heading text-2xl font-semibold">{formatPrice(listing.price)}</p>
                {listing.listingType === "RENT" && <p className="mt-1 text-sm text-muted-foreground">{period}</p>}
                {listing.costs.length > 0 ? (
                  <div className="mt-5 border-t border-border pt-4">
                    <h4 className="text-sm font-semibold">Additional costs</h4>
                    <dl className="mt-3 space-y-3">
                      {listing.costs.map((cost) => (
                        <div key={cost.type} className="flex justify-between gap-4 text-sm">
                          <dt className="text-muted-foreground">{COST_LABELS[cost.type] ?? cost.type}{cost.note ? <span className="block text-xs">{cost.note}</span> : null}</dt>
                          <dd className="shrink-0 font-medium">{formatPrice(cost.amount)}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                ) : (
                  <p className="mt-4 border-t border-border pt-4 text-sm text-muted-foreground">No additional costs listed.</p>
                )}
              </section>

              <section aria-labelledby="property-details-heading" className="p-6">
                <h3 id="property-details-heading" className="font-heading text-lg font-semibold">Property details</h3>
                <dl className="mt-4 grid gap-4 sm:grid-cols-2">
                  {[
                    ["Property type", listing.propertyType.replaceAll("_", " ").toLowerCase()],
                    ["Listing type", listing.listingType === "SALE" ? "For sale" : "For rent"],
                    ["Bedrooms", listing.bedrooms],
                    ["Bathrooms", listing.bathrooms],
                    ["Floor area", listing.sizeSqm === null ? null : listing.sizeSqm + " m²"],
                    ["Land size", listing.lotSizeSqm === null ? null : listing.lotSizeSqm + " m²"],
                    ["Year built", listing.yearBuilt],
                    ["Parking", listing.parking],
                    ["Furnishing", listing.furnished ? "Furnished" : "Not furnished"],
                    ["Availability", formatListingStatus(listing.availability)],
                  ].filter((entry) => entry[1] !== null).map(([label, value]) => (
                    <div key={String(label)} className="border-b border-border pb-3">
                      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
                      <dd className="mt-1 text-sm font-medium">{String(value)}</dd>
                    </div>
                  ))}
                </dl>
                {listing.amenities.length > 0 && (
                  <div className="mt-5">
                    <h4 className="text-sm font-semibold">Amenities</h4>
                    <ul className="mt-2 flex flex-wrap gap-2">
                      {listing.amenities.map((amenity) => <li key={amenity}><Badge variant="outline">{amenityLabels[amenity] ?? amenity}</Badge></li>)}
                    </ul>
                  </div>
                )}
              </section>

              <section aria-labelledby="listing-record-heading" className="p-6">
                <h3 id="listing-record-heading" className="font-heading text-lg font-semibold">Listing record</h3>
                <dl className="mt-4 space-y-3 text-sm">
                  <div className="flex justify-between gap-3"><dt className="text-muted-foreground">Created</dt><dd>{formatDate(listing.createdAt)}</dd></div>
                  <div className="flex justify-between gap-3"><dt className="text-muted-foreground">Last updated</dt><dd>{formatDate(listing.updatedAt)}</dd></div>
                  {listing.publishedAt && <div className="flex justify-between gap-3"><dt className="text-muted-foreground">Published</dt><dd>{formatDate(listing.publishedAt)}</dd></div>}
                  {listing.expiresAt && <div className="flex justify-between gap-3"><dt className="text-muted-foreground">Expires</dt><dd>{formatDate(listing.expiresAt)}</dd></div>}
                </dl>
              </section>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

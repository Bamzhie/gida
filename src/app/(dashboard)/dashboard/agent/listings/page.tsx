import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Building2, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ListingRowActions } from "@/components/dashboard/listing-row-actions";
import { apiGetAuthed } from "@/lib/api";
import type { Lifecycle, OwnerListingDto, PageResponse } from "@/lib/api-types";
import { getCurrentUser } from "@/lib/session";
import { formatDate, formatListingStatus, formatPrice, formatPricePeriod } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "My listings",
  description: "Manage the listings you advertise on Gida.",
};

const LIFECYCLE_BADGES: Record<Lifecycle, { label: string; variant: "secondary" | "success" | "warning" }> = {
  DRAFT: { label: "Draft", variant: "secondary" },
  SUBMITTED: { label: "In review", variant: "warning" },
  UNDER_REVIEW: { label: "In review", variant: "warning" },
  PUBLISHED: { label: "Live", variant: "success" },
  PAUSED: { label: "Paused", variant: "warning" },
  EXPIRED: { label: "Expired", variant: "secondary" },
  REJECTED: { label: "Needs changes", variant: "warning" },
  SUSPENDED: { label: "Suspended", variant: "secondary" },
};

export default async function AgentListingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=%2Fdashboard%2Fagent%2Flistings");
  if (user.role !== "AGENT") redirect(user.role === "ADMIN" ? "/admin" : "/dashboard/buyer");

  const listings: OwnerListingDto[] = [];
  let page = 1;
  let pages = 1;
  do {
    const response = await apiGetAuthed<PageResponse<OwnerListingDto>>("/me/listings", { page, size: 100 });
    listings.push(...response.items);
    pages = response.pages;
    page += 1;
  } while (page <= pages && page <= 5);

  return (
    <div>
      <div className="mb-7 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-heading text-xl font-semibold">Your listings</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {listings.length === 0 ? "Manage every property you advertise from here." : String(listings.length) + " listing" + (listings.length === 1 ? "" : "s") + ", newest first."}
          </p>
        </div>
        <Button asChild className="rounded-xl">
          <Link href="/dashboard/agent/listings/new"><Plus aria-hidden="true" /> New listing</Link>
        </Button>
      </div>

      {listings.length === 0 ? (
        <Card className="rounded-2xl">
          <CardContent className="py-12 text-center">
            <Building2 className="mx-auto mb-4 size-10 text-muted-foreground" aria-hidden="true" />
            <h3 className="font-heading text-lg font-semibold">No listings yet</h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">Draft your first property, add its details, then upload photos and send it for review.</p>
            <Button asChild className="mt-5 rounded-xl"><Link href="/dashboard/agent/listings/new">Create a listing</Link></Button>
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border">
          <table className="w-full min-w-[48rem] text-sm">
            <thead className="bg-secondary/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th scope="col" className="px-4 py-3 font-medium">Property</th>
                <th scope="col" className="px-4 py-3 font-medium">Status</th>
                <th scope="col" className="px-4 py-3 font-medium">Price</th>
                <th scope="col" className="px-4 py-3 font-medium">Availability</th>
                <th scope="col" className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {listings.map((listing) => {
                const badge = LIFECYCLE_BADGES[listing.lifecycle] ?? LIFECYCLE_BADGES.DRAFT;
                const listingType = listing.pricePeriod ? "RENT" : "SALE";
                const period = formatPricePeriod({ listingType, pricePeriod: listing.pricePeriod });
                return (
                  <tr key={listing.id} className="border-t border-border align-middle">
                    <td className="px-4 py-3">
                      <Link href={"/dashboard/agent/listings/" + listing.id} className="font-medium hover:underline">{listing.title}</Link>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {listing.publishedAt ? "Published " + formatDate(listing.publishedAt) : "Drafted " + formatDate(listing.createdAt)}
                      </p>
                      {listing.reviewNote && (
                        <p className="mt-2 max-w-md rounded-lg bg-secondary/60 px-3 py-2 text-xs text-muted-foreground">{listing.reviewNote}</p>
                      )}
                    </td>
                    <td className="px-4 py-3"><Badge variant={badge.variant}>{badge.label}</Badge></td>
                    <td className="px-4 py-3">{formatPrice(listing.price)}{period && <span className="text-muted-foreground"> {period}</span>}</td>
                    <td className="px-4 py-3">{formatListingStatus(listing.availability)}</td>
                    <td className="px-4 py-3"><ListingRowActions listingId={listing.id} lifecycle={listing.lifecycle} listingType={listingType} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

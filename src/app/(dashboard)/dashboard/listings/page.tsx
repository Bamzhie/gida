import type { Metadata } from "next";
import Link from "next/link";
import { Building2, LogIn, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ListingRowActions } from "@/components/dashboard/listing-row-actions";
import { apiGetAuthed } from "@/lib/api";
import type { OwnerListingDto, PageResponse } from "@/lib/api-types";
import { getCurrentUser } from "@/lib/session";
import { formatDate, formatListingStatus, formatPrice, formatPricePeriod } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "My listings",
  description: "Manage the listings you publish on Gida.",
};

const LIFECYCLE_BADGES: Record<OwnerListingDto["lifecycle"], { label: string; variant: "secondary" | "success" | "warning" }> = {
  DRAFT: { label: "Draft", variant: "secondary" },
  SUBMITTED: { label: "In review", variant: "warning" },
  UNDER_REVIEW: { label: "In review", variant: "warning" },
  PUBLISHED: { label: "Live", variant: "success" },
  PAUSED: { label: "Paused", variant: "warning" },
  EXPIRED: { label: "Expired", variant: "secondary" },
  REJECTED: { label: "Rejected", variant: "secondary" },
  SUSPENDED: { label: "Suspended", variant: "secondary" },
};

export default async function MyListingsPage() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <Building2 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">My listings</h1>
        <p className="text-muted-foreground mb-6">Sign in to manage the listings you publish.</p>
        <Button asChild>
          <Link href={`/login?next=${encodeURIComponent("/dashboard/listings")}`}>
            <LogIn className="h-4 w-4" /> Sign in
          </Link>
        </Button>
      </div>
    );
  }
  if (user.role !== "AGENT" && user.role !== "ADMIN") {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <Building2 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">Listing is for advertiser accounts</h1>
        <p className="text-muted-foreground">
          Your account is a browser account, so it can save and enquire but not publish.
        </p>
      </div>
    );
  }

  const listings: OwnerListingDto[] = [];
  let page = 1;
  let pages = 1;
  do {
    const response = await apiGetAuthed<PageResponse<OwnerListingDto>>("/me/listings", {
      page,
      size: 100,
    });
    listings.push(...response.items);
    pages = response.pages;
    page += 1;
  } while (page <= pages && page <= 5);

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold">My listings</h1>
          <p className="mt-2 text-muted-foreground">
            {listings.length === 0
              ? "Nothing published yet."
              : `${listings.length} listing${listings.length === 1 ? "" : "s"}, newest first.`}
          </p>
        </div>
        <Button asChild className="rounded-xl">
          <Link href="/dashboard/listings/new">
            <Plus /> New listing
          </Link>
        </Button>
      </div>

      {listings.length === 0 ? (
        <Card className="rounded-2xl">
          <CardContent className="py-12 text-center">
            <Building2 className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <h2 className="mb-2 font-heading text-lg font-semibold">No listings yet</h2>
            <p className="mx-auto mb-6 max-w-md text-sm text-muted-foreground">
              Draft your first property, upload its photos, and publish when the details hold up.
            </p>
            <Button asChild className="rounded-xl">
              <Link href="/dashboard/listings/new">Draft a listing</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border">
          {/* The owner-list API carries no media or enquiry counts, so those planned columns cannot be rendered. */}
          <table className="w-full min-w-[46rem] text-sm">
            <thead className="bg-secondary/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th scope="col" className="px-4 py-3 font-medium">Listing</th>
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
                      <p className="font-medium">{listing.title}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {listing.publishedAt ? `Published ${formatDate(listing.publishedAt)}` : `Drafted ${formatDate(listing.createdAt)}`}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={badge.variant}>{badge.label}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium">{formatPrice(listing.price)}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{period}</p>
                    </td>
                    <td className="px-4 py-3">{formatListingStatus(listing.availability)}</td>
                    <td className="px-4 py-3">
                      <ListingRowActions
                        listingId={listing.id}
                        lifecycle={listing.lifecycle}
                        listingType={listingType}
                      />
                    </td>
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

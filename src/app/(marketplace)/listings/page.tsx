import type { Metadata } from "next";
import Link from "next/link";
import { X } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { ListingCard } from "@/components/marketplace/listing-card";
import { ListingFilters } from "@/components/marketplace/listing-filters";
import { getFavoriteIdSet } from "@/lib/favorites";
import { getLocations, searchListings } from "@/lib/listings";
import { toCardModel } from "@/lib/listing-view";
import {
  listingQueryToSearchParams,
  parseListingQuery,
  toListingSearch,
  type ListingQuery,
  type ListingSort,
} from "@/lib/listing-params";
import { formatPrice } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Property listings",
  description:
    "Search homes for rent and sale across Lagos. Filter by area, price, bedrooms, property type and availability.",
  alternates: { canonical: "/listings" },
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function toUrlSearchParams(record: Record<string, string | string[] | undefined>): URLSearchParams {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(record)) {
    if (Array.isArray(value)) {
      for (const item of value) params.append(key, item);
    } else if (value !== undefined) {
      params.append(key, value);
    }
  }
  return params;
}

function hrefFor(query: ListingQuery): string {
  const suffix = listingQueryToSearchParams(query).toString();
  return suffix ? `/listings?${suffix}` : "/listings";
}

function withoutFilter(query: ListingQuery, key: keyof ListingQuery): ListingQuery {
  const next = { ...query };
  delete next[key];
  return next;
}

const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
] as const;

const SORT_LABELS: Record<ListingSort, string> = {
  newest: "Newest",
  oldest: "Oldest",
  "price-asc": "Price: low to high",
  "price-desc": "Price: high to low",
  updated: "Recently updated",
  confirmed: "Recently confirmed",
  relevance: "Best match",
};

const TYPE_LABELS: Record<string, string> = {
  APARTMENT: "apartments",
  HOUSE: "houses",
  TOWNHOUSE: "townhouses",
  CONDO: "condos",
  LAND: "land",
  COMMERCIAL: "commercial properties",
};

const STATUS_LABELS = { AVAILABLE: "Available", PENDING: "Pending", SOLD: "Sold", RENTED: "Rented" } as const;
const CATEGORY_LABELS = { STANDARD: "Standard", NEW_HOMES: "New homes", SHORTLET: "Short-let" } as const;

function headingFor(query: ListingQuery): string {
  if (query.availability === "SOLD") return "Sold properties";
  if (query.availability === "RENTED") return "Rented properties";
  if (query.category === "SHORTLET") return "Short-let homes";
  if (query.category === "NEW_HOMES") return "New homes";
  return (
    [
      query.bedrooms ? `${query.bedrooms}+ bedroom` : "",
      query.propertyType ? TYPE_LABELS[query.propertyType] ?? query.propertyType.toLowerCase() : "properties",
      query.listingType === "RENT" ? "for rent" : query.listingType === "SALE" ? "for sale" : "",
    ]
      .filter(Boolean)
      .join(" ") || "All properties"
  );
}

export default async function ListingsPage({ searchParams }: { searchParams: SearchParams }) {
  const query = parseListingQuery(toUrlSearchParams(await searchParams));
  const [result, locations, favorites] = await Promise.all([
    searchListings(toListingSearch(query)).catch(() => null),
    getLocations().catch(() => []),
    getFavoriteIdSet(),
  ]);

  const listings = result?.items.map(toCardModel) ?? [];
  const total = result?.total ?? 0;
  const page = query.page ?? 1;
  const pages = result?.pages ?? 0;
  const areaName = locations.find((location) => location.slug === query.location)?.name ?? query.location;
  const filterKey = listingQueryToSearchParams(query).toString();
  const mapQuery = listingQueryToSearchParams(query).toString();

  const activeFilters: { key: keyof ListingQuery; label: string }[] = [
    ...(query.q ? [{ key: "q" as const, label: `Search: ${query.q}` }] : []),
    ...(query.location ? [{ key: "location" as const, label: `Area: ${areaName}` }] : []),
    ...(query.listingType ? [{ key: "listingType" as const, label: query.listingType === "SALE" ? "For sale" : "For rent" }] : []),
    ...(query.availability ? [{ key: "availability" as const, label: STATUS_LABELS[query.availability] }] : []),
    ...(query.category ? [{ key: "category" as const, label: CATEGORY_LABELS[query.category] }] : []),
    ...(query.propertyType ? [{ key: "propertyType" as const, label: query.propertyType }] : []),
    ...(query.bedrooms ? [{ key: "bedrooms" as const, label: `${query.bedrooms}+ beds` }] : []),
    ...(query.minPrice ? [{ key: "minPrice" as const, label: `From ${formatPrice(query.minPrice)}` }] : []),
    ...(query.maxPrice ? [{ key: "maxPrice" as const, label: `Up to ${formatPrice(query.maxPrice)}` }] : []),
    ...(query.sort && query.sort !== "newest" ? [{ key: "sort" as const, label: SORT_LABELS[query.sort] }] : []),
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[17rem_minmax(0,1fr)] lg:gap-8">
        <ListingFilters key={filterKey} query={query} locations={locations} />
        <div className="min-w-0">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="font-heading text-3xl font-semibold">{headingFor(query)}</h1>
              <p className="mt-1 text-muted-foreground">
                {total} {total === 1 ? "property" : "properties"} found
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-muted-foreground">Sort</span>
              {SORT_OPTIONS.map((option) => (
                <Link
                  key={option.value}
                  href={hrefFor({ ...query, sort: option.value, page: undefined })}
                  aria-current={(query.sort ?? "newest") === option.value ? "true" : undefined}
                  className={buttonVariants({
                    size: "sm",
                    variant: (query.sort ?? "newest") === option.value ? "default" : "outline",
                  })}
                >
                  {option.label}
                </Link>
              ))}
              <Button size="sm" variant="outline" asChild>
                <Link href={mapQuery ? `/map?${mapQuery}` : "/map"}>Map view</Link>
              </Button>
            </div>
          </div>

          {activeFilters.length > 0 && (
            <div className="mb-6 flex flex-wrap items-center gap-2" aria-label="Active filters">
              {activeFilters.map(({ key, label }) => (
                <Link
                  key={key}
                  href={hrefFor(withoutFilter(query, key))}
                  aria-label={`Remove ${label} filter`}
                  className="inline-flex min-h-9 items-center gap-1 rounded-full border border-input bg-card px-3 text-xs hover:bg-secondary"
                >
                  {label}
                  <X className="h-3.5 w-3.5" />
                </Link>
              ))}
              <Button size="sm" variant="ghost" asChild>
                <Link href="/listings">Clear all</Link>
              </Button>
            </div>
          )}

          {result === null ? (
            <div className="rounded-2xl border border-border bg-card px-5 py-16 text-center">
              <p className="text-lg font-medium">Listings are temporarily unavailable</p>
              <p className="mt-2 text-sm text-muted-foreground">
                The marketplace service could not be reached. Try again in a moment.
              </p>
              <Button variant="link" asChild>
                <Link href="/listings">Back to all listings</Link>
              </Button>
            </div>
          ) : listings.length === 0 ? (
            <div className="rounded-2xl border border-border bg-card px-5 py-16 text-center">
              <p className="text-lg font-medium">
                {query.availability === "SOLD"
                  ? "No sold properties match those filters."
                  : query.availability === "RENTED"
                    ? "No rented properties match those filters."
                    : "No properties match those filters."}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Try widening your search or clearing some filters.
              </p>
              <Button variant="link" asChild>
                <Link href="/listings">Clear filters</Link>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              {listings.map((listing) => (
                <ListingCard
                  key={`${listing.id}-${favorites.has(listing.id) ? "s" : "u"}`}
                  listing={listing}
                  saved={favorites.has(listing.id)}
                />
              ))}
            </div>
          )}

          {pages > 1 && (
            <nav className="mt-10 flex flex-wrap items-center justify-center gap-3" aria-label="Pagination">
              {page > 1 && (
                <Link href={hrefFor({ ...query, page: page - 1 })} className={buttonVariants({ variant: "outline" })}>
                  Previous
                </Link>
              )}
              <span className="text-sm text-muted-foreground">Page {page} of {pages}</span>
              {page < pages && (
                <Link href={hrefFor({ ...query, page: page + 1 })} className={buttonVariants({ variant: "outline" })}>
                  Next
                </Link>
              )}
            </nav>
          )}
        </div>
      </div>
    </div>
  );
}
